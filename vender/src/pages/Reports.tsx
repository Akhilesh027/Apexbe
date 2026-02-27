"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  BadgeCheck,
  XCircle,
  RotateCcw,
  Package,
  RefreshCw,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";

type RangeKey = "Last 7 days" | "Last 30 days" | "Custom";

type DailyPoint = {
  label: string; // e.g. "Feb 21"
  revenue: number;
  orders: number;
};

type BestProduct = {
  id: string;
  name: string;
  soldQty: number;
  revenue: number;
  stockLeft: number;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const mock7Days: DailyPoint[] = [
  { label: "Feb 21", revenue: 4200, orders: 6 },
  { label: "Feb 22", revenue: 3100, orders: 4 },
  { label: "Feb 23", revenue: 5200, orders: 7 },
  { label: "Feb 24", revenue: 2800, orders: 3 },
  { label: "Feb 25", revenue: 6100, orders: 8 },
  { label: "Feb 26", revenue: 3900, orders: 5 },
  { label: "Feb 27", revenue: 7400, orders: 10 },
];

const mock30Days: DailyPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  return {
    label: `Day ${day}`,
    revenue: 1500 + ((i * 743) % 5200),
    orders: 1 + ((i * 13) % 10),
  };
});

const mockBestProducts: BestProduct[] = [
  { id: "bp1", name: "Fruits Box Medium", soldQty: 32, revenue: 60768, stockLeft: 14 },
  { id: "bp2", name: "Agarbathi Pack", soldQty: 58, revenue: 46342, stockLeft: 80 },
  { id: "bp3", name: "Health Mix", soldQty: 21, revenue: 20979, stockLeft: 6 },
  { id: "bp4", name: "Gift Combo Pack", soldQty: 17, revenue: 22083, stockLeft: 10 },
];

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("Last 30 days");
  const [segment, setSegment] = useState<"All" | "Prepaid" | "COD">("All");
  const [refreshing, setRefreshing] = useState(false);

  const series = useMemo(() => {
    const base = range === "Last 7 days" ? mock7Days : mock30Days;

    // small variation for payment segment (only for UI demo)
    if (segment === "Prepaid") {
      return base.map((d) => ({ ...d, revenue: Math.round(d.revenue * 0.78), orders: Math.max(1, Math.round(d.orders * 0.8)) }));
    }
    if (segment === "COD") {
      return base.map((d) => ({ ...d, revenue: Math.round(d.revenue * 0.55), orders: Math.max(1, Math.round(d.orders * 0.65)) }));
    }
    return base;
  }, [range, segment]);

  const summary = useMemo(() => {
    const totalRevenue = series.reduce((a, d) => a + d.revenue, 0);
    const totalOrders = series.reduce((a, d) => a + d.orders, 0);

    // demo numbers (replace with API)
    const delivered = Math.round(totalOrders * 0.78);
    const cancelled = Math.round(totalOrders * 0.07);
    const returns = Math.round(totalOrders * 0.06);
    const pending = Math.max(0, totalOrders - delivered - cancelled - returns);

    const commission = Math.round(totalRevenue * 0.08);
    const netEarnings = totalRevenue - commission;

    return {
      totalRevenue,
      totalOrders,
      delivered,
      cancelled,
      returns,
      pending,
      netEarnings,
      commission,
    };
  }, [series]);

  const statusBreakdown = useMemo(() => {
    const total = summary.totalOrders || 1;
    return [
      { label: "Delivered", value: summary.delivered, icon: <BadgeCheck className="h-4 w-4" /> , pct: Math.round((summary.delivered / total) * 100) },
      { label: "Cancelled", value: summary.cancelled, icon: <XCircle className="h-4 w-4" /> , pct: Math.round((summary.cancelled / total) * 100) },
      { label: "Returned", value: summary.returns, icon: <RotateCcw className="h-4 w-4" /> , pct: Math.round((summary.returns / total) * 100) },
      { label: "Pending", value: summary.pending, icon: <ShoppingCart className="h-4 w-4" /> , pct: Math.round((summary.pending / total) * 100) },
    ];
  }, [summary]);

  const onRefresh = async () => {
    setRefreshing(true);
    // later: fetch summary + chart + best products
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const downloadCSV = (type: "sales" | "orders" | "products") => {
    // ✅ Client-side demo CSV. Replace with backend export endpoint later.
    let csv = "";
    if (type === "sales") {
      csv = "date,revenue,orders\n" + series.map((d) => `${d.label},${d.revenue},${d.orders}`).join("\n");
    } else if (type === "orders") {
      csv =
        "metric,value\n" +
        [
          ["totalOrders", summary.totalOrders],
          ["delivered", summary.delivered],
          ["cancelled", summary.cancelled],
          ["returned", summary.returns],
          ["pending", summary.pending],
        ]
          .map(([k, v]) => `${k},${v}`)
          .join("\n");
    } else {
      csv = "product,soldQty,revenue,stockLeft\n" + mockBestProducts.map((p) => `${p.name},${p.soldQty},${p.revenue},${p.stockLeft}`).join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
   <AppLayout>
     <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track sales, order performance, best selling products, and export reports.
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
                value={range}
                onChange={(e) => setRange(e.target.value as RangeKey)}
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Custom">Custom</option>
              </select>
              <Badge variant="secondary" className="gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {range}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Type</Label>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={segment}
              onChange={(e) => setSegment(e.target.value as any)}
            >
              <option value="All">All</option>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>

          <Button variant="outline" className="gap-2" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("sales")}>
            <Download className="h-4 w-4" />
            Sales CSV
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("orders")}>
            <Download className="h-4 w-4" />
            Orders CSV
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("products")}>
            <Download className="h-4 w-4" />
            Products CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={money(summary.totalRevenue)} icon={<TrendingUp className="h-5 w-5" />} hint="Gross sales" />
        <StatCard title="Net Earnings" value={money(summary.netEarnings)} icon={<BarChart3 className="h-5 w-5" />} hint={`Commission: ${money(summary.commission)}`} />
        <StatCard title="Total Orders" value={String(summary.totalOrders)} icon={<ShoppingCart className="h-5 w-5" />} hint="All statuses" />
        <StatCard title="Returns" value={String(summary.returns)} icon={<RotateCcw className="h-5 w-5" />} hint="Return requests" />
      </div>

      {/* Chart + Status */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue Trend
              <Badge variant="secondary" className="ml-2">{range}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MiniBarChart data={series} />
            <div className="mt-3 text-xs text-muted-foreground">
              * Demo chart. Replace with real data + chart library (Recharts) if you want.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {statusBreakdown.map((s) => (
              <div key={s.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-muted-foreground">{s.icon}</span>
                    {s.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.value} ({s.pct}%)
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground/70"
                    style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                  />
                </div>
              </div>
            ))}

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Delivered" value={String(summary.delivered)} icon={<BadgeCheck className="h-4 w-4" />} />
              <InfoItem label="Cancelled" value={String(summary.cancelled)} icon={<XCircle className="h-4 w-4" />} />
              <InfoItem label="Returned" value={String(summary.returns)} icon={<RotateCcw className="h-4 w-4" />} />
              <InfoItem label="Pending" value={String(summary.pending)} icon={<ShoppingCart className="h-4 w-4" />} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Products */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Best Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 min-w-[260px]">Product</th>
                    <th className="p-3 min-w-[140px]">Units Sold</th>
                    <th className="p-3 min-w-[160px]">Revenue</th>
                    <th className="p-3 min-w-[140px]">Stock Left</th>
                    <th className="p-3 min-w-[140px]">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBestProducts.map((p) => {
                    const perf =
                      p.stockLeft <= 5 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Low stock
                        </Badge>
                      ) : p.soldQty >= 40 ? (
                        <Badge className="gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Hot
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      );

                    return (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">{p.soldQty}</td>
                        <td className="p-3 font-medium">{money(p.revenue)}</td>
                        <td className="p-3">{p.stockLeft}</td>
                        <td className="p-3">{perf}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">Tip</div>
              <div className="mt-1 text-muted-foreground">
                Track low stock items and push promotions for high demand products to increase sales.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
   </AppLayout>
  );
}

/** ---------------------------
 * Components
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

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function MiniBarChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-[220px]">
        {data.map((d, idx) => {
          const h = Math.round((d.revenue / max) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-foreground/80"
                style={{ height: `${h}%` }}
                title={`${d.label} • ${money(d.revenue)} • ${d.orders} orders`}
              />
              <div className="text-[11px] text-muted-foreground truncate w-full text-center">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Highest Day</div>
          <div className="mt-1 font-bold">
            {money(max)}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Revenue</div>
          <div className="mt-1 font-bold">
            {money(data.reduce((a, d) => a + d.revenue, 0))}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Orders</div>
          <div className="mt-1 font-bold">
            {data.reduce((a, d) => a + d.orders, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}