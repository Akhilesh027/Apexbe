// components/vendor/promotions/PromotionsPage.tsx
// ✅ Layout-friendly (NO Navbar/Footer)
// ✅ Coupon create / edit / disable
// ✅ Tabs: All / Active / Scheduled / Expired
// ✅ Usage tracking
// ✅ Ready to connect to backend later

"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  TicketPercent,
  CalendarDays,
  Percent,
  IndianRupee,
  Search,
  MoreVertical,
  Pencil,
  Ban,
  BadgeCheck,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppLayout from "@/components/AppLayout";

type DiscountType = "percent" | "flat";

type Coupon = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue: number;
  maxUsage: number;
  usedCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const today = new Date();

function isActive(c: Coupon) {
  const now = today;
  return (
    c.isActive &&
    new Date(c.startAt) <= now &&
    new Date(c.endAt) >= now
  );
}

function isScheduled(c: Coupon) {
  return new Date(c.startAt) > today;
}

function isExpired(c: Coupon) {
  return new Date(c.endAt) < today;
}

const mockCoupons: Coupon[] = [
  {
    id: "c1",
    code: "FRUIT10",
    type: "percent",
    value: 10,
    minOrderValue: 499,
    maxUsage: 100,
    usedCount: 34,
    startAt: "2026-02-20",
    endAt: "2026-03-10",
    isActive: true,
  },
  {
    id: "c2",
    code: "WELCOME200",
    type: "flat",
    value: 200,
    minOrderValue: 999,
    maxUsage: 50,
    usedCount: 50,
    startAt: "2026-01-01",
    endAt: "2026-02-01",
    isActive: true,
  },
  {
    id: "c3",
    code: "SUMMER15",
    type: "percent",
    value: 15,
    minOrderValue: 799,
    maxUsage: 200,
    usedCount: 0,
    startAt: "2026-04-01",
    endAt: "2026-04-30",
    isActive: true,
  },
];

export default function PromotionsPage() {
  const [tab, setTab] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [q, setQ] = useState("");

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const filtered = useMemo(() => {
    return coupons
      .filter((c) => {
        if (tab === "active") return isActive(c);
        if (tab === "scheduled") return isScheduled(c);
        if (tab === "expired") return isExpired(c);
        return true;
      })
      .filter((c) =>
        c.code.toLowerCase().includes(q.toLowerCase())
      );
  }, [tab, coupons, q]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setOpen(true);
  };

  const handleSave = (data: Coupon) => {
    if (editing) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === editing.id ? data : c))
      );
    } else {
      setCoupons((prev) => [...prev, data]);
    }
    setOpen(false);
  };

  const toggleActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  return (
   <AppLayout>
     <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Promotions
        </h1>
        <p className="text-muted-foreground">
          Create and manage discount coupons to boost your sales.
        </p>
      </div>

      {/* Top Controls */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 justify-between">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>

        <div className="relative w-full md:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search coupon code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
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
                  <div className="py-10 text-center text-muted-foreground">
                    No coupons found.
                  </div>
                ) : (
                  <div className="w-full overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="p-3">Code</th>
                          <th className="p-3">Discount</th>
                          <th className="p-3">Min Order</th>
                          <th className="p-3">Usage</th>
                          <th className="p-3">Start</th>
                          <th className="p-3">End</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => (
                          <tr key={c.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-medium">{c.code}</td>
                            <td className="p-3">
                              {c.type === "percent"
                                ? `${c.value}%`
                                : money(c.value)}
                            </td>
                            <td className="p-3">{money(c.minOrderValue)}</td>
                            <td className="p-3">
                              {c.usedCount}/{c.maxUsage}
                            </td>
                            <td className="p-3">{c.startAt}</td>
                            <td className="p-3">{c.endAt}</td>
                            <td className="p-3">
                              {isActive(c) ? (
                                <Badge>
                                  <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                                  Active
                                </Badge>
                              ) : isScheduled(c) ? (
                                <Badge variant="secondary">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Scheduled
                                </Badge>
                              ) : (
                                <Badge variant="outline">Expired</Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(c)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => toggleActive(c.id)}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {c.isActive ? "Disable" : "Enable"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Create/Edit Modal */}
      <CouponDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        editing={editing}
      />
    </main>
   </AppLayout>
  );
}

/* ---------------- Modal Component ---------------- */

function CouponDialog({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Coupon) => void;
  editing: Coupon | null;
}) {
  const [form, setForm] = useState<Coupon>(
    editing || {
      id: crypto.randomUUID(),
      code: "",
      type: "percent",
      value: 0,
      minOrderValue: 0,
      maxUsage: 100,
      usedCount: 0,
      startAt: "",
      endAt: "",
      isActive: true,
    }
  );

  const update = (key: keyof Coupon, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Coupon" : "Create Coupon"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Coupon Code</Label>
            <Input
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <Label>Discount Type</Label>
            <select
              className="w-full h-10 border rounded-md px-3"
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>

          <div>
            <Label>Discount Value</Label>
            <Input
              type="number"
              value={form.value}
              onChange={(e) => update("value", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Minimum Order Value</Label>
            <Input
              type="number"
              value={form.minOrderValue}
              onChange={(e) =>
                update("minOrderValue", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Max Usage</Label>
            <Input
              type="number"
              value={form.maxUsage}
              onChange={(e) =>
                update("maxUsage", Number(e.target.value))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startAt}
                onChange={(e) => update("startAt", e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endAt}
                onChange={(e) => update("endAt", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
            />
            <Label>Active</Label>
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