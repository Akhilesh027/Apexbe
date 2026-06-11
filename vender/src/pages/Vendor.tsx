import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Crown,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Gift,
  CreditCard,
  CalendarDays,
  FileText,
  ShieldCheck,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

interface Vendor {
  name: string;
  cell: string;
  email: string;
  status: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  subscriptionPlan?: {
    name?: string;
    description?: string;
    validUntil?: string;
    price?: number;
    status?: string;
  };
}

const VendorAccount = () => {
  const vendorId = localStorage.getItem("vendorId");

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [error, setError] = useState("");

  const fetchVendor = async () => {
    if (!vendorId) {
      setError("Vendor ID not found. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`https://api.apexbee.in/api/vendor/${vendorId}`);
      setVendor(res.data.vendor);
    } catch (err) {
      console.error("Error fetching vendor:", err);
      setError("Unable to load vendor account details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter referral code");
      return;
    }

    setApplyingReferral(true);

    try {
      await axios.post("https://api.apexbee.in/api/vendor/apply-referral", {
        vendorId,
        referralCode,
      });

      toast.success("Referral code applied successfully");
      setReferralCode("");
      fetchVendor();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid referral code");
    } finally {
      setApplyingReferral(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading vendor account...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !vendor) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="p-8">
              <p className="text-red-500 font-medium mb-4">
                {error || "Vendor details not found."}
              </p>
              <Button onClick={fetchVendor}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const { address } = vendor;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 pb-12 space-y-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Vendor Account</h2>
            <p className="text-muted-foreground mt-2">
              Manage your vendor profile, subscription plan, referral discount and billing details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor Name</p>
                  <p className="font-semibold">{vendor.name || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-semibold">{vendor.cell || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold truncate max-w-[180px]">
                    {vendor.email || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      vendor.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {vendor.status || "PENDING"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <Label>Name</Label>
                  <Input value={vendor.name || ""} readOnly className="mt-2" />
                </div>

                <div>
                  <Label>Cell Number</Label>
                  <Input value={vendor.cell || ""} readOnly className="mt-2" />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={vendor.email || ""} readOnly className="mt-2" />
                </div>

                <div>
                  <Label>Status</Label>
                  <div
                    className={`mt-2 border rounded-lg px-4 py-2.5 font-semibold text-center ${
                      vendor.status === "APPROVED"
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-yellow-100 border-yellow-300 text-yellow-700"
                    }`}
                  >
                    {vendor.status || "PENDING"}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">Address Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label>Street</Label>
                    <Input value={address?.street || ""} readOnly className="mt-2" />
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input value={address?.city || ""} readOnly className="mt-2" />
                  </div>

                  <div>
                    <Label>State</Label>
                    <Input value={address?.state || ""} readOnly className="mt-2" />
                  </div>

                  <div>
                    <Label>ZIP</Label>
                    <Input value={address?.zip || ""} readOnly className="mt-2" />
                  </div>

                  <div>
                    <Label>Country</Label>
                    <Input value={address?.country || ""} readOnly className="mt-2" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-xl border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-primary" />
                  <p className="text-center text-foreground font-semibold">
                    Referral Code for Subscription Discount
                  </p>
                </div>

                <p className="text-center text-sm text-muted-foreground mb-4">
                  Apply a valid referral code to get discount benefits on your subscription renewal.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />

                  <Button onClick={handleApplyReferral} disabled={applyingReferral}>
                    {applyingReferral ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-2xl font-bold mb-6 text-foreground">Subscription Plan</h3>

            <Card className="border-2 border-primary/30 shadow-elegant bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Crown className="w-10 h-10 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-2xl font-bold text-foreground">
                        {vendor.subscriptionPlan?.name || "Free Plan"}
                      </h4>

                      <p className="text-muted-foreground text-sm mt-1">
                        {vendor.subscriptionPlan?.description || "Basic vendor access"}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          <CreditCard className="w-3.5 h-3.5" />
                          {formatCurrency(vendor.subscriptionPlan?.price)}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Valid until {formatDate(vendor.subscriptionPlan?.validUntil)}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {vendor.subscriptionPlan?.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground mb-1">Plan Validity</p>

                    <p className="text-xl font-bold text-foreground mb-4">
                      {formatDate(vendor.subscriptionPlan?.validUntil)}
                    </p>

                    <Button size="lg" variant="accent">
                      Renew Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan Benefits</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-xl border p-5 bg-card">
                <h4 className="font-semibold mb-2">Vendor Dashboard Access</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your products, orders, account details and earnings from one place.
                </p>
              </div>

              <div className="rounded-xl border p-5 bg-card">
                <h4 className="font-semibold mb-2">Order & Payment Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  View your order activity, billing records and subscription status easily.
                </p>
              </div>

              <div className="rounded-xl border p-5 bg-card">
                <h4 className="font-semibold mb-2">Referral Discount Support</h4>
                <p className="text-sm text-muted-foreground">
                  Apply referral codes to receive available discounts on eligible plans.
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-2xl font-bold mb-6 text-foreground">Billing History</h3>

            <div className="border border-border rounded-xl overflow-hidden shadow-soft bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Invoice No
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Payment Status
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">
                        Receipt
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-muted p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>

                          <p className="font-semibold text-foreground">
                            No billing history available
                          </p>

                          <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Your subscription payments, invoice details and downloadable receipts
                            will appear here after successful billing.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VendorAccount;