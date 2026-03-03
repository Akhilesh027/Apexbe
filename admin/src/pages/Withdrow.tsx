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
    walletBalance?: number; // ✅ optional (only if backend sends)
  };

  // ✅ optional server hints (recommended)
  walletDeductedAtCreate?: boolean; // if your backend returns this
};

const maskAccount = (acc?: string) => {
  if (!acc) return "-";
  const s = String(acc);
  if (s.length <= 4) return s;
  return `****${s.slice(-4)}`;
};

export default function AdminWithdrawals() {
  const { toast } = useToast();

  // ✅ allow "all"
  const [tab, setTab] = useState<"all" | WithdrawalStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState("");

  // ✅ per-row update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refMap, setRefMap] = useState<Record<string, string>>({});
  const [rejMap, setRejMap] = useState<Record<string, string>>({});

  // ✅ bank dialog
  const [openBank, setOpenBank] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => {
    const token = getToken();
    if (!token) throw new Error("No token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const qs = tab === "all" ? "" : `?status=${tab}`;

      const res = await fetch(`${API_BASE}/admin/withdrawals${qs}`, {
        headers: authHeaders(),
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

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const statusBadge = (s: WithdrawalStatus) => {
    const map: Record<WithdrawalStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      paid: "bg-green-100 text-green-800 border-green-200",
    };
    return <Badge className={map[s]}>{s.toUpperCase()}</Badge>;
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

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

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Copied to clipboard" });
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

  const updateStatus = async (id: string, status: WithdrawalStatus) => {
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
        headers: authHeaders(),
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

      // ✅ success detect + wallet message
      if (status === "paid") {
        // if backend returns this hint, show proper message
        const deductedAtCreate = Boolean(json?.withdrawal?.walletDeductedAtCreate);

        toast({
          title: "Withdrawal Paid ✅",
          description: deductedAtCreate
            ? "Marked as PAID. Wallet was already deducted when request was created."
            : "Marked as PAID. Backend should deduct wallet now (ensure your PATCH API does this).",
        });
      } else if (status === "rejected") {
        toast({
          title: "Rejected",
          description: "Status changed to REJECTED. (If you deducted wallet at creation, backend should refund now.)",
        });
      } else {
        toast({ title: "Updated", description: `Status changed to ${status.toUpperCase()}` });
      }

      // reset only that row inputs
      setRefMap((p) => ({ ...p, [id]: "" }));
      setRejMap((p) => ({ ...p, [id]: "" }));

      await fetchWithdrawals();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Server error",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Admin • Withdrawals</h1>
            <p className="text-sm text-muted-foreground">
              Review requests and update status. If status becomes <b>PAID</b>, it is treated as withdraw success.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchWithdrawals} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>Requests</CardTitle>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Pending
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="h-4 w-4" /> Approved
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    <span className="flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Rejected
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="paid">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Paid
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user / account / IFSC / email / id..."
                className="md:w-[360px]"
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No withdrawals found.</div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left">
                      <th className="p-3 font-semibold text-gray-700">User</th>
                      <th className="p-3 font-semibold text-gray-700">Bank (Preview)</th>
                      <th className="p-3 font-semibold text-gray-700">Amount</th>
                      <th className="p-3 font-semibold text-gray-700">Status</th>
                      <th className="p-3 font-semibold text-gray-700">Created</th>
                      <th className="p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((w) => {
                      const u = w.userId || {};
                      const b = w.bankSnapshot || {};
                      const busy = updatingId === w._id;

                      return (
                        <tr key={w._id} className="border-b hover:bg-gray-50 align-top">
                          <td className="p-3">
                            <div className="font-semibold text-navy">{u.name || "Unknown"}</div>
                            <div className="text-muted-foreground">{u.email || "-"}</div>
                            <div className="text-muted-foreground">{u.phone || "-"}</div>

                            {u.referralCode ? (
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-blue-50">
                                  {u.referralCode}
                                </Badge>
                              </div>
                            ) : null}

                            {"walletBalance" in (u as any) ? (
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                Wallet: ₹ {Math.round(Number((u as any)?.walletBalance || 0))}
                              </div>
                            ) : null}

                            <div className="text-[11px] text-muted-foreground mt-2">ID: {w._id}</div>
                          </td>

                          <td className="p-3">
                            <div className="font-medium">{b.accountHolderName || "-"}</div>
                            <div className="text-muted-foreground">{b.bankName || "-"}</div>
                            <div className="text-muted-foreground">A/C: {maskAccount(b.accountNumber)}</div>
                            <div className="text-muted-foreground">IFSC: {b.ifsc || "-"}</div>

                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openBankModal(w)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyText(JSON.stringify(w.bankSnapshot || {}, null, 2))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                          </td>

                          <td className="p-3 font-bold text-navy">₹ {Math.round(Number(w.amount || 0))}</td>
                          <td className="p-3">{statusBadge(w.status)}</td>

                          <td className="p-3 text-muted-foreground">
                            <div>{formatDate(w.createdAt)}</div>
                            <div className="text-xs mt-1">Processed: {formatDate(w.processedAt)}</div>
                            <div className="text-xs">Ref: {w.referenceId || "-"}</div>
                            {w.status === "rejected" ? (
                              <div className="text-xs text-red-600 mt-1">Reason: {w.rejectReason || "Rejected"}</div>
                            ) : null}
                            {w.note ? <div className="text-xs mt-1">Note: {w.note}</div> : null}
                          </td>

                          <td className="p-3">
                            <div className="space-y-2">
                              <Input
                                value={refMap[w._id] || ""}
                                onChange={(e) => setRefMap((p) => ({ ...p, [w._id]: e.target.value }))}
                                placeholder="Reference ID (optional)"
                              />
                              <Input
                                value={rejMap[w._id] || ""}
                                onChange={(e) => setRejMap((p) => ({ ...p, [w._id]: e.target.value }))}
                                placeholder="Reject reason (if rejecting)"
                              />

                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(w._id, "approved")}>
                                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={busy}
                                  onClick={() => updateStatus(w._id, "paid")}
                                >
                                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                  Mark Paid
                                </Button>

                                <Button size="sm" variant="destructive" disabled={busy} onClick={() => updateStatus(w._id, "rejected")}>
                                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                  Reject
                                </Button>
                              </div>

                              <div className="text-[11px] text-muted-foreground">
                                ✅ If marked <b>PAID</b>, it’s “withdraw success”. Wallet change must be handled by backend.
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

        {/* ✅ Bank Details Dialog */}
        <Dialog open={openBank} onOpenChange={setOpenBank}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bank Details</DialogTitle>
            </DialogHeader>

            {(() => {
              const w = selected;
              const u = w?.userId || {};
              const b = w?.bankSnapshot || {};
              if (!w) return <div className="text-muted-foreground">No data</div>;

              return (
                <div className="space-y-4">
                  <div className="rounded-lg border p-3 bg-gray-50">
                    <div className="font-semibold text-navy">{u.name || "Unknown User"}</div>
                    <div className="text-sm text-muted-foreground">{u.email || "-"}</div>
                    <div className="text-sm text-muted-foreground">{u.phone || "-"}</div>

                    {"walletBalance" in (u as any) ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        Wallet: ₹ {Math.round(Number((u as any)?.walletBalance || 0))}
                      </div>
                    ) : null}

                    <div className="text-xs text-muted-foreground mt-2">Withdrawal ID: {w._id}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Account Holder</div>
                      <div className="font-semibold">{b.accountHolderName || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Bank</div>
                      <div className="font-semibold">{b.bankName || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Account Number</div>
                      <div className="font-semibold">{b.accountNumber || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">IFSC</div>
                      <div className="font-semibold">{b.ifsc || "-"}</div>
                    </div>

                    <div className="rounded-lg border p-3 sm:col-span-2">
                      <div className="text-xs text-muted-foreground">UPI ID</div>
                      <div className="font-semibold">{b.upiId || "-"}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      {statusBadge(w.status)}
                      <span className="text-xs text-muted-foreground">
                        Created: {formatDate(w.createdAt)} • Processed: {formatDate(w.processedAt)}
                      </span>
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
                onClick={() => copyText(JSON.stringify(selected?.bankSnapshot || {}, null, 2))}
                className="bg-navy hover:bg-navy/90"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Bank Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
