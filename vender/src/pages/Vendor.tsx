import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const VendorAccount = () => {
  const vendorId = localStorage.getItem("vendorId");

  const [vendor, setVendor] = useState(null);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await axios.get(`https://api.apexbee.in/api/vendor/${vendorId}`);
        setVendor(res.data.vendor);
      } catch (err) {
        console.error("Error fetching vendor:", err);
      }
    };

    if (vendorId) fetchVendor();
  }, [vendorId]);

  if (!vendor) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      </AppLayout>
    );
  }

  const { address } = vendor;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 pb-12">
          {/* Vendor Details Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Vendor Details</h2>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <h3 className="text-lg font-semibold mb-6 text-primary">General Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <div>
                  <Label htmlFor="name" className="font-semibold text-sm">Name</Label>
                  <Input id="name" value={vendor.name} readOnly className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="cell" className="font-semibold text-sm">Cell Number</Label>
                  <Input id="cell" value={vendor.cell} readOnly className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="email" className="font-semibold text-sm">Email</Label>
                  <Input id="email" value={vendor.email} readOnly className="mt-2" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">Status</Label>
                  <div className={`mt-2 border-2 rounded-lg px-4 py-2.5 font-semibold text-center ${
                    vendor.status === "APPROVED"
                      ? "bg-green-100 border-green-400 text-green-600"
                      : "bg-yellow-100 border-yellow-400 text-yellow-600"
                  }`}>
                    {vendor.status}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <h3 className="text-lg font-semibold mb-4 text-primary">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div>
                  <Label className="font-semibold text-sm">Street</Label>
                  <Input value={address?.street || ""} readOnly className="mt-2" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">City</Label>
                  <Input value={address?.city || ""} readOnly className="mt-2" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">State</Label>
                  <Input value={address?.state || ""} readOnly className="mt-2" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">ZIP</Label>
                  <Input value={address?.zip || ""} readOnly className="mt-2" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">Country</Label>
                  <Input value={address?.country || ""} readOnly className="mt-2" />
                </div>
              </div>

              {/* Referral Code Section */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-xl border border-primary/20">
                <p className="text-center text-foreground font-semibold mb-4">
                  Referral code for subscription discount
                </p>
                <div className="flex gap-3 max-w-md mx-auto">
                  <Input
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="mb-10">
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Valid until
                    </p>
                    <p className="text-xl font-bold text-foreground mb-4">
                      {vendor.subscriptionPlan?.validUntil
                        ? new Date(vendor.subscriptionPlan.validUntil).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <Button size="lg" variant="accent">
                      Renew Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-foreground">Billing History</h3>
            <div className="border border-border rounded-xl overflow-hidden shadow-soft bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Plan</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Invoice No</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Payment Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Amount</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm text-foreground">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No billing history available
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
