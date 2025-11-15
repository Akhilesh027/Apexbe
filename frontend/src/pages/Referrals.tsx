import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Gift, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Referrals = () => {
  const { toast } = useToast();
  const referralCode = "SHOP2025XYZ";
  const referralLink = `https://example.com/ref/${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const stats = [
    { label: "Total Referrals", value: "24", icon: Users },
    { label: "Earnings", value: "Rs. 2,400", icon: Gift },
    { label: "Pending", value: "3", icon: Users },
  ];

  const referralHistory = [
    { name: "John Doe", date: "Jan 15, 2025", reward: 100, status: "Credited" },
    { name: "Jane Smith", date: "Jan 18, 2025", reward: 100, status: "Credited" },
    { name: "Mike Johnson", date: "Jan 20, 2025", reward: 100, status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8">Refer & Earn</h1>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-navy to-accent rounded-3xl p-8 mb-8 text-white">
          <div className="text-center">
            <Gift className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Earn Rs. 100 per Referral</h2>
            <p className="text-lg mb-6">Invite friends and earn rewards when they make their first purchase</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <Icon className="h-8 w-8 mx-auto mb-3 text-accent" />
                <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-bold text-navy mb-4">Your Referral Code</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-blue-light rounded-lg p-4 font-mono text-xl font-bold text-navy text-center">
              {referralCode}
            </div>
            <Button onClick={() => copyToClipboard(referralCode)} className="bg-navy hover:bg-navy/90">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-blue-light rounded-lg p-4 text-sm text-navy break-all">
              {referralLink}
            </div>
            <Button onClick={() => copyToClipboard(referralLink)} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-bold text-navy mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
              <h4 className="font-semibold text-navy mb-2">Share Your Code</h4>
              <p className="text-sm text-muted-foreground">Send your referral code to friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
              <h4 className="font-semibold text-navy mb-2">Friend Signs Up</h4>
              <p className="text-sm text-muted-foreground">They register and make first purchase</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
              <h4 className="font-semibold text-navy mb-2">You Earn</h4>
              <p className="text-sm text-muted-foreground">Get Rs. 100 in your wallet</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-navy mb-4">Referral History</h3>
          <div className="space-y-4">
            {referralHistory.map((ref, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-4">
                <div>
                  <h4 className="font-semibold text-navy">{ref.name}</h4>
                  <p className="text-sm text-muted-foreground">{ref.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">Rs. {ref.reward}</p>
                  <p className={`text-sm ${ref.status === 'Credited' ? 'text-green-600' : 'text-orange'}`}>
                    {ref.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Referrals;
