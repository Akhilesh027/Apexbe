import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  BadgeCheck,
  Eye,
  Copy,
  Wallet,
  Banknote,
  AlertCircle,
  Search,
  User,
  Building2,
  Calendar,
  Hash,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const API_BASE = "https://api.apexbee.in/api";

type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

type Withdrawal = {
  _id: string;
  amount: number;
  status: WithdrawalStatus;
  note?: string;
  createdAt: string;
  processedAt?: string;
  referenceId?: string;
  rejectReason?: string;

  bankSnapshot?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
  };

  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    referralCode?: string;
    walletBalance?: number;
  };

  userCurrentBalance?: number;
  walletDeductedAtCreate?: boolean;
};

const maskAccount = (acc?: string) => {
  if (!acc) return "-";
  const s = String(acc);
  if (s.length <= 4) return s;
  return `****${s.slice(-4)}`;
};

const formatCurrency = (amount?: number) => {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AdminWithdrawals() {
  const { toast } = useToast();

  const [tab, setTab] = useState<"all" | WithdrawalStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refMap, setRefMap] = useState<Record<string, string>>({});
  const [rejMap, setRejMap] = useState<Record<string, string>>({});

  const [openBank, setOpenBank] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: WithdrawalStatus;
  } | null>(null);

  // Simple headers – no token required
  const headers = { "Content-Type": "application/json" };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const qs = tab === "all" ? "" : `?status=${tab}`;

      const res = await fetch(`${API_BASE}/admin/withdrawals${qs}`, {
        headers,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Failed",
          description: json?.message || "Unable to load withdrawals",
          variant: "destructive",
        });
        return;
      }

      setItems(Array.isArray(json?.withdrawals) ? json.withdrawals : []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Server error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/stats`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const statusBadge = (s: WithdrawalStatus) => {
    const map: Record<
      WithdrawalStatus,
      { className: string; icon: any; label: string }
    > = {
      pending: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending",
      },
      approved: {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: BadgeCheck,
        label: "Approved",
      },
      rejected: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Rejected",
      },
      paid: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        label: "Paid",
      },
    };
    const Icon = map[s].icon;
    return (
      <Badge className={`${map[s].className} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {map[s].label}
      </Badge>
    );
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((w) => {
      const u = w.userId || {};
      const bank = w.bankSnapshot || {};
      return (
        String(w._id).toLowerCase().includes(q) ||
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phone || "").toLowerCase().includes(q) ||
        String(u.referralCode || "").toLowerCase().includes(q) ||
        String(bank.accountHolderName || "").toLowerCase().includes(q) ||
        String(bank.accountNumber || "").toLowerCase().includes(q) ||
        String(bank.ifsc || "").toLowerCase().includes(q) ||
        String(bank.bankName || "").toLowerCase().includes(q) ||
        String(bank.upiId || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const copyText = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: label ? `${label} copied to clipboard` : "Copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy",
        variant: "destructive",
      });
    }
  };

  const openBankModal = (w: Withdrawal) => {
    setSelected(w);
    setOpenBank(true);
  };

  const handleUpdateStatus = (id: string, status: WithdrawalStatus) => {
    setConfirmAction({ id, status });
    setOpenConfirmDialog(true);
  };

  const confirmUpdate = async () => {
    if (!confirmAction) return;

    const { id, status } = confirmAction;

    try {
      setUpdatingId(id);

      const payload: any = { status };
      const ref = (refMap[id] || "").trim();
      const rej = (rejMap[id] || "").trim();

      if (status === "paid" || status === "approved") {
        if (ref) payload.referenceId = ref;
      }

      if (status === "rejected") {
        payload.rejectReason = rej || "Rejected by admin";
      }

      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Update failed",
          description: json?.message || "Unable to update status",
          variant: "destructive",
        });
        return;
      }

      if (status === "paid") {
        toast({
          title: "Withdrawal Marked as Paid ✅",
          description: "Withdrawal marked as paid successfully.",
        });
      } else if (status === "rejected") {
        toast({
          title: "Withdrawal Rejected",
          description: "Request rejected and amount refunded to user's wallet.",
        });
      } else if (status === "approved") {
        toast({
          title: "Withdrawal Approved",
          description: "Request approved. Ready to process payment.",
        });
      }

      setRefMap((p) => ({ ...p, [id]: "" }));
      setRejMap((p) => ({ ...p, [id]: "" }));

      await fetchWithdrawals();
      await fetchStats();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Server error",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
      setOpenConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const getTotalPendingAmount = () => {
    return items
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-navy to-blue-600 bg-clip-text text-transparent">
              Withdrawal Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and process withdrawal requests. Amount is deducted from wallet at request creation.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchWithdrawals}
            disabled={loading}
            className="shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.stats?.find((s: any) => s._id === "pending")?.count || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending Amount
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(getTotalPendingAmount())}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Paid
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.paidTotal)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Processed
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(stats.stats
                        ?.filter((s: any) => s._id !== "pending")
                        .reduce((sum: number, s: any) => sum + s.count, 0)) || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-xl">Withdrawal Requests</CardTitle>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="paid">Paid</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, bank, IFSC..."
                    className="pl-9 w-full md:w-[320px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                Loading withdrawals...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium">No withdrawals found</p>
                <p className="text-sm">Try changing the status filter or search query</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-gray-700">User</th>
                      <th className="p-4 font-semibold text-gray-700">Bank Details</th>
                      <th className="p-4 font-semibold text-gray-700">Amount</th>
                      <th className="p-4 font-semibold text-gray-700">Status</th>
                      <th className="p-4 font-semibold text-gray-700">Created</th>
                      <th className="p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((w) => {
                      const u = w.userId || {};
                      const b = w.bankSnapshot || {};
                      const busy = updatingId === w._id;

                      return (
                        <tr key={w._id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-semibold text-navy">
                                  {u.name || "Unknown"}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {u.email || "-"}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {u.phone || "-"}
                                </div>

                                {u.referralCode && (
                                  <Badge variant="outline" className="mt-1 bg-blue-50 text-xs">
                                    Code: {u.referralCode}
                                  </Badge>
                                )}

                                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                                  <Wallet className="h-3 w-3" />
                                  Balance:{" "}
                                  {formatCurrency(w.userCurrentBalance || u.walletBalance)}
                                </div>

                                <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                                  ID: {w._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {b.accountHolderName || "-"}
                              </div>
                              <div className="text-muted-foreground text-xs flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {b.bankName || "-"}
                              </div>
                              <div className="text-muted-foreground text-xs font-mono">
                                A/C: {maskAccount(b.accountNumber)}
                              </div>
                              <div className="text-muted-foreground text-xs font-mono">
                                IFSC: {b.ifsc || "-"}
                              </div>

                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openBankModal(w)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyText(b.accountNumber || "", "Account Number")
                                  }
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-navy text-xl">
                              {formatCurrency(w.amount)}
                            </div>
                          </td>

                          <td className="p-4">{statusBadge(w.status)}</td>

                          <td className="p-4 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(w.createdAt)}
                            </div>
                            {w.processedAt && (
                              <div className="mt-1 text-xs">
                                Processed: {formatDate(w.processedAt)}
                              </div>
                            )}
                            {w.referenceId && (
                              <div className="mt-1 text-xs font-mono flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Ref: {w.referenceId}
                              </div>
                            )}
                            {w.status === "rejected" && w.rejectReason && (
                              <div className="mt-1 text-red-600 text-xs">
                                Reason: {w.rejectReason}
                              </div>
                            )}
                            {w.note && (
                              <div className="mt-1 text-muted-foreground text-xs">
                                Note: {w.note}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="space-y-2">
                              {(w.status === "pending" || w.status === "approved") && (
                                <Input
                                  value={refMap[w._id] || ""}
                                  onChange={(e) =>
                                    setRefMap((p) => ({ ...p, [w._id]: e.target.value }))
                                  }
                                  placeholder="Reference ID (optional)"
                                  className="text-sm"
                                />
                              )}

                              {w.status === "pending" && (
                                <Input
                                  value={rejMap[w._id] || ""}
                                  onChange={(e) =>
                                    setRejMap((p) => ({ ...p, [w._id]: e.target.value }))
                                  }
                                  placeholder="Reject reason (if rejecting)"
                                  className="text-sm"
                                />
                              )}

                              <div className="flex flex-wrap gap-2">
                                {w.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={busy}
                                      onClick={() => handleUpdateStatus(w._id, "paid")}
                                    >
                                      {busy ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                      )}
                                      Mark Paid
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={busy}
                                      onClick={() => handleUpdateStatus(w._id, "rejected")}
                                    >
                                      {busy ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3 w-3 mr-1" />
                                      )}
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {w.status === "approved" && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={busy}
                                    onClick={() => handleUpdateStatus(w._id, "paid")}
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    )}
                                    Confirm Payment
                                  </Button>
                                )}

                                {w.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => handleUpdateStatus(w._id, "approved")}
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <BadgeCheck className="h-3 w-3 mr-1" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                              </div>

                              <div className="text-[10px] text-muted-foreground">
                                {w.status === "pending" &&
                                  "Amount already deducted from wallet"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Details Dialog */}
        <Dialog open={openBank} onOpenChange={setOpenBank}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </DialogTitle>
              <DialogDescription>
                Complete banking information for this withdrawal request
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const w = selected;
              const u = w?.userId || {};
              const b = w?.bankSnapshot || {};
              if (!w) return <div className="text-muted-foreground">No data</div>;

              return (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-navy text-lg">
                          {u.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {u.email || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {u.phone || "-"}
                        </div>
                      </div>
                      {statusBadge(w.status)}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Current Balance:{" "}
                        <strong>
                          {formatCurrency(w.userCurrentBalance || u.walletBalance)}
                        </strong>
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2 font-mono">
                      Withdrawal ID: {w._id}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3 bg-white">
                      <div className="text-xs text-muted-foreground mb-1">
                        Account Holder
                      </div>
                      <div className="font-semibold">{b.accountHolderName || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3 bg-white">
                      <div className="text-xs text-muted-foreground mb-1">Bank Name</div>
                      <div className="font-semibold">{b.bankName || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3 bg-white">
                      <div className="text-xs text-muted-foreground mb-1">
                        Account Number
                      </div>
                      <div className="font-mono font-semibold">
                        {b.accountNumber || "-"}
                      </div>
                    </div>

                    <div className="rounded-lg border p-3 bg-white">
                      <div className="text-xs text-muted-foreground mb-1">IFSC Code</div>
                      <div className="font-mono font-semibold">{b.ifsc || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3 bg-white md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">UPI ID</div>
                      <div className="font-mono font-semibold">{b.upiId || "-"}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-gray-50">
                    <div className="text-xs text-muted-foreground mb-2 font-semibold">
                      Request Details
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-lg">
                          Amount:{" "}
                          <span className="font-bold text-navy">
                            {formatCurrency(w.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(w.createdAt)}
                        </div>
                        {w.processedAt && (
                          <div className="text-xs text-muted-foreground">
                            Processed: {formatDate(w.processedAt)}
                          </div>
                        )}
                        {w.referenceId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Reference: {w.referenceId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenBank(false)}>
                Close
              </Button>
              <Button
                onClick={() =>
                  copyText(
                    JSON.stringify(selected?.bankSnapshot || {}, null, 2),
                    "Bank Details"
                  )
                }
                className="bg-navy hover:bg-navy/90"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to{" "}
                {confirmAction?.status === "paid"
                  ? "mark as paid"
                  : confirmAction?.status === "rejected"
                  ? "reject"
                  : "approve"}{" "}
                this withdrawal request?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmUpdate}
                className={
                  confirmAction?.status === "paid"
                    ? "bg-green-600 hover:bg-green-700"
                    : confirmAction?.status === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}