import { Package, Lock, Gift, MapPin, Briefcase, CreditCard, LogOut } from "lucide-react";
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

  // Load user and vendor data
  useEffect(() => {
    // Dummy user
    const dummyUser = {
      name: "Akhilesh Reddy",
      email: "akhilesh@example.com",
      phone: "+91 9550379505",
    };
    setUser(dummyUser);

    // Load Vendor Details from LocalStorage
    const storedVendor = localStorage.getItem("vendor");
    if (storedVendor) {
      setVendor(JSON.parse(storedVendor));
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
    { icon: Gift, title: "Referrals", description: "View benefits & payment settings", link: "#" },
    { icon: MapPin, title: "Your Addresses", description: "Edit addresses for orders and gifts", link: "#" },
    { icon: Briefcase, title: "Your Business Account", description: "GST invoice & bulk discounts", link: "#" },
    { icon: CreditCard, title: "Payment options", description: "Manage your payment methods", link: "#" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Your Account</h1>

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

                <p className="text-sm">
                  {vendor?.phoneNumber || user?.phone || ""}
                </p>

                <Button variant="link" className="p-0 h-auto text-sm">
                  Try Premium
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="bg-accent text-accent-foreground">
                Refer your friends & earn Rs. 50 per referral
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 justify-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg-grid-cols-3 gap-6 mb-8">
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
