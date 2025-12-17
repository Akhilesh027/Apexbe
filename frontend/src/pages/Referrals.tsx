import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Gift, Users, Loader2, Wallet, TrendingUp, Percent, Award, Coins, UserPlus, DollarSign, BarChart, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  walletBalance: number;
  // Multi-level tracking
  totalDirectReferrals: number;
  totalIndirectReferrals: number;
  completedDirectReferrals: number;
  completedIndirectReferrals: number;
  pendingDirectReferrals: number;
  pendingIndirectReferrals: number;
  directEarnings: number;
  indirectEarnings: number;
  signupBonusTotal: number;
  purchaseCommissionTotal: number;
  userLevel: number;
  hasParent: boolean;
  // APEX System Fields
  membershipIncentives?: number;
  vendorIncentives?: number;
  franchiserIncentives?: number;
  firstPurchaseIncentives?: number;
  totalLevel3Referrals?: number;
  // Level-specific counts
  level1Count?: number;
  level2Count?: number;
  level3Count?: number;
  // Additional fields from your backend
  parentInfo?: {
    name: string;
    referralCode: string;
    _id?: string;
  };
  recentCommissionsCount?: number;
  pendingCommissionsCount?: number;
  recentDirectReferrals?: Array<{
    name: string;
    email: string;
    joined: string;
  }>;
  // From network endpoint
  networkStats?: {
    totalMembers: number;
    totalEarnings: number;
    levels: {
      level1?: number;
      level2?: number;
      level3?: number;
    };
  };
}

interface ReferralHistory {
  _id: string;
  referredUser: {
    name: string;
    email: string;
    phone?: string;
  };
  status: "pending" | "completed" | "credited";
  rewardAmount: number;
  createdAt: string;
  level?: number;
  levelName?: string;
  type?: string;
  commissionType?: string;
  orderDetails?: {
    orderNumber: string;
    total: number;
    paymentMethod?: string;
  };
  commissionDetails?: {
    amount: number;
    creditedAt?: string;
  };
  completedAt?: string;
}

interface CommissionHistory {
  _id: string;
  amount: number;
  commissionType: "signup" | "purchase" | "recurring";
  level: number;
  source: string;
  percentage?: number;
  createdAt: string;
  orderId?: {
    orderNumber: string;
    totalAmount: number;
    createdAt?: string;
  };
  status?: string;
  notes?: string;
}

interface EarningsSummary {
  summary: {
    timeframe: string;
    totals: {
      direct: number;
      indirect: number;
      signup: number;
      purchase: number;
      total: number;
    };
    breakdown: {
      byLevel: { level1: number; level2: number; level3?: number };
      byType: { signup: number; purchase: number };
    };
  };
  topReferrals: Array<{
    user: { name: string; email: string } | null;
    totalEarned: number;
    referralCount: number;
  }>;
}

