import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Ticket,
  Percent,
  IndianRupee,
  X,
} from "lucide-react";

const API_BASE = "https://api.apexbee.in/api";

type CouponType = "flat" | "percent";
type PaymentMethod = "upi" | "wallet";

type Coupon = {
  _id?: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrder?: number;
  firstOrderOnly: boolean;
  allowedPayments: PaymentMethod[];
  expiresAt?: string;
  isActive: boolean;
};

const emptyCoupon: Coupon = {
  code: "",
  title: "",
  description: "",
  type: "flat",
  value: 0,
  maxDiscount: 0,
  minOrder: 0,
  firstOrderOnly: false,
  allowedPayments: ["upi", "wallet"],
  expiresAt: "",
  isActive: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<Coupon>(emptyCoupon);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/admin/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to load coupons");
        return;
      }

      setCoupons(data.coupons || []);
    } catch (error) {
      console.error(error);
      alert("Unable to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setForm(emptyCoupon);
    setEditingId(null);
  };

  const handlePaymentToggle = (method: PaymentMethod) => {
    setForm((prev) => {
      const exists = prev.allowedPayments.includes(method);

      return {
        ...prev,
        allowedPayments: exists
          ? prev.allowedPayments.filter((m) => m !== method)
          : [...prev.allowedPayments, method],
      };
    });
  };

  const validateForm = () => {
    if (!form.code.trim()) return "Coupon code is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.type) return "Coupon type is required";
    if (!form.value || form.value <= 0) return "Coupon value must be greater than 0";
    if (form.type === "percent" && form.value > 100) return "Percent cannot be more than 100";
    if (!form.allowedPayments.length) return "Select at least one payment method";

    return "";
  };

  const handleSubmit = async () => {
    const error = validateForm();

    if (error) {
      alert(error);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        maxDiscount: Number(form.maxDiscount || 0),
        minOrder: Number(form.minOrder || 0),
        expiresAt: form.expiresAt || null,
      };

      const url = editingId
        ? `${API_BASE}/admin/coupons/${editingId}`
        : `${API_BASE}/admin/coupons`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save coupon");
        return;
      }

      alert(editingId ? "Coupon updated successfully" : "Coupon created successfully");
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error(error);
      alert("Unable to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon._id || null);

    setForm({
      ...coupon,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : "",
      allowedPayments: coupon.allowedPayments?.length
        ? coupon.allowedPayments
        : ["upi", "wallet"],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const ok = confirm("Are you sure you want to delete this coupon?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete coupon");
        return;
      }

      alert("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.error(error);
      alert("Unable to delete coupon");
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    if (!coupon._id) return;

    try {
      const res = await fetch(`${API_BASE}/admin/coupons/${coupon._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...coupon,
          isActive: !coupon.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update status");
        return;
      }

      fetchCoupons();
    } catch (error) {
      console.error(error);
      alert("Unable to update coupon status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="h-8 w-8 text-blue-600" />
              Coupon Management
            </h1>
            <p className="text-slate-500 mt-1">
              Add, edit, activate and manage checkout coupons.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Coupon
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit Coupon" : "Add Coupon"}
              </h2>

              {editingId && (
                <button onClick={resetForm} className="text-slate-400 hover:text-red-500">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Coupon Code *</label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="FIRST100"
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="₹100 off on First Order"
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Valid only for first order. Min order ₹499."
                  className="mt-1 w-full rounded-lg border px-3 py-2 min-h-[80px] outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Discount Type *</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as CouponType })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Discount Value * {form.type === "flat" ? "(₹)" : "(%)"}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {form.type === "percent" && (
                <div>
                  <label className="text-sm font-medium">Max Discount ₹</label>
                  <input
                    type="number"
                    value={form.maxDiscount || ""}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscount: Number(e.target.value) })
                    }
                    placeholder="250"
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Minimum Order ₹</label>
                <input
                  type="number"
                  value={form.minOrder || ""}
                  onChange={(e) =>
                    setForm({ ...form, minOrder: Number(e.target.value) })
                  }
                  placeholder="499"
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt || ""}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed Payments *</label>

                <div className="flex gap-2">
                  {(["upi", "wallet"] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handlePaymentToggle(method)}
                      className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                        form.allowedPayments.includes(method)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">First Order Only</p>
                  <p className="text-xs text-slate-500">
                    Apply only for first-time buyers.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(e) =>
                    setForm({ ...form, firstOrderOnly: e.target.checked })
                  }
                  className="h-5 w-5"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Active Status</p>
                  <p className="text-xs text-slate-500">
                    Enable or disable coupon.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-5 w-5"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-5">
            <h2 className="text-xl font-semibold mb-5">All Coupons</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                No coupons found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Offer</th>
                      <th className="p-3 text-left">Rules</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="border-t hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{coupon.code}</div>
                          <div className="text-xs text-slate-500">{coupon.title}</div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1 font-semibold">
                            {coupon.type === "flat" ? (
                              <IndianRupee className="h-4 w-4" />
                            ) : (
                              <Percent className="h-4 w-4" />
                            )}

                            {coupon.type === "flat"
                              ? `₹${coupon.value} OFF`
                              : `${coupon.value}% OFF`}
                          </div>

                          {coupon.maxDiscount ? (
                            <div className="text-xs text-slate-500">
                              Max ₹{coupon.maxDiscount}
                            </div>
                          ) : null}
                        </td>

                        <td className="p-3">
                          <div className="text-xs space-y-1 text-slate-600">
                            <p>Min Order: ₹{coupon.minOrder || 0}</p>
                            <p>
                              First Order:{" "}
                              {coupon.firstOrderOnly ? "Yes" : "No"}
                            </p>
                            <p>
                              Payments:{" "}
                              {coupon.allowedPayments?.join(", ") || "All"}
                            </p>
                            <p>
                              Expiry:{" "}
                              {coupon.expiresAt
                                ? new Date(coupon.expiresAt).toLocaleDateString()
                                : "No expiry"}
                            </p>
                          </div>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => toggleStatus(coupon)}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              coupon.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(coupon)}
                              className="rounded-lg border px-3 py-2 hover:bg-slate-100"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(coupon._id)}
                              className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;