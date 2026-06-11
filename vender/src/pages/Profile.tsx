import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Lock,
  Gift,
  MapPin,
  Briefcase,
  CreditCard,
  LogOut,
  IndianRupee,
  User,
  Mail,
  Phone,
  Loader2,
  Crown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Vendor {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  cell?: string;
  businessName?: string;
  status?: string;
}

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [totalSales, setTotalSales] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const getInitial = () => {
    const name = vendor?.name || user?.name || "User";
    return name.charAt(0).toUpperCase();
  };

  const fetchDashboardData = async (vendorId: string) => {
    setDashboardLoading(true);

    try {
      const res = await fetch(`https://api.apexbee.in/api/dashboard/${vendorId}`);
      const data = await res.json();

      setTotalSales(data.totalSales || 0);
      setReferralEarnings(data.referralEarnings || 0);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    const storedVendor = localStorage.getItem("vendor");
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (storedVendor) {
      try {
        const parsedVendor = JSON.parse(storedVendor);
        setVendor(parsedVendor);

        const vendorId = parsedVendor._id || parsedVendor.id;

        if (vendorId) {
          fetchDashboardData(vendorId);
        }
      } catch (error) {
        console.error("Invalid vendor data:", error);
      }
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendor");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("businessLogo");
    localStorage.removeItem("businessName");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login");
  };

  const accountOptions = [
    {
      icon: Package,
      title: "Your Orders",
      description: "Track orders, returns and repeat purchases",
      link: "/orders",
    },
    {
      icon: Lock,
      title: "Login & Security",
      description: "Edit login details, name and mobile number",
      link: "/profile/edit",
    },
    {
      icon: Gift,
      title: "Referrals",
      description: "View referral benefits and payment settings",
      link: "/referrals",
    },
    {
      icon: MapPin,
      title: "Your Addresses",
      description: "Manage delivery and billing addresses",
      link: "/addresses",
    },
    {
      icon: Briefcase,
      title: "Business Account",
      description: "Manage GST invoice and business benefits",
      link: "/vendor-account",
    },
    {
      icon: CreditCard,
      title: "Payment Options",
      description: "Manage saved payment methods and billing",
      link: "/payments",
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading profile...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Account</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, orders, referrals, payments and business account details.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {getInitial()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-2xl font-bold">
                      {vendor?.name || user?.name || "User Name"}
                    </h2>

                    {vendor?.businessName && (
                      <p className="text-sm font-medium text-primary mt-1">
                        {vendor.businessName}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {vendor?.email || user?.email || "No email"}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {vendor?.phoneNumber || vendor?.cell || user?.phone || "No mobile"}
                      </span>
                    </div>

                    {vendor?.status && (
                      <span
                        className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                          vendor.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                  <Button className="bg-accent text-accent-foreground">
                    <Gift className="h-4 w-4 mr-2" />
                    Refer friends & earn ₹50
                  </Button>

                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-8">
              <Card className="border-accent/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-accent/10 p-3 rounded-xl">
                      <IndianRupee className="h-5 w-5 text-accent" />
                    </div>

                    {dashboardLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">Total Product Sales</p>
                  <p className="text-2xl font-bold text-accent mt-1">
                    {formatCurrency(totalSales)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-500/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>

                    {dashboardLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">Referral Earnings</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(referralEarnings)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="bg-primary/10 p-3 rounded-xl w-fit mb-3">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>

                  <p className="text-sm text-muted-foreground">Premium Benefits</p>
                  <p className="text-lg font-bold mt-1">Upgrade Available</p>

                  <Button variant="link" className="p-0 h-auto mt-2">
                    Try Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Account Settings</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Select an option below to manage your account.
            </p>
          </div>

          {vendor && (
            <Button
              variant="outline"
              onClick={() => {
                const vendorId = vendor._id || vendor.id;
                if (vendorId) fetchDashboardData(vendorId);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {accountOptions.map((option, index) => (
            <Link key={index} to={option.link}>
              <Card className="p-6 hover:shadow-lg transition-all h-full group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-accent/10 p-3 rounded-xl group-hover:bg-accent/20 transition-colors">
                      <option.icon className="h-6 w-6 text-accent flex-shrink-0" />
                    </div>

                    <div>
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;