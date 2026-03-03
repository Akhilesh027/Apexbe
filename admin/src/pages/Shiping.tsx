// src/pages/admin/ShippingAdmin.tsx
// ✅ Admin Shipping Management (NO AppLayout)
// ✅ Now: Fetch orders from API + Shiprocket shipment actions

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Truck,
  Printer,
  Plus,
  CalendarDays,
  Filter,
  RefreshCw,
  MoreVertical,
  FileText,
  Phone,
  MapPin,
  Clock,
  BadgeCheck,
  Ban,
  AlertTriangle,
  Store,
  ShoppingCart,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type PaymentType = "COD" | "Prepaid";
type ShippingStatus =
  | "To Ship"
  | "Ready for Pickup"
  | "In Transit"
  | "Delivered"
  | "Delayed"
  | "RTO / Failed"
  | "Cancelled";

type ShipmentStatusLabel =
  | "Pending Packaging"
  | "Ready to Ship"
  | "Pickup Scheduled"
  | "Picked Up"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Delayed"
  | "Failed Delivery"
  | "RTO Initiated"
  | "RTO Delivered"
  | "Cancelled";

type TimelineItem = { title: string; date: string; note?: string };

type ShipmentRow = {
  id: string; // row id
  orderId: string; // orderNumber

  vendorName: string;
  vendorId?: string;

  customerName: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;

  itemsCount: number;
  qty: number;
  orderValue: number;
  payment: PaymentType;

  partner: string;
  awb?: string;
  shipmentId?: string;

  status: ShippingStatus;
  statusLabel: ShipmentStatusLabel;

  expectedDelivery: string;
  lastUpdate: string;
  slaBreach?: boolean;

  addressLine: string;
  landmark?: string;

  package: {
    deadWeightKg: number;
    dimensionsCm: { l: number; w: number; h: number };
    packageType: "Box" | "Envelope";
  };

  timeline: TimelineItem[];
};

// --------------------
// Config
// --------------------
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const ADMIN_TOKEN_KEY = "admin_token"; // adjust if you use another key

const STATUS_TABS: ShippingStatus[] = [
  "To Ship",
  "Ready for Pickup",
  "In Transit",
  "Delivered",
  "Delayed",
  "RTO / Failed",
  "Cancelled",
];

const PARTNERS = ["All", "Delhivery", "Shiprocket", "BlueDart", "DTDC", "Ecom Express"];
const DATE_RANGES = ["Today", "Last 7 days", "Last 30 days", "Custom"];

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function authHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ✅ Change this to match your backend orders route
const ORDERS_API = (tab: ShippingStatus, dateRange: string) => {
  const qs = new URLSearchParams();
  qs.set("shipTab", tab);
  qs.set("dateRange", dateRange);
  return `${API_BASE}/api/admin/orders?${qs.toString()}`;
};

// --------------------
// UI helpers
// --------------------
const statusBadge = (status: ShippingStatus) => {
  switch (status) {
    case "Delivered":
      return (
        <Badge className="gap-1">
          <BadgeCheck className="h-3.5 w-3.5" />
          Delivered
        </Badge>
      );
    case "In Transit":
      return (
        <Badge variant="secondary" className="gap-1">
          <Truck className="h-3.5 w-3.5" />
          In Transit
        </Badge>
      );
    case "Ready for Pickup":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3.5 w-3.5" />
          Pickup
        </Badge>
      );
    case "To Ship":
      return (
        <Badge variant="outline" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          To Ship
        </Badge>
      );
    case "Delayed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          Delayed
        </Badge>
      );
    case "RTO / Failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          RTO/Failed
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="outline" className="gap-1">
          <Ban className="h-3.5 w-3.5" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

