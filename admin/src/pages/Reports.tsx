"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Users,
  Store,
  IndianRupee,
  Download,
  CalendarDays,
  Search,
  Filter,
  RefreshCw,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type RangeKey = "Last 7 days" | "Last 30 days" | "Custom";
type PaymentFilter = "All" | "Prepaid" | "COD";

type DailyPoint = {
  label: string;
  revenue: number;
  orders: number;
};

type BestProduct = {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
};

type TopVendor = {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  commission: number;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const series7: DailyPoint[] = [
  { label: "Feb 21", revenue: 18200, orders: 21 },
  { label: "Feb 22", revenue: 12500, orders: 15 },
  { label: "Feb 23", revenue: 20100, orders: 23 },
  { label: "Feb 24", revenue: 9800, orders: 12 },
  { label: "Feb 25", revenue: 24300, orders: 28 },
  { label: "Feb 26", revenue: 15900, orders: 18 },
  { label: "Feb 27", revenue: 28900, orders: 34 },
];

const series30: DailyPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  return {
    label: `Day ${day}`,
    revenue: 9000 + ((i * 1317) % 21000),
    orders: 8 + ((i * 11) % 28),
  };
});

const bestProductsMock: BestProduct[] = [
  { id: "p1", name: "Fruit Box Medium", category: "Fruits", units: 64, revenue: 118400 },
  { id: "p2", name: "Agarbathi Pack", category: "Devotional", units: 92, revenue: 73600 },
  { id: "p3", name: "Gift Combo Pack", category: "Gifts", units: 41, revenue: 61500 },
  { id: "p4", name: "Health Mix", category: "Groceries", units: 38, revenue: 41800 },
];

const topVendorsMock: TopVendor[] = [
  { id: "v1", name: "ApexBee Fruits", orders: 118, revenue: 312400, commission: 24992 },
  { id: "v2", name: "FreshKart", orders: 92, revenue: 221800, commission: 17744 },
  { id: "v3", name: "Devotional Store", orders: 77, revenue: 168900, commission: 13512 },
  { id: "v4", name: "Daily Needs", orders: 63, revenue: 120300, commission: 9624 },
];

