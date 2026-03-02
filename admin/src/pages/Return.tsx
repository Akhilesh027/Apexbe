// src/pages/admin/ReturnsRefunds.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  IndianRupee,
  BadgeCheck,
  XCircle,
  AlertTriangle,
  FileText,
  MoreVertical,
  CheckCircle2,
  Ban,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReturnStatus = "pending" | "approved" | "rejected" | "disputed";
type RefundStatus = "none" | "initiated" | "processed" | "refunded" | "failed";

type ReturnRow = {
  id: string;
  orderId: string;
  vendorName: string;
  customerName: string;
  reason: string;
  requestedAt: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundAmount: number;
  paymentMode: "COD" | "Prepaid";
  notes?: string;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "refunded", label: "Refunded" },
  { key: "disputed", label: "Disputed" },
] as const;

const mockRows: ReturnRow[] = [
  {
    id: "RET-5001",
    orderId: "ORD-10021",
    vendorName: "ApexBee Fruits",
    customerName: "Akhil Reddy",
    reason: "Damaged product",
    requestedAt: "Feb 27, 2026",
    status: "pending",
    refundStatus: "none",
    refundAmount: 799,
    paymentMode: "Prepaid",
  },
  {
    id: "RET-5002",
    orderId: "ORD-10018",
    vendorName: "FreshKart",
    customerName: "Guru Swamy",
    reason: "Wrong item received",
    requestedAt: "Feb 26, 2026",
    status: "approved",
    refundStatus: "initiated",
    refundAmount: 1899,
    paymentMode: "Prepaid",
  },
  {
    id: "RET-5003",
    orderId: "ORD-10002",
    vendorName: "Devotional Store",
    customerName: "Priya",
    reason: "Return window expired",
    requestedAt: "Feb 20, 2026",
    status: "rejected",
    refundStatus: "none",
    refundAmount: 0,
    paymentMode: "COD",
    notes: "Rejected due to policy (7 days return).",
  },
  {
    id: "RET-5004",
    orderId: "ORD-09988",
    vendorName: "ApexBee Fruits",
    customerName: "Sita",
    reason: "Expired product",
    requestedAt: "Feb 18, 2026",
    status: "approved",
    refundStatus: "refunded",
    refundAmount: 999,
    paymentMode: "Prepaid",
    notes: "Refund completed successfully.",
  },
  {
    id: "RET-5005",
    orderId: "ORD-09977",
    vendorName: "FreshKart",
    customerName: "Ravi",
    reason: "Vendor dispute: item used",
    requestedAt: "Feb 17, 2026",
    status: "disputed",
    refundStatus: "processed",
    refundAmount: 1199,
    paymentMode: "Prepaid",
    notes: "Vendor claims product was used. Needs review.",
  },
];

function statusBadge(status: ReturnStatus) {
  if (status === "pending")
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3.5 w-3.5" /> Pending
      </Badge>
    );
  if (status === "approved")
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <FileText className="h-3.5 w-3.5" /> Disputed
    </Badge>
  );
}

function refundBadge(status: RefundStatus) {
  if (status === "none") return <Badge variant="outline">No refund</Badge>;
  if (status === "initiated") return <Badge variant="secondary">Initiated</Badge>;
  if (status === "processed") return <Badge variant="secondary">Processing</Badge>;
  if (status === "refunded") return <Badge className="gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Refunded</Badge>;
  return <Badge variant="destructive">Failed</Badge>;
}

