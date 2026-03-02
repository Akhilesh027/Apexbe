// src/pages/admin/SupportAdmin.tsx
// ✅ Admin Support / Tickets (NO AppLayout)
// ✅ Tabs: Open / In Progress / Resolved / Closed
// ✅ Search + filters + priority + assignment
// ✅ Desktop table + Mobile cards
// ✅ Ticket details dialog with reply thread UI (demo)
// NOTE: Connect API later.

"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Search,
  Filter,
  Plus,
  User,
  Clock,
  AlertTriangle,
  BadgeCheck,
  XCircle,
  MoreVertical,
  Send,
  Paperclip,
  Store,
  Users,
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type TicketFrom = "Vendor" | "Customer";

type TicketMessage = {
  id: string;
  from: "User" | "Admin";
  text: string;
  at: string;
};

type TicketRow = {
  id: string;
  subject: string;
  category: "Orders" | "Payments" | "Products" | "Shipping" | "Account" | "Other";
  status: TicketStatus;
  priority: Priority;
  fromType: TicketFrom;

  // who raised
  name: string;
  email?: string;
  vendorName?: string;

  orderId?: string;

  assignedTo: "Unassigned" | "Support Team" | "Admin";
  createdAt: string;
  lastUpdate: string;

  slaDue: string; // for SLA badge
  messages: TicketMessage[];
};

const STATUS_TABS: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES: (Priority | "All")[] = ["All", "Low", "Medium", "High", "Urgent"];
const CATEGORIES: ("All" | TicketRow["category"])[] = [
  "All",
  "Orders",
  "Payments",
  "Products",
  "Shipping",
  "Account",
  "Other",
];
const ASSIGNEES: TicketRow["assignedTo"][] = ["Unassigned", "Support Team", "Admin"];

const badgePriority = (p: Priority) => {
  if (p === "Urgent") return <Badge variant="destructive">Urgent</Badge>;
  if (p === "High") return <Badge variant="secondary" className="border border-destructive/30">High</Badge>;
  if (p === "Medium") return <Badge variant="secondary">Medium</Badge>;
  return <Badge variant="outline">Low</Badge>;
};

const badgeStatus = (s: TicketStatus) => {
  if (s === "Open")
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3.5 w-3.5" /> Open
      </Badge>
    );
  if (s === "In Progress")
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3.5 w-3.5" /> In Progress
      </Badge>
    );
  if (s === "Resolved")
    return (
      <Badge className="gap-1">
        <BadgeCheck className="h-3.5 w-3.5" /> Resolved
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <XCircle className="h-3.5 w-3.5" /> Closed
    </Badge>
  );
};

function isSlaBreached(slaDue: string) {
  // demo: if date string contains "Feb 20" etc. We'll do real date compare later.
  // For now: mark breached when "Overdue" text used.
  return slaDue.toLowerCase().includes("overdue");
}

