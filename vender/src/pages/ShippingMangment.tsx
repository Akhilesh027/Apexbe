// src/pages/vendor/ShippingManagement.tsx
import { useMemo, useState } from "react";
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
} from "lucide-react";

import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
import AppLayout from "@/components/AppLayout";

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

type TimelineItem = {
  title: string;
  date: string;
  note?: string;
};

type ShipmentRow = {
  id: string;
  orderId: string;
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

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const statusBadge = (status: ShippingStatus) => {
  switch (status) {
    case "Delivered":
      return <Badge className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />Delivered</Badge>;
    case "In Transit":
      return <Badge variant="secondary" className="gap-1"><Truck className="h-3.5 w-3.5" />In Transit</Badge>;
    case "Ready for Pickup":
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3.5 w-3.5" />Pickup</Badge>;
    case "To Ship":
      return <Badge variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" />To Ship</Badge>;
    case "Delayed":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Delayed</Badge>;
    case "RTO / Failed":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />RTO/Failed</Badge>;
    case "Cancelled":
      return <Badge variant="outline" className="gap-1"><Ban className="h-3.5 w-3.5" />Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const mockRows: ShipmentRow[] = [
  {
    id: "1",
    orderId: "APX-ORD-10231",
    customerName: "Guru Swamy",
    phone: "9XXXXXXXXX",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    itemsCount: 2,
    qty: 3,
    orderValue: 1899,
    payment: "Prepaid",
    partner: "Delhivery",
    awb: "DLV123456789",
    status: "To Ship",
    statusLabel: "Ready to Ship",
    expectedDelivery: "Mar 03, 2026",
    lastUpdate: "Today, 11:20 AM",
    slaBreach: false,
    addressLine: "Hitech City, Madhapur",
    landmark: "Near Metro Station",
    package: {
      deadWeightKg: 0.8,
      dimensionsCm: { l: 25, w: 18, h: 10 },
      packageType: "Box",
    },
    timeline: [
      { title: "Order Confirmed", date: "Feb 27, 2026 10:10 AM" },
      { title: "Packed", date: "Feb 27, 2026 11:20 AM" },
    ],
  },
  {
    id: "2",
    orderId: "APX-ORD-10232",
    customerName: "Akhil Reddy",
    phone: "8XXXXXXXXX",
    city: "Warangal",
    state: "Telangana",
    pincode: "506002",
    itemsCount: 1,
    qty: 1,
    orderValue: 799,
    payment: "COD",
    partner: "Shiprocket",
    awb: "SR987654321",
    status: "In Transit",
    statusLabel: "In Transit",
    expectedDelivery: "Mar 02, 2026",
    lastUpdate: "Yesterday, 8:05 PM",
    slaBreach: true,
    addressLine: "Hanamkonda",
    package: {
      deadWeightKg: 0.4,
      dimensionsCm: { l: 20, w: 15, h: 8 },
      packageType: "Envelope",
    },
    timeline: [
      { title: "Order Confirmed", date: "Feb 26, 2026 04:12 PM" },
      { title: "Pickup Scheduled", date: "Feb 26, 2026 06:00 PM" },
      { title: "Picked Up", date: "Feb 26, 2026 08:30 PM" },
      { title: "In Transit", date: "Feb 27, 2026 10:15 AM" },
    ],
  },
  {
    id: "3",
    orderId: "APX-ORD-10233",
    customerName: "Priya",
    phone: "7XXXXXXXXX",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    pincode: "520001",
    itemsCount: 3,
    qty: 5,
    orderValue: 3299,
    payment: "Prepaid",
    partner: "BlueDart",
    status: "Delivered",
    statusLabel: "Delivered",
    expectedDelivery: "Feb 27, 2026",
    lastUpdate: "Feb 27, 2026 06:40 PM",
    slaBreach: false,
    addressLine: "MG Road",
    package: {
      deadWeightKg: 1.2,
      dimensionsCm: { l: 30, w: 22, h: 12 },
      packageType: "Box",
    },
    timeline: [
      { title: "Order Confirmed", date: "Feb 24, 2026 02:10 PM" },
      { title: "Pickup Scheduled", date: "Feb 24, 2026 05:00 PM" },
      { title: "Picked Up", date: "Feb 24, 2026 07:15 PM" },
      { title: "Out for Delivery", date: "Feb 27, 2026 10:30 AM" },
      { title: "Delivered", date: "Feb 27, 2026 06:40 PM" },
    ],
  },
];

export default function ShippingManagement() {
  const [tab, setTab] = useState<ShippingStatus>("To Ship");

  // filters
  const [q, setQ] = useState("");
  const [partner, setPartner] = useState("All");
  const [dateRange, setDateRange] = useState(DATE_RANGES[1]);
  const [paymentFilter, setPaymentFilter] = useState<"All" | PaymentType>("All");
  const [slaOnly, setSlaOnly] = useState(false);

  // selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected = useMemo(() => {
    const rows = filteredRows(tab, q, partner, paymentFilter, slaOnly);
    return rows.length > 0 && rows.every((r) => selected[r.id]);
  }, [tab, q, partner, paymentFilter, slaOnly, selected]);

  // details dialog
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ShipmentRow | null>(null);

  const rows = useMemo(
    () => filteredRows(tab, q, partner, paymentFilter, slaOnly),
    [tab, q, partner, paymentFilter, slaOnly]
  );

  const toggleAll = () => {
    const next: Record<string, boolean> = { ...selected };
    if (allSelected) {
      rows.forEach((r) => (next[r.id] = false));
    } else {
      rows.forEach((r) => (next[r.id] = true));
    }
    setSelected(next);
  };

  const selectedCount = useMemo(
    () => rows.filter((r) => selected[r.id]).length,
    [rows, selected]
  );

  const openDetails = (row: ShipmentRow) => {
    setActive(row);
    setOpen(true);
  };

  return (
    <>
      <AppLayout>

      <main className="mx-10px w-[min(1200px,calc(100%-48px))] py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Shipping Management</h1>
          <p className="text-muted-foreground">
            Manage shipments—create shipments, print labels, update tracking, and monitor delivery status.
          </p>
        </div>

        {/* Top actions */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Shipment
            </Button>

            <Button variant="secondary" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Label
            </Button>

            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCount} selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-[360px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search Order ID / Customer / Phone / Tracking"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Tabs + table */}
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
                    {rows.length === 0 ? (
                      <EmptyState tab={tab} />
                    ) : (
                      <div className="w-full overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="p-3 w-[40px]">
                                <Checkbox checked={allSelected} onCheckedChange={toggleAll as any} />
                              </th>
                              <th className="p-3 min-w-[140px]">Order ID</th>
                              <th className="p-3 min-w-[180px]">Customer</th>
                              <th className="p-3 min-w-[200px]">Address</th>
                              <th className="p-3 min-w-[120px]">Items / Qty</th>
                              <th className="p-3 min-w-[120px]">Order Value</th>
                              <th className="p-3 min-w-[110px]">Payment</th>
                              <th className="p-3 min-w-[140px]">Partner</th>
                              <th className="p-3 min-w-[160px]">AWB / Tracking</th>
                              <th className="p-3 min-w-[130px]">Status</th>
                              <th className="p-3 min-w-[160px]">Expected Delivery</th>
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

                                <td className="p-3">
                                  {r.itemsCount} items / {r.qty} qty
                                </td>

                                <td className="p-3">{money(r.orderValue)}</td>

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
                                        <DropdownMenuLabel>Shipment Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                          <Plus className="mr-2 h-4 w-4" />
                                          Generate AWB
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <CalendarDays className="mr-2 h-4 w-4" />
                                          Schedule Pickup
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Printer className="mr-2 h-4 w-4" />
                                          Print Label
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Truck className="mr-2 h-4 w-4" />
                                          Mark as Shipped
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                    )}

                    {/* Quick bulk bar */}
                    {selectedCount > 0 && (
                      <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between rounded-lg border p-3 bg-muted/20">
                        <div className="text-sm">
                          <span className="font-medium">{selectedCount}</span> shipments selected
                          <span className="text-muted-foreground"> — bulk actions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Generate AWB
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Schedule Pickup
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print Labels
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      {/* Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
            <DialogDescription>
              View shipment overview, address, package info, and status timeline.
            </DialogDescription>
          </DialogHeader>

          {!active ? (
            <div className="py-8 text-center text-muted-foreground">No shipment selected.</div>
          ) : (
            <div className="space-y-4">
              {/* Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoItem label="Order ID" value={active.orderId} />
                    <InfoItem label="Shipping Partner" value={active.partner} />
                    <InfoItem label="Tracking (AWB)" value={active.awb || "Not generated"} />
                    <InfoItem label="Current Status" value={active.statusLabel} />
                    <InfoItem label="Expected Delivery" value={active.expectedDelivery} />
                    <InfoItem label="Last Update" value={active.lastUpdate} />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Generate AWB
                    </Button>
                    <Button variant="secondary" className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Schedule Pickup
                    </Button>
                    <Button variant="secondary" className="gap-2">
                      <Printer className="h-4 w-4" />
                      Print Label
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Truck className="h-4 w-4" />
                      Mark as Shipped
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Address + Package */}
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
                    <p className="text-xs text-muted-foreground">
                      Volumetric weight can be calculated automatically (later).
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
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
            <Button className="gap-2">
              <BadgeCheck className="h-4 w-4" />
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
        </AppLayout>
    </>
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
  const title =
    tab === "To Ship"
      ? "No orders to ship"
      : "No shipments found";

  const desc =
    tab === "To Ship"
      ? "You’re all caught up. New paid orders will appear here automatically."
      : "Try adjusting your filters or searching with Order ID / Tracking number.";

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

function filteredRows(
  tab: ShippingStatus,
  q: string,
  partner: string,
  paymentFilter: "All" | PaymentType,
  slaOnly: boolean
) {
  const query = q.trim().toLowerCase();

  return mockRows
    .filter((r) => r.status === tab)
    .filter((r) => (partner === "All" ? true : r.partner === partner))
    .filter((r) => (paymentFilter === "All" ? true : r.payment === paymentFilter))
    .filter((r) => (slaOnly ? Boolean(r.slaBreach) : true))
    .filter((r) => {
      if (!query) return true;
      const hay = [
        r.orderId,
        r.customerName,
        r.phone,
        r.awb || "",
        r.city,
        r.state,
        r.pincode,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
}