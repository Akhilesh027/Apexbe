import { Package, Lock, Gift, MapPin, Briefcase, CreditCard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load user details from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("vendor");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendor");
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
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-xl font-bold">{user?.name || "User Name"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                <Button variant="link" className="p-0 h-auto text-sm">Try Premium</Button>
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

          <div className="text-sm text-muted-foreground mb-6">
            Address: {user?.address || "Not Added"}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm mb-2">My Income</div>
              <div className="text-2xl font-bold border-2 border-accent text-accent inline-block px-4 py-2">
                Rs. 234
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm mb-2">Referral Earnings</div>
              <div className="text-2xl font-bold bg-accent text-accent-foreground inline-block px-4 py-2">
                Rs. 768
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-primary text-primary-foreground">
              <div className="text-3xl font-bold">25%</div>
              <div className="text-sm">On Vendor / Wholesaler Registration Fee</div>
              <div className="bg-accent text-accent-foreground px-2 py-1 text-xs inline-block mt-2">
                Super Vendor
              </div>
              <div className="text-xs mt-1">10% On AB income</div>
            </div>
          </div>
        </Card>

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
