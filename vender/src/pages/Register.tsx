import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cell: "",
    password: "",
    confirmPassword: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("https://api.apexbee.in/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Vendor Account</CardTitle>
          <CardDescription>Enter your details to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cell">Cell Number</Label>
              <Input
                id="cell"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.cell}
                onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Address Fields */}
            <div className="space-y-2">
              <Label className="font-semibold">Street</Label>
              <Input
                placeholder="123 Main St"
                value={formData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">City</Label>
                <Input
                  placeholder="City"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">State</Label>
                <Input
                  placeholder="State"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">ZIP / Postal Code</Label>
                <Input
                  placeholder="ZIP"
                  value={formData.address.zip}
                  onChange={(e) => handleAddressChange("zip", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Country</Label>
                <Input
                  placeholder="Country"
                  value={formData.address.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full">Register</Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