// --------------------
// Mapping: Order -> ShipmentRow
// --------------------
// ✅ Adjust this mapping to YOUR order schema
function mapOrderToRow(o: any): ShipmentRow {
  const orderNumber = o.orderNumber || o.orderId || String(o._id);

  const addr = o.address || o.shippingAddress || {};
  const items = Array.isArray(o.items) ? o.items : Array.isArray(o.products) ? o.products : [];

  const qty = items.reduce((sum: number, it: any) => sum + Number(it.qty || it.quantity || 1), 0);

  // shiprocket info stored on order?
  const sr = o.shiprocket || o.shipping || {};

  // Derive tab status from shiprocket status (best effort)
  const rawStatus = String(sr.status || o.shippingStatus || o.status || "").toLowerCase();

  const tabStatus: ShippingStatus =
    rawStatus.includes("deliver") ? "Delivered"
    : rawStatus.includes("transit") || rawStatus.includes("shipped") ? "In Transit"
    : rawStatus.includes("pickup") || rawStatus.includes("ready") ? "Ready for Pickup"
    : rawStatus.includes("delay") ? "Delayed"
    : rawStatus.includes("rto") || rawStatus.includes("fail") ? "RTO / Failed"
    : rawStatus.includes("cancel") ? "Cancelled"
    : "To Ship";

  const label: ShipmentStatusLabel =
    tabStatus === "Delivered" ? "Delivered"
    : tabStatus === "In Transit" ? "In Transit"
    : tabStatus === "Ready for Pickup" ? "Pickup Scheduled"
    : tabStatus === "Delayed" ? "Delayed"
    : tabStatus === "RTO / Failed" ? "RTO Initiated"
    : tabStatus === "Cancelled" ? "Cancelled"
    : sr.shipment_id ? "Ready to Ship"
    : "Pending Packaging";

  const createdAt = o.createdAt ? new Date(o.createdAt) : new Date();
  const updatedAt = o.updatedAt ? new Date(o.updatedAt) : createdAt;

  const formatDate = (d: Date) =>
    d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatDateTime = (d: Date) =>
    d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return {
    id: String(o._id || orderNumber),
    orderId: orderNumber,

    vendorName: o.vendor?.name || o.vendorName || "—",
    vendorId: o.vendor?._id || o.vendorId,

    customerName: addr.name || o.customerName || o.userName || "Customer",
    phone: String(addr.phone || o.phone || ""),
    city: addr.city || "",
    state: addr.state || "",
    pincode: String(addr.pincode || ""),

    itemsCount: items.length || 0,
    qty,
    orderValue: Number(o.totalAmount || o.total || o.grandTotal || 0),
    payment: String(o.paymentMethod || o.payment || "").toUpperCase().includes("COD")
      ? "COD"
      : "Prepaid",

    partner: sr.courier_name || sr.partner || (sr.shipment_id ? "Shiprocket" : "—"),
    awb: sr.awb_code || sr.awb,
    shipmentId: sr.shipment_id ? String(sr.shipment_id) : undefined,

    status: tabStatus,
    statusLabel: label,

    expectedDelivery: sr.expected_delivery_date
      ? String(sr.expected_delivery_date)
      : formatDate(new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)), // fallback +3d

    lastUpdate: formatDateTime(updatedAt),
    slaBreach: Boolean(o.slaBreach || sr.slaBreach),

    addressLine: addr.line1 || addr.addressLine || addr.address || "",
    landmark: addr.landmark,

    package: {
      deadWeightKg: Number(o.box?.weight || o.package?.weight || 0.5),
      dimensionsCm: {
        l: Number(o.box?.length || o.package?.length || 10),
        w: Number(o.box?.breadth || o.package?.breadth || 10),
        h: Number(o.box?.height || o.package?.height || 5),
      },
      packageType: Number(o.box?.weight || 0) > 0.7 ? "Box" : "Envelope",
    },

    timeline: Array.isArray(sr.timeline)
      ? sr.timeline
      : [
          { title: "Order Created", date: formatDateTime(createdAt) },
          ...(sr.shipment_id ? [{ title: "Shipment Created", date: formatDateTime(updatedAt) }] : []),
        ],
  };
}

