// components/vendor/returns/ReturnsPage.tsx
// ✅ Layout-friendly (NO Navbar/Footer)
// ✅ shadcn + lucide UI
// ✅ Mock data included, easy to connect API later

"use client";

import { useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  IndianRupee,
  AlertTriangle,
  CalendarDays,
  MoreVertical,
  Image as ImageIcon,
  BadgeCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
import AppLayout from "@/components/AppLayout";

type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "picked_up"
  | "received"
  | "refunded"
  | "closed";

type RefundStatus = "none" | "initiated" | "processed" | "refunded" | "failed";

type ReturnItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

type ReturnRow = {
  id: string; // Return ID
  orderId: string;
  customerName: string;
  phone: string;

  reason: string;
  note?: string;
  images?: string[];

  requestedAt: string;
  lastUpdate: string;

  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundAmount: number;

  pickupAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };

  items: ReturnItem[];
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_TABS: { key: ReturnStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "requested", label: "New Requests" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "picked_up", label: "Picked Up" },
  { key: "received", label: "Received" },
  { key: "refunded", label: "Refunded" },
  { key: "closed", label: "Closed" },
];

const REFUND_FILTERS: { key: "all" | RefundStatus; label: string }[] = [
  { key: "all", label: "All Refunds" },
  { key: "none", label: "No Refund" },
  { key: "initiated", label: "Initiated" },
  { key: "processed", label: "Processing" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

const mockReturns: ReturnRow[] = [
  {
    id: "RET-20021",
    orderId: "APX-ORD-10232",
    customerName: "Akhil Reddy",
    phone: "8XXXXXXXXX",
    reason: "Damaged product",
    note: "Box was torn. Need replacement/refund.",
    images: [],
    requestedAt: "Feb 27, 2026",
    lastUpdate: "Today, 05:10 PM",
    status: "requested",
    refundStatus: "none",
    refundAmount: 719,
    pickupAddress: {
      line1: "Hanamkonda",
      city: "Warangal",
      state: "Telangana",
      pincode: "506002",
    },
    items: [{ productId: "p1", name: "Agarbathi Pack", qty: 1, price: 799 }],
  },
  {
    id: "RET-20022",
    orderId: "APX-ORD-10231",
    customerName: "Guru Swamy",
    phone: "9XXXXXXXXX",
    reason: "Wrong item received",
    note: "Received different flavor.",
    images: [],
    requestedAt: "Feb 26, 2026",
    lastUpdate: "Yesterday, 08:40 PM",
    status: "approved",
    refundStatus: "initiated",
    refundAmount: 1647,
    pickupAddress: {
      line1: "Hitech City, Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
    },
    items: [
      { productId: "p2", name: "Fruits Box Medium", qty: 1, price: 1899 },
    ],
  },
  {
    id: "RET-20023",
    orderId: "APX-ORD-10199",
    customerName: "Priya",
    phone: "7XXXXXXXXX",
    reason: "Not needed anymore",
    requestedAt: "Feb 21, 2026",
    lastUpdate: "Feb 22, 2026",
    status: "rejected",
    refundStatus: "none",
    refundAmount: 0,
    pickupAddress: {
      line1: "MG Road",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      pincode: "520001",
    },
    items: [{ productId: "p3", name: "Gift Combo Pack", qty: 1, price: 1299 }],
  },
  {
    id: "RET-20024",
    orderId: "APX-ORD-10188",
    customerName: "Sita",
    phone: "6XXXXXXXXX",
    reason: "Product expired",
    requestedAt: "Feb 18, 2026",
    lastUpdate: "Feb 25, 2026",
    status: "received",
    refundStatus: "processed",
    refundAmount: 999,
    pickupAddress: {
      line1: "Kukatpally",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
    },
    items: [{ productId: "p4", name: "Health Mix", qty: 1, price: 999 }],
  },
];

function statusBadge(status: ReturnStatus) {
  switch (status) {
    case "requested":
      return (
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> Requested
        </Badge>
      );
    case "approved":
      return (
        <Badge className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3.5 w-3.5" /> Rejected
        </Badge>
      );
    case "picked_up":
      return (
        <Badge variant="secondary" className="gap-1">
          <Truck className="h-3.5 w-3.5" /> Picked Up
        </Badge>
      );
    case "received":
      return (
        <Badge variant="secondary" className="gap-1">
          <PackageCheck className="h-3.5 w-3.5" /> Received
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="gap-1">
          <BadgeCheck className="h-3.5 w-3.5" /> Refunded
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3.5 w-3.5" /> Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function refundBadge(status: RefundStatus) {
  switch (status) {
    case "none":
      return <Badge variant="outline">No refund</Badge>;
    case "initiated":
      return <Badge variant="secondary">Initiated</Badge>;
    case "processed":
      return <Badge variant="secondary">Processing</Badge>;
    case "refunded":
      return <Badge>Refunded</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function canApprove(status: ReturnStatus) {
  return status === "requested";
}
function canReject(status: ReturnStatus) {
  return status === "requested";
}
function canMoveForward(status: ReturnStatus) {
  return ["approved", "picked_up", "received"].includes(status);
}
function nextStatus(status: ReturnStatus): ReturnStatus | null {
  if (status === "approved") return "picked_up";
  if (status === "picked_up") return "received";
  if (status === "received") return "refunded";
  return null;
}

export default function ReturnsPage() {
  const [tab, setTab] = useState<ReturnStatus | "all">("requested");
  const [q, setQ] = useState("");
  const [refundFilter, setRefundFilter] = useState<"all" | RefundStatus>("all");
  const [dateRange, setDateRange] = useState<"Last 7 days" | "Last 30 days" | "Custom">(
    "Last 30 days"
  );

  // details / actions
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ReturnRow | null>(null);

  // approve/reject dialog
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"approve" | "reject">("approve");
  const [decisionNote, setDecisionNote] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return mockReturns
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) => (refundFilter === "all" ? true : r.refundStatus === refundFilter))
      .filter((r) => {
        if (!query) return true;
        const hay = [
          r.id,
          r.orderId,
          r.customerName,
          r.phone,
          r.reason,
          r.pickupAddress.city,
          r.pickupAddress.state,
          r.pickupAddress.pincode,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [tab, q, refundFilter]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const requested = filtered.filter((r) => r.status === "requested").length;
    const approved = filtered.filter((r) => r.status === "approved").length;
    const refunded = filtered.filter((r) => r.status === "refunded").length;
    const refundAmount = filtered.reduce((a, r) => a + (r.refundStatus === "refunded" ? r.refundAmount : 0), 0);
    return { total, requested, approved, refunded, refundAmount };
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

  // ✅ These handlers are UI-only now. Replace with API calls later.
  const handleApproveReject = () => {
    // Example later:
    // await fetch(`${API_BASE}/api/vendor/returns/${active.id}/${decisionType}`, { method:"POST", body: JSON.stringify({ note: decisionNote }) })
    setDecisionOpen(false);
  };

  const handleMoveNext = () => {
    if (!active) return;
    const ns = nextStatus(active.status);
    if (!ns) return;
    // Later: PATCH /returns/:id/status { status: ns }
    setOpen(false);
  };

  const handleRefundMark = (status: RefundStatus) => {
    // Later: PATCH /returns/:id/refund { refundStatus: status }
    setOpen(false);
  };

  return (
   <AppLayout>
     <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Returns</h1>
        <p className="text-muted-foreground">
          View return requests, approve/reject, update return status, and track refunds.
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

          <div className="space-y-1.5">
            <Label>Refund Filter</Label>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={refundFilter}
              onChange={(e) => setRefundFilter(e.target.value as any)}
            >
              {REFUND_FILTERS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="relative w-full lg:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search Return ID / Order ID / Customer / Phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Returns" value={String(summary.total)} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="New Requests" value={String(summary.requested)} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Approved" value={String(summary.approved)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard title="Refunded" value={String(summary.refunded)} icon={<BadgeCheck className="h-5 w-5" />} />
        <StatCard title="Refund Amount" value={money(summary.refundAmount)} icon={<IndianRupee className="h-5 w-5" />} />
      </div>

      {/* Tabs + Table */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex flex-wrap h-auto">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUS_TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {t.label}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  {filtered.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="w-full overflow-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-left">
                            <th className="p-3 min-w-[140px]">Return ID</th>
                            <th className="p-3 min-w-[140px]">Order ID</th>
                            <th className="p-3 min-w-[200px]">Customer</th>
                            <th className="p-3 min-w-[220px]">Reason</th>
                            <th className="p-3 min-w-[140px]">Requested</th>
                            <th className="p-3 min-w-[140px]">Status</th>
                            <th className="p-3 min-w-[160px]">Refund</th>
                            <th className="p-3 min-w-[120px]">Amount</th>
                            <th className="p-3 min-w-[160px]">Last Update</th>
                            <th className="p-3 min-w-[120px] text-right">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filtered.map((r) => (
                            <tr key={r.id} className="border-t hover:bg-muted/30">
                              <td className="p-3 font-medium">{r.id}</td>
                              <td className="p-3">{r.orderId}</td>

                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{r.customerName}</span>
                                  <span className="text-xs text-muted-foreground">{r.phone}</span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{r.reason}</span>
                                  {r.note ? (
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {r.note}
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              <td className="p-3">{r.requestedAt}</td>
                              <td className="p-3">{statusBadge(r.status)}</td>
                              <td className="p-3">{refundBadge(r.refundStatus)}</td>
                              <td className="p-3 font-medium">{money(r.refundAmount)}</td>
                              <td className="p-3">{r.lastUpdate}</td>

                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    onClick={() => openDetails(r)}
                                  >
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
                                      <DropdownMenuLabel>Return Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem onClick={() => openDetails(r)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>

                                      {canApprove(r.status) && (
                                        <DropdownMenuItem onClick={() => openDecision(r, "approve")}>
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                      )}

                                      {canReject(r.status) && (
                                        <DropdownMenuItem onClick={() => openDecision(r, "reject")}>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>
                                      )}

                                      {canMoveForward(r.status) && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setActive(r);
                                            handleMoveNext();
                                          }}
                                        >
                                          <Truck className="mr-2 h-4 w-4" />
                                          Move to next status
                                        </DropdownMenuItem>
                                      )}

                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setActive(r);
                                          handleRefundMark("refunded");
                                        }}
                                      >
                                        <IndianRupee className="mr-2 h-4 w-4" />
                                        Mark Refund: Refunded
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>Review items, reason, address, status, and refund details.</DialogDescription>
          </DialogHeader>

          {!active ? (
            <div className="py-8 text-center text-muted-foreground">No return selected.</div>
          ) : (
            <div className="space-y-4">
              {/* overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoItem label="Return ID" value={active.id} />
                    <InfoItem label="Order ID" value={active.orderId} />
                    <InfoItem label="Customer" value={`${active.customerName} (${active.phone})`} />

                    <InfoItem label="Status" valueLabel={statusBadge(active.status)} />
                    <InfoItem label="Refund Status" valueLabel={refundBadge(active.refundStatus)} />
                    <InfoItem label="Refund Amount" value={money(active.refundAmount)} />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap gap-2">
                    {canApprove(active.status) && (
                      <Button className="gap-2" onClick={() => openDecision(active, "approve")}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    {canReject(active.status) && (
                      <Button variant="destructive" className="gap-2" onClick={() => openDecision(active, "reject")}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    )}
                    {canMoveForward(active.status) && (
                      <Button variant="secondary" className="gap-2" onClick={handleMoveNext}>
                        <Truck className="h-4 w-4" /> Move Next
                      </Button>
                    )}
                    <Button variant="outline" className="gap-2" onClick={() => handleRefundMark("initiated")}>
                      <IndianRupee className="h-4 w-4" /> Mark Refund: Initiated
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => handleRefundMark("refunded")}>
                      <BadgeCheck className="h-4 w-4" /> Mark Refund: Refunded
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Items + Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PackageCheck className="h-4 w-4" />
                      Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {active.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {it.qty} • Price: {money(it.price)}
                          </div>
                        </div>
                        <div className="font-medium">{money(it.qty * it.price)}</div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Refund Amount</span>
                      <span className="font-semibold">{money(active.refundAmount)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Request & Pickup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm space-y-2">
                    <InfoItem label="Requested On" value={active.requestedAt} />
                    <InfoItem label="Last Update" value={active.lastUpdate} />

                    <Separator className="my-2" />

                    <div className="font-medium">Pickup Address</div>
                    <div className="text-muted-foreground">{active.pickupAddress.line1}</div>
                    <div className="text-muted-foreground">
                      {active.pickupAddress.city}, {active.pickupAddress.state} — {active.pickupAddress.pincode}
                    </div>

                    {active.images && active.images.length > 0 ? (
                      <div className="pt-2">
                        <div className="font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> Evidence Images
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {active.images.map((src, idx) => (
                            <div key={idx} className="rounded-md border overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="return" className="h-20 w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-muted-foreground">
                        No evidence images uploaded.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Reason */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Reason</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm space-y-1">
                  <div className="font-medium">{active.reason}</div>
                  {active.note ? <div className="text-muted-foreground">{active.note}</div> : null}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="gap-2" onClick={() => setOpen(false)}>
              <CheckCircle2 className="h-4 w-4" />
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Dialog */}
      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {decisionType === "approve" ? "Approve Return" : "Reject Return"}
            </DialogTitle>
            <DialogDescription>
              Add a note (optional). This will be visible in return history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder={
                decisionType === "approve"
                  ? "Example: Approved. Pickup will be scheduled within 24 hours."
                  : "Example: Rejected due to return window expired."
              }
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === "reject" ? "destructive" : "default"}
              className="gap-2"
              onClick={handleApproveReject}
            >
              {decisionType === "approve" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
   </AppLayout>
  );
}

/** ---------------------------
 * Small UI components
 * -------------------------- */

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

function InfoItem({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value?: string;
  valueLabel?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      {valueLabel ? <div className="font-medium">{valueLabel}</div> : <div className="font-medium">{value}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <FileText className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">No returns found</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Try adjusting filters or searching by Return ID / Order ID.
      </div>
    </div>
  );
}