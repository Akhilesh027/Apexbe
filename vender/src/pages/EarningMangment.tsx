// src/pages/vendor/Earnings.tsx
// ✅ Layout-friendly page (NO Navbar/Footer inside)
// Works in Next.js App Router or React Router inside VendorLayout

import { useMemo, useState } from "react";
import {
  IndianRupee,
  CalendarDays,
  Download,
  Search,
  Wallet,
  BadgeCheck,
  Clock,
  Percent,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";

type RangeKey = "Today" | "Last 7 days" | "Last 30 days" | "Custom";
type PayoutStatus = "Pending" | "Processing" | "Settled";
type PaymentMode = "UPI" | "Bank Transfer";

type EarningRow = {
  id: string;
  orderId: string;
  customer: string;
  createdAt: string;
  deliveredAt?: string;
  website?: string;

  gross: number; // item total
  discount: number;
  tax: number;
  shippingFee: number;

  commissionPct: number;
  commissionAmount: number;

  netEarning: number; // gross - discount + tax + shippingFee - commission
  payoutStatus: PayoutStatus;
  payoutRef?: string;
};

type PayoutRow = {
  id: string;
  payoutId: string;
  date: string;
  amount: number;
  status: PayoutStatus;
  mode: PaymentMode;
  reference?: string;
};

const RANGE_OPTIONS: RangeKey[] = ["Today", "Last 7 days", "Last 30 days", "Custom"];

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const mockEarnings: EarningRow[] = [
  {
    id: "e1",
    orderId: "APX-ORD-10233",
    customer: "Priya",
    createdAt: "Feb 24, 2026",
    deliveredAt: "Feb 27, 2026",
    gross: 3299,
    discount: 200,
    tax: 0,
    shippingFee: 0,
    commissionPct: 8,
    commissionAmount: 248,
    netEarning: 2851,
    payoutStatus: "Settled",
    payoutRef: "PO-90012",
  },
  {
    id: "e2",
    orderId: "APX-ORD-10232",
    customer: "Akhil Reddy",
    createdAt: "Feb 26, 2026",
    deliveredAt: "—",
    gross: 799,
    discount: 0,
    tax: 0,
    shippingFee: 0,
    commissionPct: 10,
    commissionAmount: 80,
    netEarning: 719,
    payoutStatus: "Pending",
  },
  {
    id: "e3",
    orderId: "APX-ORD-10231",
    customer: "Guru Swamy",
    createdAt: "Feb 27, 2026",
    deliveredAt: "—",
    gross: 1899,
    discount: 100,
    tax: 0,
    shippingFee: 0,
    commissionPct: 8,
    commissionAmount: 152,
    netEarning: 1647,
    payoutStatus: "Processing",
    payoutRef: "PO-90013",
  },
];

const mockPayouts: PayoutRow[] = [
  { id: "p1", payoutId: "PO-90012", date: "Feb 27, 2026", amount: 2851, status: "Settled", mode: "Bank Transfer", reference: "UTR1234XXXX" },
  { id: "p2", payoutId: "PO-90013", date: "Feb 28, 2026", amount: 1647, status: "Processing", mode: "UPI", reference: "UPIREF-XXXX" },
];

function statusBadge(status: PayoutStatus) {
  if (status === "Settled") return <Badge className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />Settled</Badge>;
  if (status === "Processing") return <Badge variant="secondary" className="gap-1"><Clock className="h-3.5 w-3.5" />Processing</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="h-3.5 w-3.5" />Pending</Badge>;
}

export default function Earnings() {
  const [range, setRange] = useState<RangeKey>("Last 30 days");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"Overview" | "Order-wise" | "Payouts">("Overview");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return mockEarnings;
    return mockEarnings.filter((r) =>
      [r.orderId, r.customer, r.payoutRef || ""].join(" ").toLowerCase().includes(query)
    );
  }, [q]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((a, r) => a + r.gross, 0);
    const commission = filtered.reduce((a, r) => a + r.commissionAmount, 0);
    const net = filtered.reduce((a, r) => a + r.netEarning, 0);
    const pending = filtered
      .filter((r) => r.payoutStatus !== "Settled")
      .reduce((a, r) => a + r.netEarning, 0);

    const settled = filtered
      .filter((r) => r.payoutStatus === "Settled")
      .reduce((a, r) => a + r.netEarning, 0);

    return { gross, commission, net, pending, settled };
  }, [filtered]);

  return (
  <AppLayout>
      <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Track order-wise earnings, commissions, and payouts. Download statements anytime.
        </p>
      </div>

      {/* Top Controls */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="space-y-1.5">
            <Label>Date Range</Label>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={range}
                onChange={(e) => setRange(e.target.value as RangeKey)}
              >
                {RANGE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Badge variant="secondary" className="gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {range}
              </Badge>
            </div>
          </div>

          <Button variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            Download Statement
          </Button>
        </div>

        <div className="relative w-full lg:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search Order ID / Customer / Payout ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Net Earnings"
          value={money(totals.net)}
          icon={<Wallet className="h-5 w-5" />}
          hint="Total after commission"
        />
        <StatCard
          title="Pending / Processing"
          value={money(totals.pending)}
          icon={<Clock className="h-5 w-5" />}
          hint="Yet to be settled"
        />
        <StatCard
          title="Settled"
          value={money(totals.settled)}
          icon={<BadgeCheck className="h-5 w-5" />}
          hint="Already paid out"
        />
        <StatCard
          title="Commission"
          value={money(totals.commission)}
          icon={<Percent className="h-5 w-5" />}
          hint="Platform fee"
        />
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="Overview">Overview</TabsTrigger>
            <TabsTrigger value="Order-wise">Order-wise</TabsTrigger>
            <TabsTrigger value="Payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="Overview" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Earnings Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <InfoItem label="Gross Sales" value={money(totals.gross)} />
                  <InfoItem label="Commission Deducted" value={money(totals.commission)} />
                  <InfoItem label="Net Earnings" value={money(totals.net)} />
                </div>

                <Separator className="my-4" />

                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="font-semibold">How earnings are calculated</div>
                  <div className="mt-2 text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Net Earning</span> =
                    (Gross − Discounts) + Tax + Shipping Fee − Commission.
                    <br />
                    Settlements are typically processed after delivery confirmation (and return window, if applicable).
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order-wise */}
          <TabsContent value="Order-wise" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Order-wise Earnings
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
                          <th className="p-3 min-w-[140px]">Order ID</th>
                          <th className="p-3 min-w-[170px]">Customer</th>
                          <th className="p-3 min-w-[140px]">Order Date</th>
                          <th className="p-3 min-w-[140px]">Delivered</th>
                          <th className="p-3 min-w-[120px]">Gross</th>
                          <th className="p-3 min-w-[120px]">Commission</th>
                          <th className="p-3 min-w-[120px]">Net</th>
                          <th className="p-3 min-w-[160px]">Payout Status</th>
                          <th className="p-3 min-w-[120px] text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r) => (
                          <tr key={r.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-medium">{r.orderId}</td>
                            <td className="p-3">{r.customer}</td>
                            <td className="p-3">{r.createdAt}</td>
                            <td className="p-3">{r.deliveredAt || "—"}</td>

                            <td className="p-3">{money(r.gross)}</td>
                            <td className="p-3">{money(r.commissionAmount)}</td>

                            <td className="p-3 font-medium">{money(r.netEarning)}</td>

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {statusBadge(r.payoutStatus)}
                                {r.payoutRef ? (
                                  <span className="text-xs text-muted-foreground">{r.payoutRef}</span>
                                ) : null}
                              </div>
                            </td>

                            <td className="p-3 text-right">
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <ArrowUpRight className="h-4 w-4" />
                                View
                              </Button>
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

          {/* Payouts */}
          <TabsContent value="Payouts" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Payout History
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                {mockPayouts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="w-full overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="p-3 min-w-[140px]">Payout ID</th>
                          <th className="p-3 min-w-[140px]">Date</th>
                          <th className="p-3 min-w-[140px]">Amount</th>
                          <th className="p-3 min-w-[160px]">Status</th>
                          <th className="p-3 min-w-[160px]">Mode</th>
                          <th className="p-3 min-w-[220px]">Reference</th>
                          <th className="p-3 min-w-[120px] text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockPayouts.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-medium">{p.payoutId}</td>
                            <td className="p-3">{p.date}</td>
                            <td className="p-3 font-medium">{money(p.amount)}</td>
                            <td className="p-3">{statusBadge(p.status)}</td>
                            <td className="p-3">
                              <Badge variant="secondary">{p.mode}</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{p.reference || "—"}</td>
                            <td className="p-3 text-right">
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <ArrowDownRight className="h-4 w-4" />
                                Download
                              </Button>
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
        </Tabs>
      </div>
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
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          </div>
          <div className="h-10 w-10 rounded-xl border bg-muted/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <IndianRupee className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">No earnings found</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Try adjusting filters or searching by Order ID / Payout.
      </div>
    </div>
  );
}