export default function ReturnsRefunds() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [q, setQ] = useState("");
  const [dateRange, setDateRange] = useState<"Last 7 days" | "Last 30 days" | "Custom">("Last 30 days");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ReturnRow | null>(null);

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"approve" | "reject">("approve");
  const [decisionNote, setDecisionNote] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return mockRows
      .filter((r) => {
        if (tab === "refunded") return r.refundStatus === "refunded";
        return r.status === tab;
      })
      .filter((r) => {
        if (!query) return true;
        const hay = [r.id, r.orderId, r.vendorName, r.customerName, r.reason].join(" ").toLowerCase();
        return hay.includes(query);
      });
  }, [tab, q]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const totalRefund = filtered.reduce((a, r) => a + (r.refundStatus === "refunded" ? r.refundAmount : 0), 0);
    const pendingRefunds = filtered.filter((r) => r.refundStatus === "initiated" || r.refundStatus === "processed").length;
    const failedRefunds = filtered.filter((r) => r.refundStatus === "failed").length;
    return { total, totalRefund, pendingRefunds, failedRefunds };
  }, [filtered]);

  const openDetails = (row: ReturnRow) => {
    setActive(row);
    setOpen(true);
  };

  const openDecision = (row: ReturnRow, type: "approve" | "reject") => {
    setActive(row);
    setDecisionType(type);
    setDecisionNote("");
    setDecisionOpen(true);
  };

  // UI-only handlers (connect API later)
  const handleDecision = () => setDecisionOpen(false);
  const markRefunded = () => setOpen(false);

  return (
   
      <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Returns & Refunds</h1>
          <p className="text-muted-foreground">
            Review return requests, approve/reject, and track refund status.
          </p>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                >
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Custom">Custom</option>
                </select>
                <Badge variant="secondary" className="gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateRange}
                </Badge>
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search Return ID / Order / Vendor / Customer" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Records" value={String(summary.total)} icon={<RotateCcw className="h-5 w-5" />} />
          <StatCard title="Total Refunded" value={money(summary.totalRefund)} icon={<IndianRupee className="h-5 w-5" />} />
          <StatCard title="Pending Refunds" value={String(summary.pendingRefunds)} icon={<AlertTriangle className="h-5 w-5" />} />
          <StatCard title="Failed Refunds" value={String(summary.failedRefunds)} icon={<XCircle className="h-5 w-5" />} />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="flex flex-wrap h-auto">
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {TABS.find((x) => x.key === tab)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {filtered.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden lg:block w-full overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="p-3 min-w-[120px]">Return ID</th>
                              <th className="p-3 min-w-[120px]">Order ID</th>
                              <th className="p-3 min-w-[180px]">Vendor</th>
                              <th className="p-3 min-w-[180px]">Customer</th>
                              <th className="p-3 min-w-[220px]">Reason</th>
                              <th className="p-3 min-w-[120px]">Refund</th>
                              <th className="p-3 min-w-[120px]">Amount</th>
                              <th className="p-3 min-w-[120px]">Status</th>
                              <th className="p-3 min-w-[140px]">Requested</th>
                              <th className="p-3 min-w-[120px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((r) => (
                              <tr key={r.id} className="border-t hover:bg-muted/30">
                                <td className="p-3 font-medium">{r.id}</td>
                                <td className="p-3">{r.orderId}</td>
                                <td className="p-3">{r.vendorName}</td>
                                <td className="p-3">{r.customerName}</td>
                                <td className="p-3">{r.reason}</td>
                                <td className="p-3">{refundBadge(r.refundStatus)}</td>
                                <td className="p-3 font-medium">{money(r.refundAmount)}</td>
                                <td className="p-3">{statusBadge(r.status)}</td>
                                <td className="p-3">{r.requestedAt}</td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openDetails(r)}>
                                      <FileText className="h-4 w-4" />
                                      View
                                    </Button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="secondary">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => openDetails(r)}>
                                          <FileText className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        {r.status === "pending" && (
                                          <>
                                            <DropdownMenuItem onClick={() => openDecision(r, "approve")}>
                                              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDecision(r, "reject")}>
                                              <Ban className="mr-2 h-4 w-4" /> Reject
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="lg:hidden space-y-3">
                        {filtered.map((r) => (
                          <Card key={r.id}>
                            <CardContent className="p-4 space-y-2 text-sm">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="font-semibold">{r.id}</div>
                                  <div className="text-xs text-muted-foreground">{r.orderId}</div>
                                </div>
                                {statusBadge(r.status)}
                              </div>

                              <div className="text-muted-foreground">
                                <span className="font-medium text-foreground">{r.vendorName}</span> • {r.customerName}
                              </div>

                              <div className="text-muted-foreground">{r.reason}</div>

                              <div className="flex items-center justify-between">
                                <div className="font-semibold">{money(r.refundAmount)}</div>
                                {refundBadge(r.refundStatus)}
                              </div>

                              <Button variant="outline" className="w-full" onClick={() => openDetails(r)}>
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Details dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[95vw] max-w-2xl">
            <DialogHeader>
              <DialogTitle>Return Details</DialogTitle>
              <DialogDescription>Admin review and refund tracking.</DialogDescription>
            </DialogHeader>

            {!active ? (
              <div className="py-10 text-center text-muted-foreground">No record selected.</div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label="Return ID" value={active.id} />
                  <Info label="Order ID" value={active.orderId} />
                  <Info label="Vendor" value={active.vendorName} />
                  <Info label="Customer" value={active.customerName} />
                  <Info label="Reason" value={active.reason} />
                  <Info label="Payment Mode" value={active.paymentMode} />
                  <Info label="Refund Amount" value={money(active.refundAmount)} />
                  <Info label="Status" valueNode={statusBadge(active.status)} />
                  <Info label="Refund Status" valueNode={refundBadge(active.refundStatus)} />
                  <Info label="Requested At" value={active.requestedAt} />
                </div>

                <Separator />

                <div>
                  <Label>Internal Note (Optional)</Label>
                  <Textarea placeholder="Add admin note..." defaultValue={active.notes || ""} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {active.status === "pending" && (
                    <>
                      <Button className="gap-2" onClick={() => openDecision(active, "approve")}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button variant="destructive" className="gap-2" onClick={() => openDecision(active, "reject")}>
                        <Ban className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}

                  <Button variant="secondary" className="gap-2" onClick={markRefunded}>
                    <BadgeCheck className="h-4 w-4" /> Mark Refunded
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve/Reject dialog */}
        <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
          <DialogContent className="w-[95vw] max-w-lg">
            <DialogHeader>
              <DialogTitle className="capitalize">
                {decisionType === "approve" ? "Approve Return" : "Reject Return"}
              </DialogTitle>
              <DialogDescription>
                Add a note (optional) for tracking & policy reference.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder={
                  decisionType === "approve"
                    ? "Example: Approved. Pickup will be scheduled."
                    : "Example: Rejected due to return window expired."
                }
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDecisionOpen(false)}>
                Cancel
              </Button>
              <Button variant={decisionType === "reject" ? "destructive" : "default"} onClick={handleDecision}>
                {decisionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
   
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
          </div>
          <div className="h-10 w-10 rounded-xl border bg-muted/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      {valueNode ? <div className="font-medium">{valueNode}</div> : <div className="font-medium">{value}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <RotateCcw className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">No records found</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Try adjusting filters or search for Return ID / Order ID.
      </div>
    </div>
  );
}