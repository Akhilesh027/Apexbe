"use client";

import { useMemo, useState, useEffect } from "react";
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
  AlertTriangle,
  DollarSign,
  Wallet,
  History,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/components/AppLayout";
import { formatCurrency } from "@/lib/utils";

type RangeKey = "Last 7 days" | "Last 30 days" | "Custom";
type Segment = "All" | "Prepaid" | "COD";

type DailyPoint = {
  label: string;
  revenue: number;
  orders: number;
};

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  orderId?: string;
  description: string;
  createdAt: string;
};

const getVendorId = () => {
  const vendor = localStorage.getItem("vendor");

  if (!vendor) return null;

  try {
    const parsedVendor = JSON.parse(vendor);
    return parsedVendor?._id || parsedVendor?.id || null;
  } catch {
    return null;
  }
};

const ReportsPage = () => {
  const [range, setRange] = useState<RangeKey>("Last 30 days");
  const [segment, setSegment] = useState<Segment>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<{
    totalEarned: number;
    pendingBalance: number;
    withdrawn: number;
    transactions: Transaction[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchOrders = async () => {
    try {
      const vendorId = getVendorId();

      if (!vendorId) {
        throw new Error("Vendor not found");
      }

      const res = await fetch(`http://api.apexbee.in/api/orders/vendor/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setOrders([]);
    }
  };

const fetchEarnings = async () => {
  try {
    const vendorId = getVendorId();

    if (!vendorId) {
      throw new Error("Vendor not found");
    }

    const res = await fetch(
      `http://api.apexbee.in/api/vendor/earnings/${vendorId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch earnings");
    }

    setEarnings({
      totalEarned: data.totalEarned ?? 0,
      pendingBalance: data.pendingBalance ?? 0,
      withdrawn: data.withdrawn ?? 0,
      transactions: data.transactions ?? [],
    });
  } catch (err) {
    console.error("Earnings fetch error:", err);
    setEarnings({
      totalEarned: 0,
      pendingBalance: 0,
      withdrawn: 0,
      transactions: [],
    });
  }
};

  const fetchData = async () => {
    setRefreshing(true);

    await Promise.all([fetchOrders(), fetchEarnings()]);

    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    const now = new Date();
    let startDate: Date | null = null;

    if (range === "Last 7 days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (range === "Last 30 days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (range === "Custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (startDate && range !== "Custom") {
      filtered = filtered.filter((o) => new Date(o.createdAt) >= startDate!);
    }

    if (segment !== "All") {
      const methodMap: Record<Segment, string> = {
        All: "",
        Prepaid: "card",
        COD: "cod",
      };

      filtered = filtered.filter(
        (o) => o.paymentDetails?.method?.toLowerCase() === methodMap[segment]
      );
    }

    return filtered;
  }, [orders, range, segment, customStart, customEnd]);

  const series = useMemo(() => {
    const dailyMap = new Map<string, DailyPoint>();

    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      const revenue = order.orderSummary?.vendorSubtotal || order.orderSummary?.total || 0;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          label: date,
          revenue: 0,
          orders: 0,
        });
      }

      const entry = dailyMap.get(date)!;
      entry.revenue += revenue;
      entry.orders += 1;
    });

    const sorted = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.label).getTime() - new Date(b.label).getTime()
    );

    if (sorted.length === 0) {
      return [{ label: "No data", revenue: 0, orders: 0 }];
    }

    return sorted;
  }, [filteredOrders]);

  const orderSummary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, o) => sum + (o.orderSummary?.vendorSubtotal || o.orderSummary?.total || 0),
      0
    );

    const totalOrders = filteredOrders.length;

    const delivered = filteredOrders.filter(
      (o) => o.orderStatus?.currentStatus === "delivered"
    ).length;

    const cancelled = filteredOrders.filter(
      (o) => o.orderStatus?.currentStatus === "cancelled"
    ).length;

    const returned = filteredOrders.filter(
      (o) => o.orderStatus?.currentStatus === "returned"
    ).length;

    const pending = totalOrders - delivered - cancelled - returned;
    const netEarnings = totalRevenue;

    return {
      totalRevenue,
      totalOrders,
      delivered,
      cancelled,
      returned,
      pending,
      netEarnings,
    };
  }, [filteredOrders]);

  const bestProducts = useMemo(() => {
    const productMap = new Map<
      string,
      {
        name: string;
        soldQty: number;
        revenue: number;
        stockLeft: number;
      }
    >();

    filteredOrders.forEach((order) => {
      order.orderItems?.forEach((item: any) => {
        const id = item.productId?._id || item.productId;

        if (!id) return;

        const name = item.productId?.name || item.name || "Product";
        const qty = item.quantity || 0;
        const revenue = (item.price || 0) * qty;

        if (!productMap.has(id)) {
          productMap.set(id, {
            name,
            soldQty: 0,
            revenue: 0,
            stockLeft: item.productId?.stock || 0,
          });
        }

        const entry = productMap.get(id)!;
        entry.soldQty += qty;
        entry.revenue += revenue;
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p, idx) => ({
        id: `p${idx}`,
        ...p,
      }));
  }, [filteredOrders]);

  const statusBreakdown = useMemo(() => {
    const total = orderSummary.totalOrders || 1;

    return [
      {
        label: "Delivered",
        value: orderSummary.delivered,
        icon: <BadgeCheck className="h-4 w-4" />,
        pct: Math.round((orderSummary.delivered / total) * 100),
      },
      {
        label: "Cancelled",
        value: orderSummary.cancelled,
        icon: <XCircle className="h-4 w-4" />,
        pct: Math.round((orderSummary.cancelled / total) * 100),
      },
      {
        label: "Returned",
        value: orderSummary.returned,
        icon: <RotateCcw className="h-4 w-4" />,
        pct: Math.round((orderSummary.returned / total) * 100),
      },
      {
        label: "Pending",
        value: orderSummary.pending,
        icon: <ShoppingCart className="h-4 w-4" />,
        pct: Math.round((orderSummary.pending / total) * 100),
      },
    ];
  }, [orderSummary]);

  const downloadCSV = (type: "sales" | "orders" | "products" | "earnings") => {
    let csv = "";

    if (type === "sales") {
      csv =
        "date,revenue,orders\n" +
        series.map((d) => `${d.label},${d.revenue},${d.orders}`).join("\n");
    }

    if (type === "orders") {
      csv =
        "metric,value\n" +
        [
          ["totalOrders", orderSummary.totalOrders],
          ["delivered", orderSummary.delivered],
          ["cancelled", orderSummary.cancelled],
          ["returned", orderSummary.returned],
          ["pending", orderSummary.pending],
        ]
          .map(([k, v]) => `${k},${v}`)
          .join("\n");
    }

    if (type === "products") {
      csv =
        "product,soldQty,revenue\n" +
        bestProducts.map((p) => `${p.name},${p.soldQty},${p.revenue}`).join("\n");
    }

    if (type === "earnings" && earnings) {
      csv =
        "type,amount,orderId,description,createdAt\n" +
        earnings.transactions
          .map(
            (t) =>
              `${t.type},${t.amount},${t.orderId || ""},${t.description},${t.createdAt}`
          )
          .join("\n");
    }

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `vendor-${type}-report.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track sales, earnings, order performance and export reports.
          </p>
        </div>

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

                {range === "Custom" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />

                    <span className="self-center">to</span>

                    <input
                      type="date"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                )}

                <Badge variant="secondary" className="gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {range === "Custom" ? `${customStart} – ${customEnd}` : range}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Type</Label>

              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
              >
                <option value="All">All</option>
                <option value="Prepaid">Prepaid</option>
                <option value="COD">COD</option>
              </select>
            </div>

            <Button variant="outline" className="gap-2" onClick={fetchData} disabled={refreshing}>
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

            <Button variant="secondary" className="gap-2" onClick={() => downloadCSV("earnings")}>
              <Download className="h-4 w-4" />
              Earnings CSV
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Earned"
            value={formatCurrency(earnings?.totalEarned || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            hint="Lifetime earnings"
          />

          <StatCard
            title="Pending Balance"
            value={formatCurrency(earnings?.pendingBalance || 0)}
            icon={<Wallet className="h-5 w-5" />}
            hint="Available for withdrawal"
          />

          <StatCard
            title="Withdrawn"
            value={formatCurrency(earnings?.withdrawn || 0)}
            icon={<History className="h-5 w-5" />}
            hint="Already paid out"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(orderSummary.totalRevenue)}
            icon={<TrendingUp className="h-5 w-5" />}
            hint="Gross sales"
          />

          <StatCard
            title="Net Earnings"
            value={formatCurrency(orderSummary.netEarnings)}
            icon={<BarChart3 className="h-5 w-5" />}
            hint="Your earnings"
          />

          <StatCard
            title="Total Orders"
            value={String(orderSummary.totalOrders)}
            icon={<ShoppingCart className="h-5 w-5" />}
            hint="All statuses"
          />

          <StatCard
            title="Returns"
            value={String(orderSummary.returned)}
            icon={<RotateCcw className="h-5 w-5" />}
            hint="Return requests"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue Trend
                <Badge variant="secondary" className="ml-2">
                  {range}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <MiniBarChart data={series} />
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
                      style={{
                        width: `${Math.min(100, Math.max(0, s.pct))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem
                  label="Delivered"
                  value={String(orderSummary.delivered)}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />

                <InfoItem
                  label="Cancelled"
                  value={String(orderSummary.cancelled)}
                  icon={<XCircle className="h-4 w-4" />}
                />

                <InfoItem
                  label="Returned"
                  value={String(orderSummary.returned)}
                  icon={<RotateCcw className="h-4 w-4" />}
                />

                <InfoItem
                  label="Pending"
                  value={String(orderSummary.pending)}
                  icon={<ShoppingCart className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Earnings Transaction History
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {earnings?.transactions?.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>{tx.orderId?.slice(-6) || "-"}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0
                          ? `+${formatCurrency(tx.amount)}`
                          : formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {(!earnings?.transactions || earnings.transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Best Selling Products
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="w-full overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 min-w-[260px] text-left">Product</th>
                      <th className="p-3 min-w-[140px] text-left">Units Sold</th>
                      <th className="p-3 min-w-[160px] text-left">Revenue</th>
                      <th className="p-3 min-w-[140px] text-left">Stock Left</th>
                      <th className="p-3 min-w-[140px] text-left">Performance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bestProducts.map((p) => {
                      const perf =
                        p.stockLeft <= 5 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Low stock
                          </Badge>
                        ) : p.soldQty >= 40 ? (
                          <Badge>
                            <TrendingUp className="h-3.5 w-3.5" />
                            Hot
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        );

                      return (
                        <tr key={p.id}>
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3">{p.soldQty}</td>
                          <td className="p-3 font-medium">{formatCurrency(p.revenue)}</td>
                          <td className="p-3">{p.stockLeft}</td>
                          <td className="p-3">{perf}</td>
                        </tr>
                      );
                    })}

                    {bestProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-4 text-muted-foreground">
                          No product sales data in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default ReportsPage;

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
  const totalRevenue = data.reduce((a, d) => a + d.revenue, 0);
  const totalOrders = data.reduce((a, d) => a + d.orders, 0);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-[220px]">
        {data.map((d, idx) => {
          const h = Math.round((d.revenue / max) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-foreground/80"
                style={{
                  height: `${h}%`,
                }}
                title={`${d.label} • ${formatCurrency(d.revenue)} • ${d.orders} orders`}
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
          <div className="mt-1 font-bold">{formatCurrency(max)}</div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Revenue</div>
          <div className="mt-1 font-bold">{formatCurrency(totalRevenue)}</div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs text-muted-foreground">Total Orders</div>
          <div className="mt-1 font-bold">{totalOrders}</div>
        </div>
      </div>
    </div>
  );
}