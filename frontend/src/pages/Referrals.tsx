import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Gift, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  walletBalance: number;
}

interface ReferralHistory {
  _id: string;
  referredUser: {
    name: string;
    email: string;
  };
  status: 'pending' | 'completed' | 'credited';
  rewardAmount: number;
  createdAt: string;
}

const Referrals = () => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    walletBalance: 0
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to access referral features",
          variant: "destructive"
        });
        return;
      }

      const [codeRes, statsRes, historyRes] = await Promise.all([
        fetch('https://api.apexbee.in/api/referrals/code', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://api.apexbee.in/api/referrals/stats', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://api.apexbee.in/api/referrals/history?limit=20', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!codeRes.ok || !statsRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch referral data');
      }

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();

      setReferralCode(codeData.referralCode);
      setReferralLink(codeData.referralLink);
      setStats(statsData);
      setReferralHistory(historyData.referrals || []);

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    setCopyLoading(true);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: type === 'code' 
          ? "Referral code copied to clipboard" 
          : "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    } finally {
      setCopyLoading(false);
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on this amazing platform!',
          text: `Use my referral code ${referralCode} to sign up and get benefits!`,
          url: referralLink,
        });
        toast({
          title: "Shared!",
          description: "Referral link shared successfully",
        });
      } catch (error) {
        // User cancelled the share
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy
      copyToClipboard(referralLink, 'link');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'credited':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      case 'pending':
        return 'text-orange-500';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'credited':
        return 'Credited';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const statsCards = [
    { 
      label: "Total Referrals", 
      value: stats.totalReferrals.toString(), 
      icon: Users,
      description: "Total friends invited"
    },
    { 
      label: "Total Earnings", 
      value: `Rs. ${stats.totalEarnings}`, 
      icon: Gift,
      description: "Amount earned from referrals"
    },
    { 
      label: "Pending Rewards", 
      value: stats.pendingReferrals.toString(), 
      icon: Users,
      description: "Referrals awaiting purchase"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-lg text-navy">Loading referral data...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8">Refer & Earn</h1>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-navy to-accent rounded-3xl p-8 mb-8 text-white">
          <div className="text-center">
            <Gift className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Earn Rs. 50 per Referral</h2>
            <p className="text-lg mb-6">Invite friends and earn rewards when they make their first purchase</p>
            <div className="bg-white/20 rounded-lg p-4 inline-block">
              <p className="text-xl font-semibold">Wallet Balance: Rs. {stats.walletBalance}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <Icon className="h-8 w-8 mx-auto mb-3 text-accent" />
                <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-navy mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-navy mb-4">Your Referral Code & Link</h3>
          
          {/* Referral Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy mb-2">Referral Code</label>
            <div className="flex gap-3">
              <div className="flex-1 bg-blue-50 rounded-lg p-4 font-mono text-xl font-bold text-navy text-center border border-blue-200">
                {referralCode || "Loading..."}
              </div>
              <Button 
                onClick={() => copyToClipboard(referralCode, 'code')} 
                className="bg-navy hover:bg-navy/90 min-w-[100px]"
                disabled={!referralCode || copyLoading}
              >
                {copyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Referral Link */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Referral Link</label>
            <div className="flex gap-3">
              <div className="flex-1 bg-blue-50 rounded-lg p-3 text-sm text-navy break-all border border-blue-200 font-medium">
                {referralLink || "Loading..."}
              </div>
              <Button 
                onClick={shareReferral}
                variant="outline" 
                className="border-accent text-accent hover:bg-accent hover:text-white min-w-[100px]"
                disabled={!referralLink || copyLoading}
              >
                {copyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-navy mb-6">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                1
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">Share Your Code</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Copy your unique referral code or link and share it with friends via message, email, or social media
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                2
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">Friend Signs Up</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your friend registers using your referral code and makes their first purchase on the platform
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                3
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">You Earn Rewards</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive Rs. 50 directly in your wallet immediately after your friend completes their purchase
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-navy">Referral History</h3>
            <Button 
              onClick={fetchReferralData} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          
          {referralHistory.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-semibold text-navy mb-2">No referrals yet</h4>
              <p className="text-muted-foreground mb-4">Start sharing your referral code to earn rewards!</p>
              <Button 
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="bg-accent hover:bg-accent/90"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Your Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {referralHistory.map((ref) => (
                <div key={ref._id} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <h4 className="font-semibold text-navy">{ref.referredUser?.name || 'Unknown User'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {ref.referredUser?.email || 'No email'} • {new Date(ref.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy text-lg">Rs. {ref.rewardAmount}</p>
                    <p className={`text-sm font-medium ${getStatusColor(ref.status)}`}>
                      {getStatusText(ref.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-navy mb-2">💡 Tips for Successful Referrals</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share your referral link on social media platforms</li>
            <li>• Send personalized messages to friends who might be interested</li>
            <li>• Explain the benefits they'll get by signing up</li>
            <li>• Follow up with friends who haven't completed their purchase yet</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Referrals;