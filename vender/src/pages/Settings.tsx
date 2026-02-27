// components/vendor/settings/SettingsPage.tsx
// ✅ Layout-friendly (NO Navbar/Footer)
// ✅ Sections: Business Info, Bank Details, GST Details, Security, Notifications
// ✅ Ready to connect with backend API later

"use client";

import { useState } from "react";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Landmark,
  CreditCard,
  Shield,
  Bell,
  Save,
  Upload,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";

export default function SettingsPage() {
  const [form, setForm] = useState({
    businessName: "ApexBee Fruits",
    ownerName: "Akhil Reddy",
    phone: "9XXXXXXXXX",
    email: "vendor@apexbee.in",
    address: "Hitech City, Hyderabad",
    description: "Premium fruit box supplier.",

    accountHolder: "Akhil Reddy",
    accountNumber: "123456789012",
    ifsc: "SBIN0001234",
    bankName: "State Bank of India",
    upiId: "akhil@upi",

    gstin: "36ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    legalName: "ApexBee Private Limited",

    notifications: {
      orders: true,
      returns: true,
      payouts: true,
      promotions: false,
    },
  });

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateNested = (section: string, key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = () => {
    // TODO: connect API PUT /api/vendor/settings
    console.log("Saving settings:", form);
  };

  return (
   <AppLayout>
     <main className="mx-auto w-[min(1100px,calc(100%-48px))] py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your business profile, bank details, GST, and preferences.
        </p>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Business Name</Label>
            <Input
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
            />
          </div>

          <div>
            <Label>Owner Name</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => update("ownerName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <div>
            <Label>Store Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <Button variant="secondary" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Logo
          </Button>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Account Holder Name</Label>
            <Input
              value={form.accountHolder}
              onChange={(e) => update("accountHolder", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account Number</Label>
              <Input
                value={form.accountNumber}
                onChange={(e) => update("accountNumber", e.target.value)}
              />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input
                value={form.ifsc}
                onChange={(e) => update("ifsc", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Bank Name</Label>
            <Input
              value={form.bankName}
              onChange={(e) => update("bankName", e.target.value)}
            />
          </div>

          <div>
            <Label>UPI ID (Optional)</Label>
            <Input
              value={form.upiId}
              onChange={(e) => update("upiId", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* GST Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            GST Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>GSTIN</Label>
            <Input
              value={form.gstin}
              onChange={(e) => update("gstin", e.target.value)}
            />
          </div>

          <div>
            <Label>PAN</Label>
            <Input
              value={form.pan}
              onChange={(e) => update("pan", e.target.value)}
            />
          </div>

          <div>
            <Label>Legal Name</Label>
            <Input
              value={form.legalName}
              onChange={(e) => update("legalName", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Change Password</Label>
            <Input type="password" placeholder="New Password" />
          </div>
          <div>
            <Input type="password" placeholder="Confirm Password" />
          </div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(form.notifications).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border rounded-md p-3"
            >
              <span className="capitalize">{key} Updates</span>
              <Switch
                checked={(form.notifications as any)[key]}
                onCheckedChange={(v) =>
                  updateNested("notifications", key, v)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </main>
   </AppLayout>
  );
}