export default function ReportsAnalytics() {
  const [range, setRange] = useState<RangeKey>("Last 30 days");
  const [payment, setPayment] = useState<PaymentFilter>("All");
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const series = useMemo(() => {
    const base = range === "Last 7 days" ? series7 : series30;

    // Just demo segmentation effect (replace with API filter)
    if (payment === "Prepaid") {
      return base.map((d) => ({
        ...d,
        revenue: Math.round(d.revenue * 0.72),
        orders: Math.max(1, Math.round(d.orders * 0.7)),
      }));
    }
    if (payment === "COD") {
      return base.map((d) => ({
        ...d,
        revenue: Math.round(d.revenue * 0.48),
        orders: Math.max(1, Math.round(d.orders * 0.55)),
      }));
    }
    return base;
  }, [range, payment]);

  const summary = useMemo(() => {
    const totalRevenue = series.reduce((a, d) => a + d.revenue, 0);
    const totalOrders = series.reduce((a, d) => a + d.orders, 0);
    const activeVendors = 24; // demo
    const totalUsers = 1840; // demo
    const commissionRate = 0.08;
    const platformCommission = Math.round(totalRevenue * commissionRate);

    return {
      totalRevenue,
      totalOrders,
      activeVendors,
      totalUsers,
      platformCommission,
      avgOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }, [series]);

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return bestProductsMock;
    return bestProductsMock.filter((p) =>
      `${p.name} ${p.category}`.toLowerCase().includes(query)
    );
  }, [q]);

  const filteredVendors = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return topVendorsMock;
    return topVendorsMock.filter((v) => v.name.toLowerCase().includes(query));
  }, [q]);

  const refresh = async () => {
    setRefreshing(true);
    // later: fetch data from backend
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const downloadCSV = (type: "sales" | "vendors" | "products") => {
    let csv = "";
    if (type === "sales") {
      csv = "date,revenue,orders\n" + series.map((d) => `${d.label},${d.revenue},${d.orders}`).join("\n");
    } else if (type === "vendors") {
      csv =
        "vendor,orders,revenue,commission\n" +
        topVendorsMock.map((v) => `${v.name},${v.orders},${v.revenue},${v.commission}`).join("\n");
    } else {
      csv =
        "product,category,units,revenue\n" +
        bestProductsMock.map((p) => `${p.name},${p.category},${p.units},${p.revenue}`).join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
   
      <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Reports / Analytics
          </h1>
          <p className="text-muted-foreground">
            Revenue, orders, vendor performance, best products and exports.
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
              <Label>Payment Filter</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentFilter)}
              >
                <option value="All">All</option>
                <option value="Prepaid">Prepaid</option>
                <option value="COD">COD</option>
              </select>
            </div>

            <Button variant="outline" className="gap-2" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-[360px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search vendor / product"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("sales")}>
                <Download className="h-4 w-4" /> Sales CSV
              </Button>
              <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("vendors")}>
                <Download className="h-4 w-4" /> Vendors CSV
              </Button>
              <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("products")}>
                <Download className="h-4 w-4" /> Products CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard title="Revenue" value={money(summary.totalRevenue)} icon={<TrendingUp className="h-5 w-5" />} hint="Gross sales" />
          <StatCard title="Orders" value={String(summary.totalOrders)} icon={<ShoppingCart className="h-5 w-5" />} hint="All orders" />
          <StatCard title="Avg Order Value" value={money(summary.avgOrderValue)} icon={<IndianRupee className="h-5 w-5" />} hint="AOV" />
          <StatCard title="Platform Commission" value={money(summary.platformCommission)} icon={<IndianRupee className="h-5 w-5" />} hint="(8% demo)" />
          <StatCard title="Active Vendors" value={String(summary.activeVendors)} icon={<Store className="h-5 w-5" />} hint="Selling vendors" />
          <StatCard title="Total Users" value={String(summary.totalUsers)} icon={<Users className="h-5 w-5" />} hint="Registered" />
        </div>

        {/* Chart + Insights */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Revenue Trend
                <Badge variant="secondary" className="ml-2">{range}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MiniBarChart data={series} />
              <div className="mt-3 text-xs text-muted-foreground">
                * Demo chart. Replace with Recharts later if you want.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <Insight label="Highest Day Revenue" value={money(Math.max(...series.map((d) => d.revenue), 0))} />
              <Insight label="Highest Day Orders" value={String(Math.max(...series.map((d) => d.orders), 0))} />
              <Separator />
              <Insight label="Revenue (Total)" value={money(summary.totalRevenue)} />
              <Insight label="Orders (Total)" value={String(summary.totalOrders)} />
              <Insight label="Commission" value={money(summary.platformCommission)} />
            </CardContent>
          </Card>
        </div>

        {/* Best Products + Top Vendors */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                      <th className="p-3 min-w-[220px]">Product</th>
                      <th className="p-3 min-w-[140px]">Category</th>
                      <th className="p-3 min-w-[120px]">Units</th>
                      <th className="p-3 min-w-[140px]">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">{p.category}</td>
                        <td className="p-3">{p.units}</td>
                        <td className="p-3 font-medium">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4" />
                Top Vendors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3 min-w-[220px]">Vendor</th>
                      <th className="p-3 min-w-[120px]">Orders</th>
                      <th className="p-3 min-w-[140px]">Revenue</th>
                      <th className="p-3 min-w-[160px]">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((v) => (
                      <tr key={v.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{v.name}</td>
                        <td className="p-3">{v.orders}</td>
                        <td className="p-3 font-medium">{money(v.revenue)}</td>
                        <td className="p-3">{money(v.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
   
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

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
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
          <div className="mt-1 font-bold">{money(max)}</div>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Revenue</div>
          <div className="mt-1 font-bold">{money(data.reduce((a, d) => a + d.revenue, 0))}</div>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Orders</div>
          <div className="mt-1 font-bold">{data.reduce((a, d) => a + d.orders, 0)}</div>
        </div>
      </div>
    </div>
  );
}