interface NetworkData {
  user: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referredBy: any;
    referralLevel: number;
  };
  network: any;
  stats: {
    totalMembers: number;
    totalEarnings: number;
    levels: Record<string, number>;
  };
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
    walletBalance: 0,
    totalDirectReferrals: 0,
    totalIndirectReferrals: 0,
    completedDirectReferrals: 0,
    completedIndirectReferrals: 0,
    pendingDirectReferrals: 0,
    pendingIndirectReferrals: 0,
    directEarnings: 0,
    indirectEarnings: 0,
    signupBonusTotal: 0,
    purchaseCommissionTotal: 0,
    userLevel: 0,
    hasParent: false,
    membershipIncentives: 0,
    vendorIncentives: 0,
    franchiserIncentives: 0,
    firstPurchaseIncentives: 0,
    totalLevel3Referrals: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingSections, setLoadingSections] = useState({
    stats: true,
    history: true,
    commissions: true,
    earnings: false,
    network: false
  });

  // Helper function to calculate APEX values
  const calculateApexValues = (stats: ReferralStats) => {
    // APEX Wallet = Purchase commissions only
    const apexWallet = stats.purchaseCommissionTotal || 0;
    
    // APEX Bonus = All bonuses and incentives
    const apexBonus = (stats.signupBonusTotal || 0) + 
                     (stats.directEarnings || 0) + 
                     (stats.indirectEarnings || 0) +
                     (stats.membershipIncentives || 0) +
                     (stats.vendorIncentives || 0) +
                     (stats.franchiserIncentives || 0) +
                     (stats.firstPurchaseIncentives || 0);
    
    // Total Earnings = APEX Wallet + APEX Bonus
    const totalEarnings = apexWallet + apexBonus;
    
    return { apexWallet, apexBonus, totalEarnings };
  };

  const apexValues = calculateApexValues(stats);

  // Calculate network size: Level 1 + Level 2 + Level 3
  const calculateNetworkSize = () => {
   return (stats.level1Count || 0) + 
         (stats.level2Count || 0) + 
         (stats.level3Count || 0);
    // Fallback to stats if network data not available
    return (stats.level1Count || 0) + (stats.level2Count || 0) + (stats.level3Count || 0);
  };

  // Calculate indirect referrals: Level 2 + Level 3
  const calculateIndirectReferrals = () => {
    return (stats.totalIndirectReferrals || 0) + (stats.totalLevel3Referrals || 0);
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to access referral features",
          variant: "destructive",
        });
        return;
      }

      // Fetch referral code
      const codeRes = await fetch("https://api.apexbee.in/api/referrals/code", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!codeRes.ok) {
        throw new Error("Failed to fetch referral code");
      }

      const codeData = await codeRes.json();
      setReferralCode(codeData.referralCode);
      setReferralLink(codeData.referralLink);

      // Fetch enhanced stats
      setLoadingSections(prev => ({ ...prev, stats: true }));
      const statsRes = await fetch("https://api.apexbee.in/api/referrals/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!statsRes.ok) {
        throw new Error("Failed to fetch referral stats");
      }

      const statsData = await statsRes.json();
      setStats(prev => ({
        ...prev,
        ...statsData,
        completedDirectReferrals: statsData.completedDirectReferrals || 0,
        completedIndirectReferrals: statsData.completedIndirectReferrals || 0,
        pendingDirectReferrals: statsData.pendingDirectReferrals || 0,
        pendingIndirectReferrals: statsData.pendingIndirectReferrals || 0,
        // Map APEX values
        purchaseCommissionTotal: statsData.purchaseCommissionTotal || 0,
        signupBonusTotal: statsData.signupBonusTotal || 0,
        directEarnings: statsData.directEarnings || 0,
        indirectEarnings: statsData.indirectEarnings || 0,
        // Add new fields for incentives with fallbacks
        membershipIncentives: statsData.membershipIncentives || 0,
        vendorIncentives: statsData.vendorIncentives || 0,
        franchiserIncentives: statsData.franchiserIncentives || 0,
        firstPurchaseIncentives: statsData.firstPurchaseIncentives || 0,
        // Level 3 support
        totalLevel3Referrals: statsData.totalLevel3Referrals || 0,
        level1Count: statsData.level1Count || 0,
        level2Count: statsData.level2Count || 0,
        level3Count: statsData.level3Count || 0,
      }));
      setLoadingSections(prev => ({ ...prev, stats: false }));

      // Fetch referral history with enhanced details
      setLoadingSections(prev => ({ ...prev, history: true }));
      const historyRes = await fetch(
        "https://api.apexbee.in/api/referrals/history?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setReferralHistory(historyData.referrals || []);
      }
      setLoadingSections(prev => ({ ...prev, history: false }));

      // Fetch commission history
      setLoadingSections(prev => ({ ...prev, commissions: true }));
      const commissionRes = await fetch(
        "https://api.apexbee.in/api/user/commissions?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (commissionRes.ok) {
        const commissionData = await commissionRes.json();
        setCommissionHistory(commissionData.commissions || []);
      }
      setLoadingSections(prev => ({ ...prev, commissions: false }));

      // Fetch earnings summary for enhanced analytics
      try {
        setLoadingSections(prev => ({ ...prev, earnings: true }));
        const earningsRes = await fetch(
          "https://api.apexbee.in/api/referrals/earnings-summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          setEarningsSummary(earningsData);
        }
      } catch (earningsError) {
        console.log("Earnings summary endpoint not available");
      } finally {
        setLoadingSections(prev => ({ ...prev, earnings: false }));
      }

      // Fetch network data
      try {
        setLoadingSections(prev => ({ ...prev, network: true }));
        const networkRes = await fetch(
          "https://api.apexbee.in/api/referrals/network?depth=2",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (networkRes.ok) {
          const networkData = await networkRes.json();
          setNetworkData(networkData);
        }
      } catch (networkError) {
        console.log("Network endpoint not available");
      } finally {
        setLoadingSections(prev => ({ ...prev, network: false }));
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    setCopyLoading(true);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description:
          type === "code"
            ? "Referral code copied to clipboard"
            : "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    } finally {
      setCopyLoading(false);
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on this amazing platform!",
          text: `Use my referral code ${referralCode} to sign up and get benefits!`,
          url: referralLink,
        });
        toast({
          title: "Shared!",
          description: "Referral link shared successfully",
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard(referralLink, "link");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "credited":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "credited":
        return "Credited";
      case "completed":
        return "Order Completed";
      case "pending":
        return "Awaiting Purchase";
      default:
        return status;
    }
  };

  const getTypeBadge = (type?: string, level?: number) => {
    if (!type && !level) return null;

    const finalType = type || (level === 1 ? "direct" : "indirect");
    
    const config: Record<string, { label: string; className: string }> = {
      "signup-bonus": {
        label: "Signup Bonus",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      },
      "purchase-commission": {
        label: "Purchase Commission",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      "signup": {
        label: "Signup",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      },
      "purchase": {
        label: "Purchase",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      "direct": { 
        label: "Direct", 
        className: "bg-green-100 text-green-800 border-green-200" 
      },
      "indirect": {
        label: "Indirect",
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };

    const configItem = config[finalType] || {
      label: finalType,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge className={`px-2 py-1 ${configItem.className}`}>
        {configItem.label}
      </Badge>
    );
  };

  const getCommissionTypeIcon = (type: string) => {
    switch (type) {
      case "signup":
        return <Award className="h-4 w-4" />;
      case "purchase":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };
const calculatePersonalDirectReferrals = () => {
  // Use stats from the API response
  return stats.totalDirectReferrals || 0;
};

const calculatePersonalIndirectReferrals = () => {
  // Level 2 referrals
  return stats.totalIndirectReferrals || 0;
};

const calculatePersonalLevel3Referrals = () => {
  // Level 3 referrals
  return stats.totalLevel3Referrals || 0;
};

const calculatePersonalNetworkSize = () => {
  // Sum of all levels in personal network
  return calculatePersonalDirectReferrals() + 
         calculatePersonalIndirectReferrals() + 
         calculatePersonalLevel3Referrals();
};

// Render only personal network tree
const renderPersonalNetworkTree = (node: any, depth: number = 0) => {
  if (!node || depth > 2) return null; // Limit depth to Level 3

  return (
    <div className="ml-4 border-l-2 border-gray-200 pl-4">
      <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <UserPlus className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-sm">{node.name || "Unknown User"}</p>
          <p className="text-xs text-gray-500">{node.email || "No email"}</p>
        </div>
        <Badge className="ml-auto">
          Level {depth + 1}
        </Badge>
      </div>
      {node.referrals?.map((referral: any, index: number) => (
        <div key={index}>
          {renderPersonalNetworkTree(referral, depth + 1)}
        </div>
      ))}
    </div>
  );
};

  // Calculate totals from commission history
  const calculateCommissionTotals = () => {
    const totals = {
      signup: 0,
      purchase: 0,
      total: 0,
    };

    commissionHistory.forEach((commission) => {
      if (commission.commissionType === "signup") {
        totals.signup += commission.amount;
      } else if (commission.commissionType === "purchase") {
        totals.purchase += commission.amount;
      }
      totals.total += commission.amount;
    });

    return totals;
  };

  const commissionTotals = calculateCommissionTotals();

  // 6 Overview Cards as per APEX requirements
  const mainStatsCards = [
    {
      label: "Total Earnings",
      value: `Rs. ${Math.round(apexValues.totalEarnings)}`,
      icon: Wallet,
      description: "APEX Wallet + APEX Bonus",
      color: "text-navy",
    },
    {
      label: "APEX Wallet",
      value: `Rs. ${Math.round(stats.purchaseCommissionTotal || 0)}`,
      icon: Gift,
      description: "Purchase commissions",
      color: "text-green-600",
    },
    {
      label: "APEX Bonus",
      value: `Rs. ${Math.round(apexValues.apexBonus)}`,
      icon: Award,
      description: "Signup & referral bonuses",
      color: "text-purple-600",
    },
    {
      label: "Network Size",
      value: calculatePersonalNetworkSize().toString(),
      icon: Network,
      description: "Level 1 + Level 2 + Level 3",
      color: "text-blue-600",
    },
    {
      label: "Direct Referrals",
      value: (stats.totalDirectReferrals || 0).toString(),
      icon: Users,
      description: "Level 1 team members",
      color: "text-green-700",
    },
    {
      label: "Indirect Referrals",
      value: calculateIndirectReferrals().toString(),
      icon: Users,
      description: "Level 2 & Level 3 Team",
      color: "text-blue-700",
    },
  ];

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render loading skeleton
  const renderSkeletonCards = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <Skeleton key={i} className="h-32 w-full" />
    ));
  };

  // Render network tree
  const renderNetworkTree = (node: any, depth: number = 0) => {
    if (!node) return null;

    return (
      <div className="ml-4 border-l-2 border-gray-200 pl-4">
        <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{node.name}</p>
            <p className="text-xs text-gray-500">{node.email}</p>
          </div>
          <Badge className="ml-auto">
            Level {node.level}
          </Badge>
        </div>
        {node.referrals?.map((referral: any, index: number) => (
          <div key={index}>
            {renderNetworkTree(referral, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          
          <Skeleton className="h-48 w-full mb-8 rounded-3xl" />
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {renderSkeletonCards(6)}
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Refer & Earn Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Level {stats.userLevel} • {stats.hasParent ? `Referred by ${stats.parentInfo?._id || 'someone'}` : "No referrer"}
            </p>
            {stats.parentInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Parent Referral Code: <span className="font-medium">{stats.parentInfo.referralCode}</span>
              </p>
            )}
          </div>
          <Button 
            onClick={fetchReferralData} 
            variant="outline" 
            size="sm" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>

        {/* Hero Section - Updated with APEX messaging */}
        <div className="bg-gradient-to-r from-navy to-accent rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">Refer. Earn. Be APEX Always.</h2>
              <p className="text-lg mb-2">
                Earn ₹50 for Direct Referrals + ₹25 for Indirect Referrals + 10% Commission on Purchases
              </p>
              <p className="text-lg mb-2">Introduce Your Friends & Earn Unlimited Income</p>
              <p className="text-lg font-semibold mb-4">"No Boss – No Limits – Just Earnings"</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Direct Referral Bonus</p>
                  <p className="text-xl font-semibold">Rs. 50</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Indirect Referral Bonus</p>
                  <p className="text-xl font-semibold">Rs. 25</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Purchase Commission</p>
                  <p className="text-xl font-semibold">10% / 5%</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Network Members</p>
                  <p className="text-xl font-semibold">{calculatePersonalNetworkSize()}</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Gift className="h-16 w-16 mx-auto mb-4" />
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm">APEX Wallet</p>
                <p className="text-2xl font-bold">Rs. {Math.round(stats.purchaseCommissionTotal || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab - 6 Cards Only */}
          <TabsContent value="overview" className="space-y-8">
            {/* Main Stats - 6 Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {loadingSections.stats ? (
                renderSkeletonCards(6)
              ) : (
                mainStatsCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {stat.label}
                            </p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {stat.description}
                            </p>
                          </div>
                          <Icon className="h-8 w-8 text-accent" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Referral Code Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Referral Code
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-blue-50 rounded-lg p-4 font-mono text-xl font-bold text-navy text-center border border-blue-200">
                      {referralCode || "Loading..."}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(referralCode, "code")}
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

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Referral Link
                  </label>
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
              </CardContent>
            </Card>

            {/* Recent Direct Referrals */}
            {stats.recentDirectReferrals && stats.recentDirectReferrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Direct Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentDirectReferrals.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-navy">{referral.name}</p>
                          <p className="text-sm text-muted-foreground">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(referral.joined).toLocaleDateString()}
                          </p>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Direct
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Earnings Breakdown Tab - 8 Fields */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>APEX Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSections.earnings ? (
                    <div className="space-y-4">
                      {renderSkeletonCards(3)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Direct Referral Bonus */}
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-medium text-green-800">Direct Referral Bonus</p>
                          <p className="text-sm text-green-600">Level 1 signup bonuses</p>
                        </div>
                        <p className="text-xl font-bold text-green-800">
                          Rs. {Math.round(stats.directEarnings || 0)}
                        </p>
                      </div>
                      
                      {/* Indirect Referral Bonus */}
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium text-blue-800">Indirect Referral Bonus</p>
                          <p className="text-sm text-blue-600">Level 2 & 3 signup bonuses</p>
                        </div>
                        <p className="text-xl font-bold text-blue-800">
                          Rs. {Math.round(stats.indirectEarnings || 0)}
                        </p>
                      </div>
                      
                      {/* Signup Bonus (Total) */}
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <p className="font-medium text-purple-800">Signup Bonus</p>
                          <p className="text-sm text-purple-600">All level signup bonuses</p>
                        </div>
                        <p className="text-xl font-bold text-purple-800">
                          Rs. {Math.round(stats.signupBonusTotal || 0)}
                        </p>
                      </div>
                      
                      {/* Purchase Commission */}
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <p className="font-medium text-orange-800">Purchase Commission</p>
                          <p className="text-sm text-orange-600">APEX Wallet earnings</p>
                        </div>
                        <p className="text-xl font-bold text-orange-800">
                          Rs. {Math.round(stats.purchaseCommissionTotal || 0)}
                        </p>
                      </div>
                      
                      {/* Membership Incentives */}
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-red-800">Membership Incentives</p>
                          <p className="text-sm text-red-600">Membership upgrades</p>
                        </div>
                        <p className="text-xl font-bold text-red-800">
                          Rs. {Math.round(stats.membershipIncentives || 0)}
                        </p>
                      </div>
                      
                      {/* Vendor Enroll Incentives */}
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <div>
                          <p className="font-medium text-pink-800">Vendor Enroll Incentives</p>
                          <p className="text-sm text-pink-600">Vendor enrollment</p>
                        </div>
                        <p className="text-xl font-bold text-pink-800">
                          Rs. {Math.round(stats.vendorIncentives || 0)}
                        </p>
                      </div>
                      
                      {/* Franchiser Enroll Incentives */}
                      <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg border border-teal-200">
                        <div>
                          <p className="font-medium text-teal-800">Franchiser Enroll Incentives</p>
                          <p className="text-sm text-teal-600">Franchiser enrollment</p>
                        </div>
                        <p className="text-xl font-bold text-teal-800">
                          Rs. {Math.round(stats.franchiserIncentives || 0)}
                        </p>
                      </div>
                      
                      {/* 1st Purchase Incentives */}
                      <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div>
                          <p className="font-medium text-indigo-800">1st Purchase Incentives</p>
                          <p className="text-sm text-indigo-600">First purchase bonuses</p>
                        </div>
                        <p className="text-xl font-bold text-indigo-800">
                          Rs. {Math.round(stats.firstPurchaseIncentives || 0)}
                        </p>
                      </div>
                      
                      {/* Total Summary */}
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-lg">APEX Wallet</p>
                            <p className="text-sm text-gray-600">Purchase commissions</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            Rs. {Math.round(stats.purchaseCommissionTotal || 0)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <p className="font-bold text-lg">APEX Bonus</p>
                            <p className="text-sm text-gray-600">Signup & incentive bonuses</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            Rs. {Math.round(apexValues.apexBonus)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <p className="font-bold text-xl">Total Earnings</p>
                          <p className="text-3xl font-bold text-navy">
                            Rs. {Math.round(apexValues.totalEarnings)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>APEX Commission Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-navy mb-2">
                        Level 1 (Direct Referrals)
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Signup Bonus:</span>
                          <span className="font-semibold">Rs. 50</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Purchase Commission:</span>
                          <span className="font-semibold">10% of product commission</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-navy mb-2">
                        Level 2 (Indirect Referrals)
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Signup Bonus:</span>
                          <span className="font-semibold">Rs. 25</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Purchase Commission:</span>
                          <span className="font-semibold">5% of product commission</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-navy mb-2">
                        Additional Incentives
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Membership Upgrade:</span>
                          <span className="font-semibold">Variable</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Vendor Enrollment:</span>
                          <span className="font-semibold">Variable</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Franchiser Enrollment:</span>
                          <span className="font-semibold">Variable</span>
                        </li>
                        <li className="flex justify-between">
                          <span>1st Purchase Bonus:</span>
                          <span className="font-semibold">Variable</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Current Status</h4>
                      <p className="text-sm mb-1">
                        Your Level: <span className="font-semibold">{stats.userLevel || 0}</span>
                      </p>
                      <p className="text-sm mb-1">
                        Referrer: <span className="font-semibold">{stats.hasParent ? "Yes" : "No"}</span>
                      </p>
                      {stats.pendingCommissionsCount && (
                        <p className="text-sm">
                          Pending Commissions: <span className="font-semibold">{stats.pendingCommissionsCount}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Referrals */}
            {earningsSummary?.topReferrals && earningsSummary.topReferrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Earning Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {earningsSummary.topReferrals.map((referral, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {referral.user?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {referral.referralCount} referrals
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-navy">
                            Rs. {Math.round(referral.totalEarned)}
                          </p>
                          <p className="text-xs text-gray-500">Total earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Referral History Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Referral History</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.totalDirectReferrals || 0} direct referrals • {calculateIndirectReferrals()} indirect referrals
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Direct Only</Button>
                  <Button size="sm" variant="outline">Indirect Only</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.history ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : referralHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold text-navy mb-2">No referrals yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your referral code to earn rewards!
                    </p>
                    <Button onClick={() => setActiveTab("overview")}>
                      Go to Referral Tools
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referralHistory.map((ref) => (
                      <div
                        key={ref._id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-navy">
                              {ref.referredUser?.name || "Unknown User"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {ref.referredUser?.email || "No email"}
                              {ref.referredUser?.phone && ` • ${ref.referredUser.phone}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="font-bold text-lg text-navy">
                             {ref.commissionDetails && (
                              <span className="text-green-600">
                                {ref.commissionDetails.amount && `Rs. ${Math.round(ref.commissionDetails.amount)}`}
                              </span>
                            )}
                            </p>
                            <div className="flex gap-2">
                              {getTypeBadge(ref.commissionType || ref.type, ref.level)}
                              <Badge className={getStatusColor(ref.status)}>
                                {getStatusText(ref.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex gap-3">
                            <span className="text-muted-foreground">
                              Level: {ref.level || 1} • {ref.levelName || "Direct"}
                            </span>
                            {ref.commissionDetails && (
                              <span className="text-green-600">
                                Credited: {ref.commissionDetails.amount && `Rs. ${Math.round(ref.commissionDetails.amount)}`}
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {formatDate(ref.createdAt)}
                          </span>
                        </div>
                        {ref.orderDetails && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                Order #{ref.orderDetails.orderNumber}
                              </span>
                              <span className="font-bold">
                                Rs. {Math.round(ref.orderDetails.total)}
                              </span>
                            </div>
                            {ref.orderDetails.paymentMethod && (
                              <div className="text-xs text-blue-600 mt-1">
                                Payment: {ref.orderDetails.paymentMethod}
                              </div>
                            )}
                          </div>
                        )}
                        {ref.completedAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            Completed on: {formatDate(ref.completedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission History Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Commission History</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total earned: Rs. {Math.round(apexValues.totalEarnings)}
                    </p>
                  </div>
                  {commissionHistory.length > 0 && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-purple-50">
                        APEX Bonus: Rs. {Math.round(apexValues.apexBonus)}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50">
                        APEX Wallet: Rs. {Math.round(apexValues.apexWallet)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.commissions ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : commissionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold text-navy mb-2">
                      No commission history yet
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Commissions will appear here when your referrals make purchases
                    </p>
                    <Button onClick={() => setActiveTab("overview")}>
                      Share Your Referral Link
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700">APEX Bonus</p>
                        <p className="text-lg font-bold text-purple-800">
                          Rs. {Math.round(apexValues.apexBonus)}
                        </p>
                        <p className="text-xs text-purple-600">
                          Signup & incentive bonuses
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">APEX Wallet</p>
                        <p className="text-lg font-bold text-green-800">
                          Rs. {Math.round(apexValues.apexWallet)}
                        </p>
                        <p className="text-xs text-green-600">
                          Purchase commissions
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">Total Earnings</p>
                        <p className="text-lg font-bold text-blue-800">
                          Rs. {Math.round(apexValues.totalEarnings)}
                        </p>
                        <p className="text-xs text-blue-600">
                          {commissionHistory.length} transactions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {commissionHistory.map((commission) => (
                        <div
                          key={commission._id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              {getCommissionTypeIcon(commission.commissionType)}
                              <span className="font-medium capitalize">
                                {commission.commissionType} Commission
                              </span>
                              <Badge variant="outline">
                                Level {commission.level}
                              </Badge>
                              {commission.source === "product-commission" && commission.percentage && (
                                <Badge variant="outline" className="bg-blue-50">
                                  {commission.percentage}%
                                </Badge>
                              )}
                              {commission.status && (
                                <Badge className={
                                  commission.status === 'credited' ? 'bg-green-100 text-green-800' :
                                  commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {commission.status}
                                </Badge>
                              )}
                            </div>
                            <p className="font-bold text-lg text-navy">
                              Rs. {Math.round(commission.amount)}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground capitalize">
                              {commission.source?.replace("-", " ")}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(commission.createdAt)}
                            </span>
                          </div>
                          {commission.orderId && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  Order #{commission.orderId.orderNumber}
                                </span>
                               
                              </div>
                              {commission.orderId.createdAt && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Ordered: {formatDate(commission.orderId.createdAt)}
                                </div>
                              )}
                            </div>
                          )}
                          {commission.notes && (
                            <div className="mt-2 text-xs text-gray-600 p-2 bg-gray-50 rounded">
                              Note: {commission.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab - Updated with Level 3 */}
<TabsContent value="network" className="space-y-6">
  <Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <CardTitle>Your APEX Referral Network</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total members in your network: {calculatePersonalNetworkSize()} • 
            Your earnings: Rs. {Math.round(apexValues.totalEarnings)}
          </p>
        </div>
        {networkData && (
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800">
              Level 1: {calculatePersonalDirectReferrals()}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              Level 2: {calculatePersonalIndirectReferrals()}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              Level 3: {calculatePersonalLevel3Referrals()}
            </Badge>
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {loadingSections.network ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !networkData ? (
        <div className="text-center py-12">
          <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-semibold text-navy mb-2">Network data unavailable</h4>
          <p className="text-muted-foreground">
            Network data will appear here as you build your referral network
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current User */}
          <div className="p-4 bg-gradient-to-r from-navy/10 to-accent/10 rounded-lg border-2 border-navy">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">You</span>
              </div>
              <div>
                <h3 className="font-bold text-navy">{networkData.user.name}</h3>
                <p className="text-sm text-gray-600">{networkData.user.email}</p>
                <p className="text-xs text-gray-500">
                  Level: {networkData.user.referralLevel} • 
                  Code: {networkData.user.referralCode}
                </p>
              </div>
              {networkData.user.referredBy && (
                <div className="ml-auto text-right">
                  <p className="text-sm text-gray-600">Referred by</p>
                  <p className="font-medium">{networkData.user.referredBy.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Network Tree - Only shows actual network */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-navy mb-4">Your Network Tree</h4>
            {renderPersonalNetworkTree(networkData.network)}
          </div>

          {/* Personal Network Stats */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <h4 className="font-semibold text-navy mb-3">Your Personal Network Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Personal Network</span>
                  <span className="font-semibold">{calculatePersonalNetworkSize()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Direct Referrals (Level 1)</span>
                  <span className="font-semibold">{calculatePersonalDirectReferrals()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Indirect Referrals (Level 2)</span>
                  <span className="font-semibold">{calculatePersonalIndirectReferrals()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Extended Network (Level 3)</span>
                  <span className="font-semibold">{calculatePersonalLevel3Referrals()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Total Earnings</span>
                  <span className="font-semibold">Rs. {Math.round(apexValues.totalEarnings || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>APEX Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Conversion Rate */}
                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Conversion Rate</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct Referrals</span>
                          <span className="font-semibold">{stats.totalDirectReferrals || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed Direct Referrals</span>
                          <span className="font-semibold">{stats.completedDirectReferrals || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct Conversion Rate</span>
                          <span className="font-semibold text-green-600">
                            {stats.totalDirectReferrals > 0 
                              ? `${((stats.completedDirectReferrals / stats.totalDirectReferrals) * 100).toFixed(1)}%` 
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Average Earnings */}
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Average APEX Earnings</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Direct Referral</span>
                          <span className="font-semibold">
                            Rs. {stats.totalDirectReferrals > 0 
                              ? Math.round(stats.directEarnings / stats.totalDirectReferrals) 
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Indirect Referral</span>
                          <span className="font-semibold">
                            Rs. {calculateIndirectReferrals() > 0 
                              ? Math.round(stats.indirectEarnings / calculateIndirectReferrals()) 
                              : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* APEX Earnings Breakdown */}
                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Earnings Composition</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">APEX Bonus</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 
                              ? `${((apexValues.apexBonus / apexValues.totalEarnings) * 100).toFixed(1)}%` 
                              : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">APEX Wallet</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 
                              ? `${((apexValues.apexWallet / apexValues.totalEarnings) * 100).toFixed(1)}%` 
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>APEX Growth Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Monthly Projection */}
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Monthly APEX Projection</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">Based on current APEX performance:</p>
                          <p className="text-lg font-bold text-blue-800 mt-1">
                            Rs. {Math.round(apexValues.totalEarnings)}
                          </p>
                          <p className="text-xs text-blue-600">Current total APEX earnings</p>
                        </div>
                      </div>
                    </div>

                    {/* APEX Referral Velocity */}
                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Referral Velocity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 
                              ? Math.round(referralHistory.filter(r => r.level === 1).length / 30) 
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Indirect referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 
                              ? Math.round(referralHistory.filter(r => r.level && r.level > 1).length / 30) 
                              : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* APEX Optimization Tips */}
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">💡 APEX Optimization Tips</h4>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        {stats.totalDirectReferrals < 5 && (
                          <li>• Focus on getting your first 5 direct referrals for APEX bonus</li>
                        )}
                        {apexValues.apexWallet < apexValues.apexBonus && (
                          <li>• Encourage your referrals to make purchases for APEX Wallet growth</li>
                        )}
                        {calculateIndirectReferrals() === 0 && (
                          <li>• Ask your direct referrals to share your code to build Level 2 & 3 team</li>
                        )}
                        {stats.membershipIncentives === 0 && (
                          <li>• Explore membership upgrade incentives in APEX system</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* How it Works - Updated for APEX */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-navy mb-6">
            How Our APEX Multi-Level System Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                1
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">
                Direct Referrals (Level 1)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn <strong>Rs. 50</strong> APEX bonus + <strong>10%</strong> of their product
                commission for every friend you directly refer
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                2
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">
                Indirect Referrals (Level 2 & 3)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn <strong>Rs. 25</strong> APEX bonus + <strong>5%</strong> of product
                commission from friends referred by your referrals (Level 2 & 3)
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                ∞
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">APEX Unlimited Earnings</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn APEX Wallet on every purchase + APEX Bonus on signups, memberships,
                vendor/franchiser enrollments, and more!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="w-full" onClick={() => copyToClipboard(referralCode, "code")}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button className="w-full" variant="outline" onClick={shareReferral}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => setActiveTab("network")}>
            <Network className="h-4 w-4 mr-2" />
            View Network
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => setActiveTab("analytics")}>
            <BarChart className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Referrals;