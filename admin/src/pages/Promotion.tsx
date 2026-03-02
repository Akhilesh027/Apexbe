// src/pages/admin/PromotionsAdmin.tsx
// ✅ Admin Promotions page
// ✅ Create / Edit coupon (global)
// ✅ Tabs: All / Active / Scheduled / Expired / Disabled
// ✅ Usage tracking + CSV export
// ✅ Layout-friendly with AppLayout

"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  TicketPercent,
  CalendarDays,
  Search,
  Download,
  MoreVertical,
  Pencil,
  Ban,
  BadgeCheck,
  Clock,
  IndianRupee,
  Percent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type DiscountType = "percent" | "flat";
type Audience = "All Users" | "New Users" | "Vendors Only";

type Coupon = {
  id: string;
  code: string;
  title: string;
  description?: string;

  type: DiscountType;
  value: number;

  minOrderValue: number;
  maxDiscountAmount?: number; // used for percent type
  maxUsageTotal: number;
  maxUsagePerUser: number;

  startAt: string; // YYYY-MM-DD
  endAt: string; // YYYY-MM-DD

  audience: Audience;
  isEnabled: boolean;

  usedCount: number;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const today = () => new Date();

function isScheduled(c: Coupon) {
  return new Date(c.startAt) > today();
}

function isExpired(c: Coupon) {
  return new Date(c.endAt) < today();
}

function isActive(c: Coupon) {
  const now = today();
  return c.isEnabled && new Date(c.startAt) <= now && new Date(c.endAt) >= now;
}

function statusBadge(c: Coupon) {
  if (!c.isEnabled) return <Badge variant="outline" className="gap-1"><Ban className="h-3.5 w-3.5" />Disabled</Badge>;
  if (isScheduled(c)) return <Badge variant="secondary" className="gap-1"><Clock className="h-3.5 w-3.5" />Scheduled</Badge>;
  if (isExpired(c)) return <Badge variant="outline">Expired</Badge>;
  if (isActive(c)) return <Badge className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />Active</Badge>;
  return <Badge variant="secondary">Inactive</Badge>;
}

const mockCoupons: Coupon[] = [
  {
    id: "cp1",
    code: "WELCOME10",
    title: "Welcome Offer",
    description: "10% off for new users",
    type: "percent",
    value: 10,
    minOrderValue: 499,
    maxDiscountAmount: 200,
    maxUsageTotal: 500,
    maxUsagePerUser: 1,
    startAt: "2026-02-10",
    endAt: "2026-03-10",
    audience: "New Users",
    isEnabled: true,
    usedCount: 132,
  },
  {
    id: "cp2",
    code: "FLAT200",
    title: "Flat ₹200 Off",
    description: "Flat discount on orders above ₹999",
    type: "flat",
    value: 200,
    minOrderValue: 999,
    maxUsageTotal: 1000,
    maxUsagePerUser: 2,
    startAt: "2026-01-01",
    endAt: "2026-02-01",
    audience: "All Users",
    isEnabled: true,
    usedCount: 864,
  },
  {
    id: "cp3",
    code: "SUMMER15",
    title: "Summer Sale",
    description: "15% discount limited time",
    type: "percent",
    value: 15,
    minOrderValue: 799,
    maxDiscountAmount: 300,
    maxUsageTotal: 800,
    maxUsagePerUser: 1,
    startAt: "2026-04-01",
    endAt: "2026-04-30",
    audience: "All Users",
    isEnabled: true,
    usedCount: 0,
  },
  {
    id: "cp4",
    code: "VENDOR50",
    title: "Vendor Special",
    description: "Flat ₹50 off (vendors)",
    type: "flat",
    value: 50,
    minOrderValue: 299,
    maxUsageTotal: 300,
    maxUsagePerUser: 5,
    startAt: "2026-02-01",
    endAt: "2026-03-01",
    audience: "Vendors Only",
    isEnabled: false,
    usedCount: 12,
  },
];

export default function PromotionsAdmin() {
  const [tab, setTab] = useState<"all" | "active" | "scheduled" | "expired" | "disabled">("all");
  const [q, setQ] = useState("");

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return coupons
      .filter((c) => {
        if (tab === "active") return isActive(c);
        if (tab === "scheduled") return c.isEnabled && isScheduled(c);
        if (tab === "expired") return c.isEnabled && isExpired(c);
        if (tab === "disabled") return !c.isEnabled;
        return true;
      })
      .filter((c) => {
        if (!query) return true;
        return `${c.code} ${c.title} ${c.audience}`.toLowerCase().includes(query);
      });
  }, [coupons, tab, q]);

  const summary = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => isActive(c)).length;
    const scheduled = coupons.filter((c) => c.isEnabled && isScheduled(c)).length;
    const expired = coupons.filter((c) => c.isEnabled && isExpired(c)).length;
    const disabled = coupons.filter((c) => !c.isEnabled).length;
    const totalUsage = coupons.reduce((a, c) => a + c.usedCount, 0);
    return { total, active, scheduled, expired, disabled, totalUsage };
  }, [coupons]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setOpen(true);
  };

  const toggleEnabled = (id: string) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c)));
  };

  const onSave = (data: Coupon) => {
    if (editing) {
      setCoupons((prev) => prev.map((c) => (c.id === editing.id ? data : c)));
    } else {
      setCoupons((prev) => [{ ...data, id: crypto.randomUUID() }, ...prev]);
    }
    setOpen(false);
  };

  const exportCSV = () => {
    const csv =
      "code,title,type,value,minOrder,maxDiscount,maxUsageTotal,maxUsagePerUser,startAt,endAt,audience,isEnabled,usedCount\n" +
      coupons
        .map((c) =>
          [
            c.code,
            c.title,
            c.type,
            c.value,
            c.minOrderValue,
            c.maxDiscountAmount ?? "",
            c.maxUsageTotal,
            c.maxUsagePerUser,
            c.startAt,
            c.endAt,
            c.audience,
            c.isEnabled,
            c.usedCount,
          ].join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-coupons.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
  
      <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Create global coupons, control schedules, and track coupon usage.
          </p>
        </div>

        {/* Top actions */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
            <Button variant="secondary" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="relative w-full md:w-[380px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search coupon code / title / audience"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard title="Total" value={String(summary.total)} icon={<TicketPercent className="h-5 w-5" />} hint="Coupons" />
          <StatCard title="Active" value={String(summary.active)} icon={<BadgeCheck className="h-5 w-5" />} hint="Live now" />
          <StatCard title="Scheduled" value={String(summary.scheduled)} icon={<Clock className="h-5 w-5" />} hint="Upcoming" />
          <StatCard title="Expired" value={String(summary.expired)} icon={<CalendarDays className="h-5 w-5" />} hint="Ended" />
          <StatCard title="Disabled" value={String(summary.disabled)} icon={<Ban className="h-5 w-5" />} hint="Off" />
          <StatCard title="Total Usage" value={String(summary.totalUsage)} icon={<TicketPercent className="h-5 w-5" />} hint="Used count" />
        </div>

        {/* Tabs + Table */}
        <div className="mt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="disabled">Disabled</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TicketPercent className="h-4 w-4" />
                    Coupons
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {filtered.length === 0 ? (
                    <EmptyState onCreate={openCreate} />
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden lg:block w-full overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="p-3 min-w-[140px]">Code</th>
                              <th className="p-3 min-w-[220px]">Title</th>
                              <th className="p-3 min-w-[160px]">Discount</th>
                              <th className="p-3 min-w-[140px]">Min Order</th>
                              <th className="p-3 min-w-[160px]">Usage</th>
                              <th className="p-3 min-w-[200px]">Start → End</th>
                              <th className="p-3 min-w-[160px]">Audience</th>
                              <th className="p-3 min-w-[130px]">Status</th>
                              <th className="p-3 min-w-[120px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((c) => (
                              <tr key={c.id} className="border-t hover:bg-muted/30">
                                <td className="p-3 font-medium">{c.code}</td>
                                <td className="p-3">
                                  <div className="font-medium">{c.title}</div>
                                  {c.description ? (
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {c.description}
                                    </div>
                                  ) : null}
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {c.type === "percent" ? (
                                      <Badge variant="secondary" className="gap-1">
                                        <Percent className="h-3.5 w-3.5" />
                                        {c.value}%
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="gap-1">
                                        <IndianRupee className="h-3.5 w-3.5" />
                                        {money(c.value)}
                                      </Badge>
                                    )}
                                    {c.type === "percent" && c.maxDiscountAmount ? (
                                      <span className="text-xs text-muted-foreground">
                                        max {money(c.maxDiscountAmount)}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                <td className="p-3">{money(c.minOrderValue)}</td>

                                <td className="p-3">
                                  <div className="font-medium">
                                    {c.usedCount}/{c.maxUsageTotal}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    per user: {c.maxUsagePerUser}
                                  </div>
                                </td>

                                <td className="p-3">
                                  {c.startAt} → {c.endAt}
                                </td>

                                <td className="p-3">{c.audience}</td>

                                <td className="p-3">{statusBadge(c)}</td>

                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="secondary">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => openEdit(c)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleEnabled(c.id)}>
                                          <Ban className="mr-2 h-4 w-4" />
                                          {c.isEnabled ? "Disable" : "Enable"}
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

                      {/* Mobile cards */}
                      <div className="lg:hidden space-y-3">
                        {filtered.map((c) => (
                          <Card key={c.id}>
                            <CardContent className="p-4 space-y-2 text-sm">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="font-semibold">{c.code}</div>
                                  <div className="text-xs text-muted-foreground">{c.title}</div>
                                </div>
                                {statusBadge(c)}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  {c.type === "percent" ? `${c.value}%` : money(c.value)}
                                </div>
                                <div className="text-muted-foreground">
                                  Used: {c.usedCount}/{c.maxUsageTotal}
                                </div>
                              </div>

                              <div className="text-muted-foreground">
                                {c.startAt} → {c.endAt}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="secondary">{c.audience}</Badge>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => toggleEnabled(c.id)}>
                                    {c.isEnabled ? "Disable" : "Enable"}
                                  </Button>
                                </div>
                              </div>
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

        {/* Create / Edit modal */}
        <CouponDialog
          open={open}
          onClose={() => setOpen(false)}
          editing={editing}
          onSave={onSave}
        />
      </main>
   
  );
}

/* ---------------- Components ---------------- */

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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <TicketPercent className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">No coupons found</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Create a coupon to start promotions and track usage.
      </div>
      <Button className="mt-4 gap-2" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Create Coupon
      </Button>
    </div>
  );
}

function CouponDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Coupon | null;
  onSave: (data: Coupon) => void;
}) {
  const [form, setForm] = useState<Coupon>(
    editing || {
      id: crypto.randomUUID(),
      code: "",
      title: "",
      description: "",
      type: "percent",
      value: 10,
      minOrderValue: 499,
      maxDiscountAmount: 200,
      maxUsageTotal: 500,
      maxUsagePerUser: 1,
      startAt: "",
      endAt: "",
      audience: "All Users",
      isEnabled: true,
      usedCount: 0,
    }
  );

  // reset when opening or editing changes
  useMemo(() => {
    if (!open) return;
    setForm(
      editing || {
        id: crypto.randomUUID(),
        code: "",
        title: "",
        description: "",
        type: "percent",
        value: 10,
        minOrderValue: 499,
        maxDiscountAmount: 200,
        maxUsageTotal: 500,
        maxUsagePerUser: 1,
        startAt: "",
        endAt: "",
        audience: "All Users",
        isEnabled: true,
        usedCount: 0,
      }
    );
  }, [open, editing]);

  const update = (k: keyof Coupon, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          <DialogDescription>Admin can create global coupons for promotions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Coupon Code</Label>
              <Input
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase())}
                placeholder="WELCOME10"
              />
            </div>
            <div>
              <Label>Audience</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.audience}
                onChange={(e) => update("audience", e.target.value as Audience)}
              >
                <option value="All Users">All Users</option>
                <option value="New Users">New Users</option>
                <option value="Vendors Only">Vendors Only</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Welcome Offer" />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="Explain coupon terms..." />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Discount Type</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.type}
                onChange={(e) => update("type", e.target.value as DiscountType)}
              >
                <option value="percent">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>

            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => update("value", Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Min Order Value</Label>
              <Input
                type="number"
                value={form.minOrderValue}
                onChange={(e) => update("minOrderValue", Number(e.target.value))}
              />
            </div>
          </div>

          {form.type === "percent" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Max Discount Amount</Label>
                <Input
                  type="number"
                  value={form.maxDiscountAmount || 0}
                  onChange={(e) => update("maxDiscountAmount", Number(e.target.value))}
                />
              </div>
              <div className="text-xs text-muted-foreground flex items-end">
                Example: 10% up to ₹200 max
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Max Usage (Total)</Label>
              <Input
                type="number"
                value={form.maxUsageTotal}
                onChange={(e) => update("maxUsageTotal", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Max Usage (Per User)</Label>
              <Input
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) => update("maxUsagePerUser", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.startAt} onChange={(e) => update("startAt", e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.endAt} onChange={(e) => update("endAt", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.isEnabled} onCheckedChange={(v) => update("isEnabled", v)} />
            <Label>Enabled</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>
            Save Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}