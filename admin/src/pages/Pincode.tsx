import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2, RefreshCcw, MapPin, CheckCircle2, XCircle } from "lucide-react";

// If you already have these in your project, use them.
// Otherwise replace with simple HTML.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type PincodeItem = {
  _id: string;
  pincode: string;
  deliveryCharge: number;
  estimatedDays: number;
  isActive: boolean;
  createdAt?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.apexbee.in";

// adjust to your backend paths
const ADMIN_PINCODES = `${API_BASE}/api/admin/pincodes`;

export default function PincodeManagement() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PincodeItem[]>([]);
  const [q, setQ] = useState("");

  // dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PincodeItem | null>(null);

  const [form, setForm] = useState({
    pincode: "",
    deliveryCharge: 0,
    estimatedDays: 3,
    isActive: true,
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((x) => x.pincode.toLowerCase().includes(query));
  }, [items, q]);

  async function fetchPincodes() {
    try {
      setLoading(true);
      const res = await axios.get(ADMIN_PINCODES);
      setItems(res.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load pincodes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPincodes();
  }, []);

  function resetForm() {
    setForm({
      pincode: "",
      deliveryCharge: 0,
      estimatedDays: 3,
      isActive: true,
    });
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(item: PincodeItem) {
    setEditing(item);
    setForm({
      pincode: item.pincode,
      deliveryCharge: item.deliveryCharge,
      estimatedDays: item.estimatedDays,
      isActive: item.isActive,
    });
    setOpen(true);
  }

  function validateForm() {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return "Pincode must be 6 digits";
    if (Number.isNaN(Number(form.deliveryCharge)) || form.deliveryCharge < 0) return "Delivery charge must be >= 0";
    if (Number.isNaN(Number(form.estimatedDays)) || form.estimatedDays < 0) return "Estimated days must be >= 0";
    return null;
  }

  async function save() {
    const err = validateForm();
    if (err) return toast.error(err);

    try {
      const payload = {
        pincode: form.pincode.trim(),
        deliveryCharge: Number(form.deliveryCharge),
        estimatedDays: Number(form.estimatedDays),
        isActive: Boolean(form.isActive),
      };

      if (editing) {
        await axios.put(`${ADMIN_PINCODES}/${editing._id}`, payload);
        toast.success("Pincode updated");
      } else {
        await axios.post(`${ADMIN_PINCODES}/add`, payload);
        toast.success("Pincode added");
      }

      setOpen(false);
      resetForm();
      fetchPincodes();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  }

  async function remove(item: PincodeItem) {
    const ok = confirm(`Delete pincode ${item.pincode}?`);
    if (!ok) return;

    try {
      await axios.delete(`${ADMIN_PINCODES}/${item._id}`);
      toast.success("Deleted");
      setItems((prev) => prev.filter((x) => x._id !== item._id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  }

  async function quickToggle(item: PincodeItem) {
    try {
      const next = !item.isActive;
      setItems((prev) =>
        prev.map((x) => (x._id === item._id ? { ...x, isActive: next } : x))
      );
      await axios.put(`${ADMIN_PINCODES}/${item._id}`, { isActive: next });
      toast.success(next ? "Enabled" : "Disabled");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
      // revert
      setItems((prev) =>
        prev.map((x) => (x._id === item._id ? { ...x, isActive: item.isActive } : x))
      );
    }
  }

  return (
 
      <div className="space-y-6">
        {/* header controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Pincode Delivery Charges</h1>
              <p className="text-sm text-muted-foreground">Manage deliverable pincodes and charges.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPincodes} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pincode
            </Button>
          </div>
        </div>

        {/* search */}
        <Card className="bg-background/60">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative w-full md:w-96">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search pincode..."
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> / {items.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3">Pincode</th>
                  <th className="p-3">Charge</th>
                  <th className="p-3">ETA (days)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x._id} className="border-t">
                    <td className="p-3 font-medium">{x.pincode}</td>
                    <td className="p-3">₹{x.deliveryCharge}</td>
                    <td className="p-3">{x.estimatedDays}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={x.isActive ? "default" : "secondary"}>
                          {x.isActive ? "Active" : "Disabled"}
                        </Badge>
                        <Switch checked={x.isActive} onCheckedChange={() => quickToggle(x)} />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(x)}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(x)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No pincodes found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* dialog */}
        <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Pincode" : "Add Pincode"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pincode *</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                  placeholder="Ex: 500081"
                  disabled={!!editing} // optional: prevent editing pincode
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">Must be exactly 6 digits.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Delivery Charge (₹) *</Label>
                  <Input
                    type="number"
                    value={form.deliveryCharge}
                    onChange={(e) => setForm((p) => ({ ...p, deliveryCharge: Number(e.target.value) }))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Days</Label>
                  <Input
                    type="number"
                    value={form.estimatedDays}
                    onChange={(e) => setForm((p) => ({ ...p, estimatedDays: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="space-y-1">
                  <div className="font-medium">Delivery Enabled</div>
                  <div className="text-xs text-muted-foreground">
                    Disable if delivery is not available for this pincode.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {form.isActive ? (
                    <span className="text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Active
                    </span>
                  ) : (
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> Disabled
                    </span>
                  )}
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={save}>
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

  );
}