const mockTickets: TicketRow[] = [
  {
    id: "TCK-10021",
    subject: "Refund not received",
    category: "Payments",
    status: "Open",
    priority: "High",
    fromType: "Customer",
    name: "Akhil Reddy",
    email: "akhil@example.com",
    orderId: "APX-ORD-10232",
    assignedTo: "Unassigned",
    createdAt: "Feb 27, 2026 10:20 AM",
    lastUpdate: "Feb 27, 2026 11:10 AM",
    slaDue: "Overdue by 2h",
    messages: [
      { id: "m1", from: "User", text: "I returned the order but refund not received.", at: "Feb 27, 10:20 AM" },
      { id: "m2", from: "User", text: "Please help ASAP.", at: "Feb 27, 10:22 AM" },
    ],
  },
  {
    id: "TCK-10018",
    subject: "Pickup not scheduled",
    category: "Shipping",
    status: "In Progress",
    priority: "Medium",
    fromType: "Vendor",
    name: "Ravi",
    vendorName: "FreshKart",
    email: "vendor@freshkart.com",
    orderId: "APX-ORD-10231",
    assignedTo: "Support Team",
    createdAt: "Feb 26, 2026 04:12 PM",
    lastUpdate: "Feb 27, 2026 09:35 AM",
    slaDue: "Due in 6h",
    messages: [
      { id: "m1", from: "User", text: "Pickup is not scheduled for 2 orders.", at: "Feb 26, 04:12 PM" },
      { id: "m2", from: "Admin", text: "We are checking with courier partner.", at: "Feb 26, 05:05 PM" },
    ],
  },
  {
    id: "TCK-09998",
    subject: "Product images not uploading",
    category: "Products",
    status: "Resolved",
    priority: "Low",
    fromType: "Vendor",
    name: "Guru",
    vendorName: "ApexBee Fruits",
    assignedTo: "Admin",
    createdAt: "Feb 21, 2026 01:15 PM",
    lastUpdate: "Feb 21, 2026 03:40 PM",
    slaDue: "Resolved",
    messages: [
      { id: "m1", from: "User", text: "Images keep failing on product upload.", at: "Feb 21, 01:15 PM" },
      { id: "m2", from: "Admin", text: "Please try again; issue fixed in Cloudinary config.", at: "Feb 21, 03:20 PM" },
      { id: "m3", from: "User", text: "Now working, thanks.", at: "Feb 21, 03:40 PM" },
    ],
  },
  {
    id: "TCK-09980",
    subject: "Account verification pending",
    category: "Account",
    status: "Closed",
    priority: "Low",
    fromType: "Vendor",
    name: "Priya",
    vendorName: "Devotional Store",
    assignedTo: "Support Team",
    createdAt: "Feb 18, 2026 11:05 AM",
    lastUpdate: "Feb 18, 2026 01:20 PM",
    slaDue: "Closed",
    messages: [
      { id: "m1", from: "User", text: "KYC pending for long time.", at: "Feb 18, 11:05 AM" },
      { id: "m2", from: "Admin", text: "KYC approved. Please re-login.", at: "Feb 18, 01:20 PM" },
    ],
  },
];

