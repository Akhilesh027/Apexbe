import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Lock, Gift, Home, Briefcase, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Account = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-navy mb-8">Your Account</h1>

        {/* User Info */}
        <div className="bg-secondary rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy">User Name</h2>
                <p className="text-muted-foreground">Address: Rajamundry #312- 50034</p>
              </div>
            </div>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
              Try Premium
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-navy">My income</span>
                <span className="text-accent font-bold">Rs. 234</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-navy">Wallet</span>
                <span className="text-accent font-bold">Rs. 434</span>
              </div>
            </div>

            <div className="bg-navy text-white rounded-lg p-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold mb-1">Rs. 768</span>
                <span className="text-xs">Available Reward</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-navy text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1">25%</p>
                <p className="text-xs">On Vendor / Holesaler Registration Enroll Fee</p>
              </div>
              <div className="bg-accent px-4 py-2 rounded">
                <p className="font-bold">Super Vendor</p>
                <p className="text-xs">10% On All Income</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Banner */}
        <div className="bg-blue-light border-2 border-navy rounded-lg p-4 mb-8 text-center">
          <p className="text-navy font-semibold">
            Refer Your Friends and Earn <span className="text-accent">Rs. 50</span> On each Refer or Download App
          </p>
        </div>

        {/* Account Options Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Package className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Your Orders</h3>
                <p className="text-sm text-muted-foreground">Track, return, or buy things again</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-yellow-banner/20 p-3 rounded-lg">
                <Lock className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Login & Security</h3>
                <p className="text-sm text-muted-foreground">Edit login, name, and mobile number</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-pink-banner p-3 rounded-lg">
                <Gift className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Referrals</h3>
                <p className="text-sm text-muted-foreground">View benefits & payment settings</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Home className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Your Addresses</h3>
                <p className="text-sm text-muted-foreground">Edit addresses for orders and gifts</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-yellow-banner/20 p-3 rounded-lg">
                <Briefcase className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Your Business Account</h3>
                <p className="text-sm text-muted-foreground">Sign up for free to save up to 18% with GST invoice & bulk discounts & App Download</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-blue-light p-3 rounded-lg">
                <CreditCard className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Payment options</h3>
                <p className="text-sm text-muted-foreground">Contact our customer service via phone or chat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Account;
