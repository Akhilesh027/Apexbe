"use client";

import { useState } from "react";
import {
  MessageCircle,
  Plus,
  Search,
  Send,
  BadgeCheck,
  Clock,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

type Message = {
  sender: "vendor" | "admin";
  text: string;
  time: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  createdAt: string;
  messages: Message[];
};

const mockTickets: Ticket[] = [
  {
    id: "TCK-101",
    subject: "Payment not received",
    category: "Payments",
    status: "open",
    createdAt: "Feb 27, 2026",
    messages: [
      { sender: "vendor", text: "My payout not received.", time: "10:00 AM" },
      { sender: "admin", text: "We are checking it.", time: "10:15 AM" },
    ],
  },
  {
    id: "TCK-102",
    subject: "Return issue",
    category: "Returns",
    status: "resolved",
    createdAt: "Feb 20, 2026",
    messages: [
      { sender: "vendor", text: "Customer returned damaged item.", time: "2:00 PM" },
      { sender: "admin", text: "Refund processed.", time: "4:00 PM" },
    ],
  },
];

function statusBadge(status: TicketStatus) {
  if (status === "open") return <Badge variant="outline"><Clock className="h-3 w-3 mr-1"/>Open</Badge>;
  if (status === "in_progress") return <Badge variant="secondary">In Progress</Badge>;
  if (status === "resolved") return <Badge><BadgeCheck className="h-3 w-3 mr-1"/>Resolved</Badge>;
  return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1"/>Closed</Badge>;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!active || !newMessage) return;

    const updated = tickets.map((t) =>
      t.id === active.id
        ? {
            ...t,
            messages: [
              ...t.messages,
              { sender: "vendor", text: newMessage, time: "Now" },
            ],
          }
        : t
    );

    setTickets(updated);
    setNewMessage("");
  };

  const createTicket = (subject: string, category: string, message: string) => {
    const newTicket: Ticket = {
      id: "TCK-" + Math.floor(Math.random() * 1000),
      subject,
      category,
      status: "open",
      createdAt: "Today",
      messages: [{ sender: "vendor", text: message, time: "Now" }],
    };

    setTickets([newTicket, ...tickets]);
    setOpenNew(false);
  };

  return (
   <AppLayout>
     <main className="mx-auto w-[min(1100px,calc(100%-48px))] py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Support</h1>
        <p className="text-muted-foreground">
          Raise tickets and track support conversations.
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Button className="gap-2" onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4" />
          Raise Ticket
        </Button>

        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tickets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            My Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="border rounded-md p-3 flex justify-between items-center cursor-pointer hover:bg-muted/30"
              onClick={() => setActive(t)}
            >
              <div>
                <div className="font-semibold">{t.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {t.id} • {t.category} • {t.createdAt}
                </div>
              </div>
              {statusBadge(t.status)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ticket Chat */}
      {active && (
        <Card>
          <CardHeader>
            <CardTitle>{active.subject}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {active.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-md max-w-[70%] ${
                    m.sender === "vendor"
                      ? "bg-primary text-white ml-auto"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs opacity-70">{m.time}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Ticket Modal */}
      <NewTicketDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={createTicket}
      />
    </main>
   </AppLayout>
  );
}

/* -------- New Ticket Dialog -------- */

function NewTicketDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, category: string, message: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Orders");
  const [message, setMessage] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise New Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <Label>Category</Label>
            <select
              className="w-full h-10 border rounded-md px-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Orders</option>
              <option>Payments</option>
              <option>Returns</option>
              <option>Account</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onCreate(subject, category, message)}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}