export default function SupportAdmin() {
  const [tab, setTab] = useState<TicketStatus>("Open");
  const [q, setQ] = useState("");

  // filters
  const [priority, setPriority] = useState<(Priority | "All")>("All");
  const [category, setCategory] = useState<("All" | TicketRow["category"])>("All");
  const [assignee, setAssignee] = useState<TicketRow["assignedTo"]>("Unassigned");
  const [slaOnly, setSlaOnly] = useState(false);

  // details dialog
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TicketRow | null>(null);

  // reply
  const [reply, setReply] = useState("");

  const tickets = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockTickets
      .filter((t) => t.status === tab)
      .filter((t) => (priority === "All" ? true : t.priority === priority))
      .filter((t) => (category === "All" ? true : t.category === category))
      .filter((t) => (assignee === "Unassigned" ? true : t.assignedTo === assignee))
      .filter((t) => (slaOnly ? isSlaBreached(t.slaDue) : true))
      .filter((t) => {
        if (!query) return true;
        const hay = [
          t.id,
          t.subject,
          t.category,
          t.name,
          t.vendorName || "",
          t.orderId || "",
          t.email || "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [tab, q, priority, category, assignee, slaOnly]);

  const summary = useMemo(() => {
    const openCount = mockTickets.filter((t) => t.status === "Open").length;
    const inProg = mockTickets.filter((t) => t.status === "In Progress").length;
    const resolved = mockTickets.filter((t) => t.status === "Resolved").length;
    const breached = mockTickets.filter((t) => isSlaBreached(t.slaDue)).length;
    return { openCount, inProg, resolved, breached };
  }, []);

  const openDetails = (t: TicketRow) => {
    setActive(t);
    setReply("");
    setOpen(true);
  };

  // UI-only actions (connect API later)
  const assignTo = (to: TicketRow["assignedTo"]) => {
    // In real code: call API, then refresh list.
    // Demo: just update local active view.
    if (!active) return;
    setActive({ ...active, assignedTo: to });
  };

  const updateStatus = (s: TicketStatus) => {
    if (!active) return;
    setActive({ ...active, status: s, lastUpdate: "Just now" });
  };

  const sendReply = () => {
    if (!active) return;
    const text = reply.trim();
    if (!text) return;

    const nextMsg: TicketMessage = {
      id: crypto.randomUUID(),
      from: "Admin",
      text,
      at: "Just now",
    };

    setActive({ ...active, messages: [...active.messages, nextMsg], lastUpdate: "Just now" });
    setReply("");
  };

  return (
    <main className="mx-auto w-[min(1200px,calc(100%-48px))] py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Support (Admin)</h1>
        <p className="text-muted-foreground">
          Manage vendor & customer tickets, assign support, and respond quickly.
        </p>
      </div>

      {/* Top actions */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Ticket (Admin)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshIcon />
            Refresh
          </Button>
        </div>

        <div className="relative w-full lg:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search ticket / subject / order / user"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat title="Open" value={String(summary.openCount)} icon={<AlertTriangle className="h-5 w-5" />} />
        <Stat title="In Progress" value={String(summary.inProg)} icon={<Clock className="h-5 w-5" />} />
        <Stat title="Resolved" value={String(summary.resolved)} icon={<BadgeCheck className="h-5 w-5" />} />
        <Stat title="SLA Breach" value={String(summary.breached)} icon={<XCircle className="h-5 w-5" />} />
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
              <Label>Priority</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as any)}
              >
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={slaOnly}
                  onChange={(e) => setSlaOnly(e.target.checked)}
                />
                Show SLA breach only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + List */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TicketStatus)}>
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
                    <MessageCircle className="h-4 w-4" />
                    {s} Tickets
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  {tickets.length === 0 ? (
                    <EmptyState tab={tab} />
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden lg:block w-full overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="p-3 min-w-[120px]">Ticket</th>
                              <th className="p-3 min-w-[260px]">Subject</th>
                              <th className="p-3 min-w-[140px]">From</th>
                              <th className="p-3 min-w-[140px]">Priority</th>
                              <th className="p-3 min-w-[140px]">Assignee</th>
                              <th className="p-3 min-w-[160px]">SLA</th>
                              <th className="p-3 min-w-[170px]">Last Update</th>
                              <th className="p-3 min-w-[120px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tickets.map((t) => (
                              <tr key={t.id} className="border-t hover:bg-muted/30">
                                <td className="p-3 font-medium">{t.id}</td>

                                <td className="p-3">
                                  <div className="font-medium">{t.subject}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {t.category}
                                    {t.orderId ? ` • ${t.orderId}` : ""}
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium flex items-center gap-1">
                                      {t.fromType === "Vendor" ? (
                                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : (
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                      )}
                                      {t.fromType}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {t.vendorName ? `${t.vendorName} • ` : ""}
                                      {t.name}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3">{badgePriority(t.priority)}</td>
                                <td className="p-3">
                                  <Badge variant={t.assignedTo === "Unassigned" ? "outline" : "secondary"}>
                                    {t.assignedTo}
                                  </Badge>
                                </td>

                                <td className="p-3">
                                  <Badge
                                    variant={isSlaBreached(t.slaDue) ? "destructive" : "secondary"}
                                    className="gap-1"
                                  >
                                    <Clock className="h-3.5 w-3.5" /> {t.slaDue}
                                  </Badge>
                                </td>

                                <td className="p-3">{t.lastUpdate}</td>

                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openDetails(t)}>
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
                                        <DropdownMenuItem onClick={() => openDetails(t)}>
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          Open Ticket
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDetails(t)}>
                                          <User className="mr-2 h-4 w-4" />
                                          Assign / Update
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
                        {tickets.map((t) => (
                          <Card key={t.id}>
                            <CardContent className="p-4 space-y-2 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-semibold">{t.id}</div>
                                  <div className="text-xs text-muted-foreground">{t.subject}</div>
                                </div>
                                {badgeStatus(t.status)}
                              </div>

                              <div className="text-muted-foreground">
                                {t.fromType === "Vendor" ? `${t.vendorName} • ` : ""}
                                {t.name}
                              </div>

                              <div className="flex items-center justify-between">
                                {badgePriority(t.priority)}
                                <Badge
                                  variant={isSlaBreached(t.slaDue) ? "destructive" : "secondary"}
                                  className="gap-1"
                                >
                                  <Clock className="h-3.5 w-3.5" /> {t.slaDue}
                                </Badge>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button className="flex-1" variant="outline" onClick={() => openDetails(t)}>
                                  View
                                </Button>
                                <Button className="flex-1" variant="secondary">
                                  Action
                                </Button>
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
          ))}
        </Tabs>
      </div>

      {/* Ticket details dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Assign, update status, and reply to the user/vendor.</DialogDescription>
          </DialogHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">No ticket selected.</div>
          ) : (
            <div className="space-y-4">
              {/* Top info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {active.subject}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <Info label="Ticket ID" value={active.id} />
                    <Info label="Category" value={active.category} />
                    <Info label="Order ID" value={active.orderId || "—"} />
                    <Info
                      label="From"
                      value={`${active.fromType}${active.vendorName ? ` (${active.vendorName})` : ""}`}
                    />
                    <Info label="Name" value={active.name} />
                    <Info label="Email" value={active.email || "—"} />
                    <Info label="Priority" valueNode={badgePriority(active.priority)} />
                    <Info label="Status" valueNode={badgeStatus(active.status)} />
                    <Info
                      label="SLA"
                      valueNode={
                        <Badge
                          variant={isSlaBreached(active.slaDue) ? "destructive" : "secondary"}
                          className="gap-1"
                        >
                          <Clock className="h-3.5 w-3.5" /> {active.slaDue}
                        </Badge>
                      }
                    />
                  </div>

                  <Separator className="my-4" />

                  {/* Assign + status actions */}
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-sm">Assign to</Label>
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={active.assignedTo}
                        onChange={(e) => assignTo(e.target.value as any)}
                      >
                        {ASSIGNEES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <Badge variant={active.assignedTo === "Unassigned" ? "outline" : "secondary"}>
                        {active.assignedTo}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => updateStatus("In Progress")}>
                        Mark In Progress
                      </Button>
                      <Button onClick={() => updateStatus("Resolved")}>Resolve</Button>
                      <Button variant="outline" onClick={() => updateStatus("Closed")}>
                        Close
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat thread */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Conversation</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 max-h-[320px] overflow-auto pr-2">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.from === "Admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                            m.from === "Admin" ? "bg-muted/30" : "bg-background"
                          }`}
                        >
                          <div className="text-xs text-muted-foreground flex items-center justify-between gap-4 mb-1">
                            <span className="font-medium">{m.from}</span>
                            <span>{m.at}</span>
                          </div>
                          <div>{m.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Reply box */}
                  <div className="space-y-2">
                    <Label>Reply</Label>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your response..."
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" className="gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attach
                      </Button>
                      <Button className="gap-2" onClick={sendReply}>
                        <Send className="h-4 w-4" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/** ---------------- Components ---------------- */

function Stat({
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

function EmptyState({ tab }: { tab: TicketStatus }) {
  const title = `No ${tab} tickets`;
  const desc = "Try adjusting filters or search by ticket id, order id, vendor, or user.";

  return (
    <div className="rounded-lg border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function RefreshIcon() {
  return <CalendarDays className="h-4 w-4" />;
}