function filteredRows(
  rows: ShipmentRow[],
  tab: ShippingStatus,
  q: string,
  partner: string,
  paymentFilter: "All" | PaymentType,
  slaOnly: boolean
) {
  const query = q.trim().toLowerCase();

  return rows
    .filter((r) => r.status === tab)
    .filter((r) => (partner === "All" ? true : r.partner === partner))
    .filter((r) => (paymentFilter === "All" ? true : r.payment === paymentFilter))
    .filter((r) => (slaOnly ? Boolean(r.slaBreach) : true))
    .filter((r) => {
      if (!query) return true;
      const hay = [
        r.orderId,
        r.vendorName,
        r.customerName,
        r.phone,
        r.awb || "",
        r.shipmentId || "",
        r.city,
        r.state,
        r.pincode,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
}

export default function ShippingAdmin() {
  const [tab, setTab] = useState<ShippingStatus>("To Ship");

  // filters
  const [q, setQ] = useState("");
  const [partner, setPartner] = useState("All");
  const [dateRange, setDateRange] = useState(DATE_RANGES[1]);
  const [paymentFilter, setPaymentFilter] = useState<"All" | PaymentType>("All");
  const [slaOnly, setSlaOnly] = useState(false);

  // data
  const [allRows, setAllRows] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const rows = useMemo(
    () => filteredRows(allRows, tab, q, partner, paymentFilter, slaOnly),
    [allRows, tab, q, partner, paymentFilter, slaOnly]
  );

  const allSelected = useMemo(() => rows.length > 0 && rows.every((r) => selected[r.id]), [rows, selected]);

  const toggleAll = () => {
    const next: Record<string, boolean> = { ...selected };
    if (allSelected) rows.forEach((r) => (next[r.id] = false));
    else rows.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

  const selectedRows = useMemo(() => rows.filter((r) => selected[r.id]), [rows, selected]);
  const selectedCount = selectedRows.length;

  // details dialog
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ShipmentRow | null>(null);

  const openDetails = (row: ShipmentRow) => {
    setActive(row);
    setOpen(true);
  };

  // --------------------
  // API calls
  // --------------------
  const fetchOrders = async () => {
    try {
      setErr("");
      setLoading(true);

      const res = await fetch(ORDERS_API(tab, dateRange), {
        method: "GET",
        headers: authHeaders(),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || "Failed to fetch orders");

      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.orders) ? json.orders : [];
      const mapped = list.map(mapOrderToRow);

      setAllRows(mapped);
      setSelected({}); // reset selection on refresh/tab change
    } catch (e: any) {
      setErr(e?.message || "Error fetching orders");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dateRange]);

  // Create shipment for one order
  const createShipment = async (orderMongoIdOrOrderId: string) => {
    const res = await fetch(`${API_BASE}/api/shiprocket/create-shipment/${orderMongoIdOrOrderId}`, {
      method: "POST",
      headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) throw new Error(json?.message || "Create shipment failed");
    return json?.data || json;
  };

  // Bulk: create shipment for all selected that don't have shipmentId
  const bulkCreateShipments = async () => {
    const targets = selectedRows.filter((r) => !r.shipmentId);
    if (targets.length === 0) return;

    setActionLoading(true);
    try {
      for (const r of targets) {
        // ✅ If your backend expects Mongo _id, pass r.id; if expects orderId, pass r.orderId
        await createShipment(r.id);
      }
      await fetchOrders();
    } catch (e: any) {
      setErr(e?.message || "Bulk create failed");
    } finally {
      setActionLoading(false);
    }
  };

  const printLabels = async () => {
    const shipmentIds = selectedRows.map((r) => r.shipmentId).filter(Boolean) as string[];
    if (shipmentIds.length === 0) {
      setErr("Select shipments that already have shipment_id to print labels.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/shiprocket/label`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ shipmentIds }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || "Label generation failed");

      // Shiprocket typically returns a URL for label PDF
      const url =
        json?.data?.label_url ||
        json?.data?.label_created?.[0] ||
        json?.data?.label ||
        json?.label_url;

      if (url) window.open(url, "_blank");
      else setErr("Label generated but URL not found in response.");
    } catch (e: any) {
      setErr(e?.message || "Print label failed");
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------
  // Render
  // --------------------
  return (
    <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Shipping (Admin)</h1>
        <p className="text-muted-foreground">
          Monitor all vendor shipments, SLA breaches, tracking, and delivery performance.
        </p>
      </div>

      {/* Errors */}
      {err ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      {/* Top actions */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button className="gap-2" onClick={bulkCreateShipments} disabled={actionLoading || selectedCount === 0}>
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Shipment
          </Button>

          <Button variant="secondary" className="gap-2" onClick={printLabels} disabled={actionLoading || selectedCount === 0}>
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print Label
          </Button>

          <Button variant="outline" className="gap-2" onClick={fetchOrders} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        <div className="relative w-full lg:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search Order ID / Vendor / Customer / Phone / Tracking"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Shipping Partner</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
              >
                {PARTNERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {DATE_RANGES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {dateRange}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
              >
                <option value="All">All</option>
                <option value="COD">COD</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="slaOnly"
                  checked={slaOnly}
                  onCheckedChange={(v) => setSlaOnly(Boolean(v))}
                />
                <Label htmlFor="slaOnly" className="cursor-pointer">
                  Show SLA breach only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + data */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ShippingStatus)}>
          <TabsList className="flex flex-wrap h-auto">
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="data-[state=active]:font-semibold">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUS_TABS.map((s) => (
            <TabsContent key={s} value={s} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {s} Shipments
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  {loading ? (
                    <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
                    </div>
                  ) : rows.length === 0 ? (
                    <EmptyState tab={tab} />
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden lg:block w-full overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="p-3 w-[40px]">
                                <Checkbox checked={allSelected} onCheckedChange={toggleAll as any} />
                              </th>
                              <th className="p-3 min-w-[150px]">Order ID</th>
                              <th className="p-3 min-w-[220px]">Vendor</th>
                              <th className="p-3 min-w-[200px]">Customer</th>
                              <th className="p-3 min-w-[200px]">City/State</th>
                              <th className="p-3 min-w-[130px]">Order Value</th>
                              <th className="p-3 min-w-[110px]">Payment</th>
                              <th className="p-3 min-w-[140px]">Partner</th>
                              <th className="p-3 min-w-[170px]">AWB</th>
                              <th className="p-3 min-w-[130px]">Status</th>
                              <th className="p-3 min-w-[160px]">Expected</th>
                              <th className="p-3 min-w-[160px]">Last Update</th>
                              <th className="p-3 min-w-[110px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.id} className="border-t hover:bg-muted/30">
                                <td className="p-3">
                                  <Checkbox
                                    checked={Boolean(selected[r.id])}
                                    onCheckedChange={(v) =>
                                      setSelected((prev) => ({ ...prev, [r.id]: Boolean(v) }))
                                    }
                                  />
                                </td>

                                <td className="p-3 font-medium">{r.orderId}</td>

                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{r.vendorName}</span>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{r.customerName}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3.5 w-3.5" /> {r.phone}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                      {r.city}, {r.state}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {r.pincode}
                                      {r.slaBreach ? (
                                        <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                                          <AlertTriangle className="h-3.5 w-3.5" /> SLA breach
                                        </span>
                                      ) : null}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3 font-medium">{money(r.orderValue)}</td>

                                <td className="p-3">
                                  <Badge variant={r.payment === "COD" ? "outline" : "secondary"}>
                                    {r.payment}
                                  </Badge>
                                </td>

                                <td className="p-3">{r.partner}</td>

                                <td className="p-3">
                                  {r.awb ? (
                                    <span className="font-medium">{r.awb}</span>
                                  ) : (
                                    <span className="text-muted-foreground">Not generated</span>
                                  )}
                                </td>

                                <td className="p-3">{statusBadge(r.status)}</td>

                                <td className="p-3">{r.expectedDelivery}</td>
                                <td className="p-3">{r.lastUpdate}</td>

                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openDetails(r)}
                                      className="gap-1.5"
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
                                        <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                          onClick={async () => {
                                            setActionLoading(true);
                                            setErr("");
                                            try {
                                              await createShipment(r.id);
                                              await fetchOrders();
                                            } catch (e: any) {
                                              setErr(e?.message || "Generate shipment failed");
                                            } finally {
                                              setActionLoading(false);
                                            }
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          Create/Generate Shipment
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                          onClick={() => {
                                            // You can later connect pickup scheduling endpoint here
                                            setErr("Pickup scheduling API not wired yet.");
                                          }}
                                        >
                                          <CalendarDays className="mr-2 h-4 w-4" />
                                          Schedule Pickup
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                          onClick={async () => {
                                            if (!r.shipmentId) return setErr("Create shipment first.");
                                            setSelected({ [r.id]: true });
                                            await printLabels();
                                          }}
                                        >
                                          <Printer className="mr-2 h-4 w-4" />
                                          Print Label
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setErr("Cancel shipment API not wired yet.")}
                                        >
                                          <Ban className="mr-2 h-4 w-4" />
                                          Cancel Shipment
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

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {rows.map((r) => (
                          <Card key={r.id}>
                            <CardContent className="p-4 space-y-2 text-sm">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="font-semibold">{r.orderId}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Store className="h-3.5 w-3.5" /> {r.vendorName}
                                  </div>
                                </div>
                                {statusBadge(r.status)}
                              </div>

                              <div className="text-muted-foreground">
                                {r.customerName} • {r.phone}
                              </div>

                              <div className="text-muted-foreground">
                                {r.city}, {r.state} • {r.pincode}
                                {r.slaBreach ? (
                                  <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                                    <AlertTriangle className="h-3.5 w-3.5" /> SLA breach
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="font-semibold">{money(r.orderValue)}</div>
                                <Badge variant={r.payment === "COD" ? "outline" : "secondary"}>
                                  {r.payment}
                                </Badge>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Partner: {r.partner} {r.awb ? `• AWB: ${r.awb}` : "• AWB: —"}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetails(r)}>
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1"
                                  onClick={async () => {
                                    setActionLoading(true);
                                    setErr("");
                                    try {
                                      await createShipment(r.id);
                                      await fetchOrders();
                                    } catch (e: any) {
                                      setErr(e?.message || "Create shipment failed");
                                    } finally {
                                      setActionLoading(false);
                                    }
                                  }}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Shipment"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Bulk bar */}
                      {selectedCount > 0 && (
                        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-lg border p-3 bg-muted/20">
                          <div className="text-sm">
                            <span className="font-medium">{selectedCount}</span> shipments selected
                            <span className="text-muted-foreground"> — bulk actions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" className="gap-2" onClick={bulkCreateShipments} disabled={actionLoading}>
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              Create Shipments
                            </Button>
                            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setErr("Pickup bulk API not wired yet.")}>
                              <CalendarDays className="h-4 w-4" />
                              Schedule Pickup
                            </Button>
                            <Button size="sm" variant="secondary" className="gap-2" onClick={printLabels} disabled={actionLoading}>
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                              Print Labels
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipment Details (Admin)</DialogTitle>
            <DialogDescription>
              Vendor + shipment overview, address, package info, and timeline.
            </DialogDescription>
          </DialogHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">No shipment selected.</div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Shipment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoItem label="Order ID" value={active.orderId} />
                    <InfoItem label="Vendor" value={active.vendorName} />
                    <InfoItem label="Shipping Partner" value={active.partner} />
                    <InfoItem label="Shipment ID" value={active.shipmentId || "Not created"} />
                    <InfoItem label="Tracking (AWB)" value={active.awb || "Not generated"} />
                    <InfoItem label="Current Status" value={active.statusLabel} />
                    <InfoItem label="Expected Delivery" value={active.expectedDelivery} />
                    <InfoItem label="Last Update" value={active.lastUpdate} />
                    <InfoItem label="Payment" value={active.payment} />
                    <InfoItem label="Order Value" value={money(active.orderValue)} />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="gap-2"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        setErr("");
                        try {
                          await createShipment(active.id);
                          await fetchOrders();
                        } catch (e: any) {
                          setErr(e?.message || "Create shipment failed");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create Shipment
                    </Button>

                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setErr("Pickup scheduling API not wired yet.")}
                    >
                      <CalendarDays className="h-4 w-4" />
                      Schedule Pickup
                    </Button>

                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={async () => {
                        if (!active.shipmentId) return setErr("Create shipment first.");
                        setSelected({ [active.id]: true });
                        await printLabels();
                      }}
                    >
                      <Printer className="h-4 w-4" />
                      Print Label
                    </Button>

                    <Button variant="outline" className="gap-2" onClick={() => setErr("Mark shipped API not wired yet.")}>
                      <Truck className="h-4 w-4" />
                      Mark as Shipped
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm space-y-2">
                    <div className="font-medium">{active.customerName}</div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" /> {active.phone}
                    </div>
                    <div>
                      {active.addressLine}
                      {active.landmark ? <span className="text-muted-foreground">, {active.landmark}</span> : null}
                    </div>
                    <div className="text-muted-foreground">
                      {active.city}, {active.state} — {active.pincode}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Package Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm space-y-2">
                    <InfoItem label="Package Type" value={active.package.packageType} />
                    <InfoItem label="Dead Weight" value={`${active.package.deadWeightKg} kg`} />
                    <InfoItem
                      label="Dimensions"
                      value={`${active.package.dimensionsCm.l} × ${active.package.dimensionsCm.w} × ${active.package.dimensionsCm.h} cm`}
                    />
                    <p className="text-xs text-muted-foreground">Volumetric weight calculation can be added later.</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {active.timeline.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No timeline updates yet.</div>
                  ) : (
                    <ol className="space-y-3">
                      {active.timeline.map((t, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-foreground/80" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium">{t.title}</div>
                              <div className="text-xs text-muted-foreground">{t.date}</div>
                            </div>
                            {t.note ? <div className="text-sm text-muted-foreground">{t.note}</div> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="gap-2" onClick={() => setErr("Save updates API not wired yet.")}>
              <BadgeCheck className="h-4 w-4" />
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
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

function EmptyState({ tab }: { tab: ShippingStatus }) {
  const title = tab === "To Ship" ? "No orders to ship" : "No shipments found";
  const desc =
    tab === "To Ship"
      ? "You’re all caught up. New orders will appear here."
      : "Try adjusting filters or search by Order ID / Vendor / Tracking.";

  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <Truck className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}