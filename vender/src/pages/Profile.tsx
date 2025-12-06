import { Package, Lock, Gift, MapPin, Briefcase, CreditCard, LogOut, IndianRupee } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);

  const [totalSales, setTotalSales] = useState(0);           // Sales amount
  const [referralEarnings, setReferralEarnings] = useState(0); // Referral amount

useEffect(() => {
  const storedVendor = localStorage.getItem("vendor");
  if (storedVendor) {
    const parsedVendor = JSON.parse(storedVendor);
    setVendor(parsedVendor);

    const vendorId = parsedVendor._id || parsedVendor.id;

    // Fetch dashboard earnings
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`https://api.apexbee.in/api/dashboard/${vendorId}`);
        const data = await res.json();

        setTotalSales(data.totalSales || 0);
        setReferralEarnings(data.referralEarnings || 0);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchDashboardData();
  }
}, []);

  const handleLogout = () => {
    localStorage.removeItem("vendor");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("businessLogo");
    localStorage.removeItem("businessName");
    navigate("/login");
  };

  const accountOptions = [
    { icon: Package, title: "Your Orders", description: "Track, return, or buy things again", link: "/orders" },
    { icon: Lock, title: "Login & Security", description: "Edit login, name, and mobile number", link: "/profile/edit" },
    { icon: Gift, title: "Referrals", description: "View benefits & payment settings", link: "/referrals" },
    { icon: MapPin, title: "Your Addresses", description: "Edit addresses for orders and gifts", link: "#" },
    { icon: Briefcase, title: "Your Business Account", description: "GST invoice & bulk discounts", link: "#" },
    { icon: CreditCard, title: "Payment options", description: "Manage your payment methods", link: "#" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Your Account</h1>

        {/* USER CARD */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-muted text-2xl">
                  {vendor?.name
                    ? vendor.name.charAt(0).toUpperCase()
                    : user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-xl font-bold">
                  {vendor?.name || user?.name || "User Name"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {vendor?.email || user?.email || ""}
                </p>

                <p className="text-sm">{vendor?.phoneNumber || user?.phone || ""}</p>

                <Button variant="link" className="p-0 h-auto text-sm">Try Premium</Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="bg-accent text-accent-foreground">
                Refer your friends & earn ₹50 per referral
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-center" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <Card className="p-5 shadow-sm border border-accent">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-accent" />
                Total Product Sales
              </h3>
              <p className="text-2xl font-bold text-accent">₹{totalSales}</p>
            </Card>

            <Card className="p-5 shadow-sm border border-green-600">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Referral Earnings
              </h3>
              <p className="text-2xl font-bold text-green-600">₹{referralEarnings}</p>
            </Card>
          </div>
        </Card>

        {/* OPTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {accountOptions.map((option, index) => (
            <Link key={index} to={option.link}>
              <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                <div className="flex items-start gap-4">
                  <option.icon className="h-8 w-8 text-accent flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
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
