import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Share2,
  Gift,
  Users,
  Loader2,
  Wallet,
  TrendingUp,
  Award,
  Coins,
  UserPlus,
  BarChart,
  Network,
  User,
} from "lucide-react";
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
  totalLevel3Referrals: number;
  completedDirectReferrals: number;
  completedIndirectReferrals: number;
  completedLevel3Referrals: number;
  pendingDirectReferrals: number;
  pendingIndirectReferrals: number;
  pendingLevel3Referrals: number;

  directEarnings: number;
  indirectEarnings: number;
  level3Earnings: number;

  signupBonusTotal: number;
  purchaseCommissionTotal: number;

  userLevel: number;
  hasParent: boolean;

  // APEX System Fields
  membershipIncentives?: number;
  vendorIncentives?: number;
  franchiserIncentives?: number;
  firstPurchaseIncentives?: number;
level1FirstPurchaseCommission?: number;
  // Level-specific counts
  level0Count?: number;
  level1Count?: number;
  level2Count?: number;
  level3Count?: number;

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

  networkStats?: {
    totalMembers: number;
    totalEarnings: number;
    levels: {
      level0?: number;
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
      level3?: number;
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
    level1Count: number;
    level2Count: number;
    level3Count: number;
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
    totalLevel3Referrals: 0,

    completedDirectReferrals: 0,
    completedIndirectReferrals: 0,
    completedLevel3Referrals: 0,

    pendingDirectReferrals: 0,
    pendingIndirectReferrals: 0,
    pendingLevel3Referrals: 0,

    directEarnings: 0,
    indirectEarnings: 0,
    level3Earnings: 0,

    signupBonusTotal: 0,
    purchaseCommissionTotal: 0,

    userLevel: 0,
    hasParent: false,

    membershipIncentives: 0,
    vendorIncentives: 0,
    franchiserIncentives: 0,
    firstPurchaseIncentives: 0,

    level0Count: 0,
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
    network: false,
  });

  // Helper function to calculate APEX values
  const calculateApexValues = (s: ReferralStats) => {
    // APEX Wallet = Purchase commissions only
    const apexWallet = s.purchaseCommissionTotal || 0;

    // APEX Bonus = only bonuses/incentives (NO purchase commissions)
    const apexBonus = s.signupBonusTotal || 0;

    const totalEarnings = apexWallet + apexBonus + (s.level1FirstPurchaseCommission || 0);
    return { apexWallet, apexBonus, totalEarnings };
  };

  const apexValues = calculateApexValues(stats);

  // ✅ Indirect total = Level 2 + Level 3
  const calculateTotalIndirectReferrals = () => {
    return (stats.totalIndirectReferrals || 0) + (stats.totalLevel3Referrals || 0);
  };

  // ✅ Completed indirect total = Level 2 + Level 3
  const calculateCompletedIndirectReferrals = () => {
    return (stats.completedIndirectReferrals || 0) + (stats.completedLevel3Referrals || 0);
  };

  // ✅ Personal network size = Level 1 + Level 2 + Level 3
  const calculatePersonalNetworkSize = () => {
    return (
      (stats.totalDirectReferrals || 0) +
      (stats.totalIndirectReferrals || 0) +
      (stats.totalLevel3Referrals || 0)
    );
  };

  /**
   * ✅ UPDATED LOGIC (Earnings tab only)
   * Instead of "first purchase only", we calculate COMPLETE purchase commission amount
   * coming from Level 1 / Level 2 / Level 3 using commissionHistory.
   *
   * NOTE: This does NOT change apexWallet / apexBonus / totals anywhere.
   */
  const calculatePurchaseCommissionsByLevel = (commissions: CommissionHistory[]) => {
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;

    for (const c of commissions) {
      if (c.commissionType !== "purchase") continue;
      const amt = Number(c.amount || 0);
      if (!amt) continue;

      if (c.level === 1) l1 += amt;
      else if (c.level === 2) l2 += amt;
      else if (c.level === 3) l3 += amt;
    }

    return {
      level1: l1,
      level2: l2,
      level3: l3,
      total: l1 + l2 + l3,
    };
  };

  const calculateWishLinkIncentive = (commissions: CommissionHistory[]) => {
    const looksLikeWishLink = (c: CommissionHistory) => {
      const s = (c.source || "").toLowerCase();
      const n = (c.notes || "").toLowerCase();
      return (
        s.includes("wish") ||
        s.includes("wishlink") ||
        s.includes("wish-link") ||
        s.includes("wish_link") ||
        n.includes("wish") ||
        n.includes("wish link") ||
        n.includes("wish-link") ||
        n.includes("wish_link")
      );
    };

    return commissions
      .filter((c) => c.commissionType === "purchase" && looksLikeWishLink(c))
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  };

  const purchaseByLevel = useMemo(
    () => calculatePurchaseCommissionsByLevel(commissionHistory),
    [commissionHistory]
  );

  const wishLinkIncentive = useMemo(
    () => calculateWishLinkIncentive(commissionHistory),
    [commissionHistory]
  );

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

      if (!codeRes.ok) throw new Error("Failed to fetch referral code");

      const codeData = await codeRes.json();
      setReferralCode(codeData.referralCode);
      setReferralLink(codeData.referralLink);

      // Fetch stats
      setLoadingSections((prev) => ({ ...prev, stats: true }));
      const statsRes = await fetch("https://api.apexbee.in/api/referrals/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!statsRes.ok) throw new Error("Failed to fetch referral stats");

      const statsData = await statsRes.json();
      setStats((prev) => ({
        ...prev,
        ...statsData,

        totalLevel3Referrals: statsData.totalLevel3Referrals || 0,
        completedLevel3Referrals: statsData.completedLevel3Referrals || 0,
        pendingLevel3Referrals: statsData.pendingLevel3Referrals || 0,
        level3Earnings: statsData.level3Earnings || 0,

        purchaseCommissionTotal: statsData.purchaseCommissionTotal || 0,
        signupBonusTotal: statsData.signupBonusTotal || 0,
        directEarnings: statsData.directEarnings || 0,
        indirectEarnings: statsData.indirectEarnings || 0,

        membershipIncentives: statsData.membershipIncentives || 0,
        vendorIncentives: statsData.vendorIncentives || 0,
        franchiserIncentives: statsData.franchiserIncentives || 0,
        firstPurchaseIncentives: statsData.firstPurchaseIncentives || 0,

        level0Count: statsData.level0Count || 0,
        level1Count: statsData.level1Count || 0,
        level2Count: statsData.level2Count || 0,
        level3Count: statsData.level3Count || 0,
      }));
      setLoadingSections((prev) => ({ ...prev, stats: false }));

      // Fetch referral history
      setLoadingSections((prev) => ({ ...prev, history: true }));
      const historyRes = await fetch("https://api.apexbee.in/api/referrals/history?limit=50", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setReferralHistory(historyData.referrals || []);
      }
      setLoadingSections((prev) => ({ ...prev, history: false }));

      // Fetch commission history
      setLoadingSections((prev) => ({ ...prev, commissions: true }));
      const commissionRes = await fetch("https://api.apexbee.in/api/user/commissions?limit=50", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (commissionRes.ok) {
        const commissionData = await commissionRes.json();
        setCommissionHistory(commissionData.commissions || []);
      }
      setLoadingSections((prev) => ({ ...prev, commissions: false }));

      // Fetch earnings summary
      try {
        setLoadingSections((prev) => ({ ...prev, earnings: true }));
        const earningsRes = await fetch("https://api.apexbee.in/api/referrals/earnings-summary", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          setEarningsSummary(earningsData);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSections((prev) => ({ ...prev, earnings: false }));
      }

      // Fetch network data
      try {
        setLoadingSections((prev) => ({ ...prev, network: true }));
        const networkRes = await fetch("https://api.apexbee.in/api/referrals/network?depth=3", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (networkRes.ok) {
          const nd = await networkRes.json();
          setNetworkData(nd);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSections((prev) => ({ ...prev, network: false }));
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
        description: type === "code" ? "Referral code copied to clipboard" : "Referral link copied to clipboard",
      });
    } catch {
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
        toast({ title: "Shared!", description: "Referral link shared successfully" });
      } catch {
        // cancelled
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

    const finalType = type || (level === 1 ? "direct" : level === 2 ? "indirect" : "level3");

    const config: Record<string, { label: string; className: string }> = {
      "signup-bonus": { label: "Signup Bonus", className: "bg-purple-100 text-purple-800 border-purple-200" },
      "purchase-commission": { label: "Purchase Commission", className: "bg-blue-100 text-blue-800 border-blue-200" },
      signup: { label: "Signup", className: "bg-purple-100 text-purple-800 border-purple-200" },
      purchase: { label: "Purchase", className: "bg-blue-100 text-blue-800 border-blue-200" },
      direct: { label: "Direct", className: "bg-green-100 text-green-800 border-green-200" },
      indirect: { label: "Indirect", className: "bg-orange-100 text-orange-800 border-orange-200" },
      level3: { label: "Level 3", className: "bg-purple-100 text-purple-800 border-purple-200" },
    };

    const configItem = config[finalType] || {
      label: finalType,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return <Badge className={`px-2 py-1 ${configItem.className}`}>{configItem.label}</Badge>;
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

  const calculatePersonalDirectReferrals = () => stats.totalDirectReferrals || 0;
  const calculatePersonalIndirectReferrals = () => stats.totalIndirectReferrals || 0;
  const calculatePersonalLevel3Referrals = () => stats.totalLevel3Referrals || 0;

  const renderPersonalNetworkTree = (node: any, depth: number = 0) => {
    if (!node || depth > 3) return null;

    return (
      <div className={`${depth > 0 ? "ml-4 border-l-2 border-gray-200 pl-4" : ""}`}>
        <div
          className={`flex items-center gap-2 mb-2 p-2 rounded-lg border ${
            depth === 0 ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              depth === 0 ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            {depth === 0 ? <User className="h-4 w-4 text-blue-600" /> : <UserPlus className="h-4 w-4 text-blue-600" />}
          </div>
          <div>
            <p className="font-medium text-sm">{node.name || "Unknown User"}</p>
            <p className="text-xs text-gray-500">{node.email || "No email"}</p>
          </div>
          <Badge className={`ml-auto ${depth === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}`}>
            {depth === 0 ? "You" : `Level ${depth}`}
          </Badge>
        </div>
        {node.referrals?.map((referral: any, index: number) => (
          <div key={index}>{renderPersonalNetworkTree(referral, depth + 1)}</div>
        ))}
      </div>
    );
  };

  const calculateCommissionTotals = () => {
    const totals = { signup: 0, purchase: 0, total: 0 };

    commissionHistory.forEach((commission) => {
      if (commission.commissionType === "signup") totals.signup += commission.amount;
      else if (commission.commissionType === "purchase") totals.purchase += commission.amount;
      totals.total += commission.amount;
    });

    return totals;
  };

  const commissionTotals = calculateCommissionTotals();

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
      value: `Rs. ${Math.round(stats.signupBonusTotal)}`,
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
      value: calculatePersonalDirectReferrals().toString(),
      icon: Users,
      description: "Level 1 team members",
      color: "text-green-700",
    },
    {
      label: "Indirect Referrals",
      value: calculateTotalIndirectReferrals().toString(),
      icon: Users,
      description: "Level 2 & Level 3 Team",
      color: "text-blue-700",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSkeletonCards = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => <Skeleton key={i} className="h-32 w-full" />);
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
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">{renderSkeletonCards(6)}</div>
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
              Level {stats.userLevel} •{" "}
              {stats.hasParent ? `Referred by ${stats.parentInfo?.name || "someone"}` : "No referrer"}
            </p>
            {stats.parentInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Parent Referral Code:{" "}
                <span className="font-medium">{stats.parentInfo.referralCode}</span>
              </p>
            )}
          </div>
          <Button onClick={fetchReferralData} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-navy to-accent rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">Refer. Earn. Be APEX Always.</h2>
              <p className="text-lg mb-2">Earn ₹50 for Direct Referrals</p>
              <p className="text-lg mb-2">Introduce Your Friends & Earn Unlimited Income</p>
              <p className="text-lg font-semibold mb-4">"No Boss – No Limits – Just Earnings"</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Direct Referral Bonus</p>
                  <p className="text-xl font-semibold">Rs. 50</p>
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {loadingSections.stats
                ? renderSkeletonCards(6)
                : mainStatsCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                            </div>
                            <Icon className="h-8 w-8 text-accent" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>

            {/* Referral Code Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Referral Code</label>
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
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-navy">{referral.name}</p>
                          <p className="text-sm text-muted-foreground">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(referral.joined).toLocaleDateString()}
                          </p>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Direct</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

      {/* ✅ UPDATED Earnings Tab (Better layout + clearer summary) */}
<TabsContent value="earnings" className="space-y-6">
  <div className="grid lg:grid-cols-3 gap-6">
    {/* LEFT: Main breakdown */}
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>APEX Earnings Breakdown</CardTitle>
      </CardHeader>

      <CardContent>
        {loadingSections.earnings ? (
          <div className="space-y-4">{renderSkeletonCards(3)}</div>
        ) : (
          <div className="space-y-4">
            {/* ✅ Purchase Commissions by Level (Complete commissions) */}
            <div className="rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-navy text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Purchase Commissions by Level
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These are your <span className="font-medium">complete</span> commissions earned from purchases
                    made in your network (Level 1 / 2 / 3).
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <Badge variant="outline" className="bg-white">
                    Total: Rs. {Math.round(purchaseByLevel.total || 0)}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Wallet (backend): Rs. {Math.round(stats.purchaseCommissionTotal || 0)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">Level 1 (Direct)</p>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">L1</Badge>
                  </div>
                  <p className="text-2xl font-extrabold text-green-900 mt-2">
                    Rs. {Math.round(purchaseByLevel.level1 || 0)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Earned from purchases by your direct referrals
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-800">Level 2 (Indirect)</p>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">L2</Badge>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-900 mt-2">
                    Rs. {Math.round(purchaseByLevel.level2 || 0)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Earned from purchases made by your L1 team’s referrals
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-purple-800">Level 3 (Extended)</p>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">L3</Badge>
                  </div>
                  <p className="text-2xl font-extrabold text-purple-900 mt-2">
                    Rs. {Math.round(purchaseByLevel.level3 || 0)}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Earned from purchases made deeper in your network
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-white p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-navy">Note:</span> If “Total” and “Wallet (backend)” differ,
                  it usually means there are pending commissions, reversed entries, or the wallet includes extra
                  incentives not included in this level split.
                </p>
              </div>
            </div>

            {/* ✅ Level 1 FIRST Purchase Commission ONLY */}
            <div className="rounded-2xl border bg-gradient-to-b from-green-50 to-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-navy text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-700" />
                    Level 1 – First Purchase Commission
                  </p>
                  <p className="text-xs text-muted-foreground">
                    One-time commission earned only when a <span className="font-medium">direct referral</span>{" "}
                    places their <span className="font-medium">first order</span>.
                  </p>
                </div>

                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Direct</Badge>
              </div>

              <p className="text-4xl font-extrabold text-green-900">
                Rs. {Math.round(stats.level1FirstPurchaseCommission || 0)}
              </p>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-muted-foreground">What this means</p>
                  <p className="text-sm font-medium text-navy mt-1">
                    You earn this only once per referral (their first successful purchase).
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Where it comes from</p>
                  <p className="text-sm font-medium text-navy mt-1">
                    This is calculated only from Level 1 first-purchase entries (isFirstPurchase = true).
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ Wish Link purchase incentive 
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sky-900 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-sky-700" />
                    Wish Link Purchase Incentive
                  </p>
                  <p className="text-xs text-sky-700 mt-1">
                    Earned when someone purchases using your shared wish link.
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-sky-900">
                  Rs. {Math.round(wishLinkIncentive || 0)}
                </p>
              </div>
            </div>*/}

            {/* ✅ Signup Bonus (Total) */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-700" />
                    Total Signup Bonus
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Bonus credited for successful signups across levels.
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-indigo-900">
                  Rs. {Math.round(stats.signupBonusTotal || 0)}
                </p>
              </div>
            </div>

            {/* ✅ Wallet Purchase Commission (Backend total) */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-orange-900 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-700" />
                    Purchase Commission (Wallet)
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Total credited purchase commissions shown in your wallet.
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-orange-900">
                  Rs. {Math.round(stats.purchaseCommissionTotal || 0)}
                </p>
              </div>
            </div>

            {/* ✅ Other Incentives */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">Membership Incentives</p>
                <p className="text-2xl font-extrabold text-red-900 mt-2">
                  Rs. {Math.round(stats.membershipIncentives || 0)}
                </p>
                <p className="text-xs text-red-700 mt-1">Membership rewards</p>
              </div>

              <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4">
                <p className="text-sm font-semibold text-pink-900">Vendor Incentives</p>
                <p className="text-2xl font-extrabold text-pink-900 mt-2">
                  Rs. {Math.round(stats.vendorIncentives || 0)}
                </p>
                <p className="text-xs text-pink-700 mt-1">Vendor rewards</p>
              </div>

              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">Franchiser Incentives</p>
                <p className="text-2xl font-extrabold text-teal-900 mt-2">
                  Rs. {Math.round(stats.franchiserIncentives || 0)}
                </p>
                <p className="text-xs text-teal-700 mt-1">Franchiser rewards</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* RIGHT: Summary / Explanation */}
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>

      <CardContent>
        {loadingSections.earnings ? (
          <div className="space-y-4">{renderSkeletonCards(4)}</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-muted-foreground">APEX Wallet</p>
              <p className="text-2xl font-extrabold text-green-700 mt-1">
                Rs. {Math.round(stats.purchaseCommissionTotal || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This is your main wallet balance from purchase commissions. It typically includes purchase-based credits
                (and may include special incentives if your backend adds them into wallet).
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-muted-foreground">APEX Bonus</p>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">
                Rs. {Math.round(apexValues.apexBonus)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This includes signup bonuses + incentive rewards (membership/vendor/franchiser), depending on what is
                enabled for your account.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-muted-foreground">First Purchase (Level 1 only)</p>
              <p className="text-2xl font-extrabold text-green-900 mt-1">
                Rs. {Math.round(stats.level1FirstPurchaseCommission || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                One-time commission triggered only when your direct referral makes their very first purchase.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-extrabold text-navy mt-1">
                Rs. {Math.round(apexValues.totalEarnings)}
              </p>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Purchase commissions (wallet)</span>
                  <span className="font-medium text-navy">Rs. {Math.round(stats.purchaseCommissionTotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signup bonuses</span>
                  <span className="font-medium text-navy">Rs. {Math.round(stats.signupBonusTotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wish link incentive</span>
                  <span className="font-medium text-navy">Rs. {Math.round(wishLinkIncentive || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other incentives</span>
                  <span className="font-medium text-navy">
                    Rs.{" "}
                    {Math.round(
                      (stats.membershipIncentives || 0) +
                        (stats.vendorIncentives || 0) +
                        (stats.franchiserIncentives || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-white p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-navy">Tip:</span> If totals don’t match exactly, it’s usually due
                  to pending or reversed commissions, or because the wallet balance also includes manual credits.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</TabsContent>

          {/* Referral History Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Referral History</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {calculatePersonalDirectReferrals()} direct • {calculatePersonalIndirectReferrals()} indirect •{" "}
                    {calculatePersonalLevel3Referrals()} level 3
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const filtered = referralHistory.filter((r) => r.level === 1);
                      // Update display logic here
                      console.log(filtered);
                    }}
                  >
                    Direct Only
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const filtered = referralHistory.filter((r) => r.level === 2);
                      console.log(filtered);
                    }}
                  >
                    Indirect Only
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const filtered = referralHistory.filter((r) => r.level === 3);
                      console.log(filtered);
                    }}
                  >
                    Level 3 Only
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.history ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
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
                    <Button onClick={() => setActiveTab("overview")}>Go to Referral Tools</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referralHistory.map((ref) => {
                      const getLevelColor = (level?: number) => {
                        switch (level) {
                          case 1:
                            return "text-green-600";
                          case 2:
                            return "text-blue-600";
                          case 3:
                            return "text-purple-600";
                          default:
                            return "text-gray-600";
                        }
                      };

                      const getLevelLabel = (level?: number) => {
                        switch (level) {
                          case 1:
                            return "Direct";
                          case 2:
                            return "Indirect";
                          case 3:
                            return "Level 3";
                          default:
                            return "Unknown";
                        }
                      };

                      return (
                        <div key={ref._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-navy">{ref.referredUser?.name || "Unknown User"}</h4>
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
                                <Badge className={`${getLevelColor(ref.level)} bg-opacity-20`}>
                                  {getLevelLabel(ref.level)}
                                </Badge>
                                {getTypeBadge(ref.commissionType || ref.type, ref.level)}
                                <Badge className={getStatusColor(ref.status)}>{getStatusText(ref.status)}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex gap-3">
                              <span className={`font-medium ${getLevelColor(ref.level)}`}>
                                Level {ref.level} • {getLevelLabel(ref.level)}
                              </span>
                              {ref.commissionDetails && (
                                <span className="text-green-600">
                                  Credited:{" "}
                                  {ref.commissionDetails.amount && `Rs. ${Math.round(ref.commissionDetails.amount)}`}
                                </span>
                              )}
                            </div>
                            <span className="text-muted-foreground">{formatDate(ref.createdAt)}</span>
                          </div>
                          {ref.orderDetails && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">Order #{ref.orderDetails.orderNumber}</span>
                                <span className="font-bold">Rs. {Math.round(ref.orderDetails.total)}</span>
                              </div>
                              {ref.orderDetails.paymentMethod && (
                                <div className="text-xs text-blue-600 mt-1">Payment: {ref.orderDetails.paymentMethod}</div>
                              )}
                            </div>
                          )}
                          {ref.completedAt && (
                            <div className="text-xs text-gray-500 mt-2">Completed on: {formatDate(ref.completedAt)}</div>
                          )}
                        </div>
                      );
                    })}
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
                    <p className="text-sm text-muted-foreground mt-1">Total earned: Rs. {Math.round(apexValues.totalEarnings)}</p>
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
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                  </div>
                ) : commissionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold text-navy mb-2">No commission history yet</h4>
                    <p className="text-muted-foreground mb-4">Commissions will appear here when your referrals make purchases</p>
                    <Button onClick={() => setActiveTab("overview")}>Share Your Referral Link</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700">APEX Bonus</p>
                        <p className="text-lg font-bold text-purple-800">Rs. {Math.round(apexValues.apexBonus)}</p>
                        <p className="text-xs text-purple-600">Signup & incentive bonuses</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">APEX Wallet</p>
                        <p className="text-lg font-bold text-green-800">Rs. {Math.round(apexValues.apexWallet)}</p>
                        <p className="text-xs text-green-600">Purchase commissions</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">Total Earnings</p>
                        <p className="text-lg font-bold text-blue-800">Rs. {Math.round(apexValues.totalEarnings)}</p>
                        <p className="text-xs text-blue-600">{commissionHistory.length} transactions</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {commissionHistory.map((commission) => (
                        <div key={commission._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              {getCommissionTypeIcon(commission.commissionType)}
                              <span className="font-medium capitalize">{commission.commissionType} Commission</span>
                              <Badge
                                variant="outline"
                                className={
                                  commission.level === 1
                                    ? "bg-green-50 text-green-800"
                                    : commission.level === 2
                                    ? "bg-blue-50 text-blue-800"
                                    : commission.level === 3
                                    ? "bg-purple-50 text-purple-800"
                                    : "bg-gray-50"
                                }
                              >
                                Level {commission.level}
                              </Badge>
                              {commission.source === "product-commission" && commission.percentage && (
                                <Badge variant="outline" className="bg-blue-50">
                                  {commission.percentage}%
                                </Badge>
                              )}
                              {commission.status && (
                                <Badge
                                  className={
                                    commission.status === "credited"
                                      ? "bg-green-100 text-green-800"
                                      : commission.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {commission.status}
                                </Badge>
                              )}
                            </div>
                            <p className="font-bold text-lg text-navy">Rs. {Math.round(commission.amount)}</p>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground capitalize">{commission.source?.replace("-", " ")}</span>
                            <span className="text-muted-foreground">{formatDate(commission.createdAt)}</span>
                          </div>
                          {commission.orderId && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">Order #{commission.orderId.orderNumber}</span>
                              </div>
                              {commission.orderId.createdAt && (
                                <div className="text-xs text-blue-600 mt-1">Ordered: {formatDate(commission.orderId.createdAt)}</div>
                              )}
                            </div>
                          )}
                          {commission.notes && (
                            <div className="mt-2 text-xs text-gray-600 p-2 bg-gray-50 rounded">Note: {commission.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Your APEX Referral Network</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total members in your network: {calculatePersonalNetworkSize()} • Your earnings: Rs.{" "}
                      {Math.round(apexValues.totalEarnings)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">Level 1: {calculatePersonalDirectReferrals()}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">Level 2: {calculatePersonalIndirectReferrals()}</Badge>
                    <Badge className="bg-purple-100 text-purple-800">Level 3: {calculatePersonalLevel3Referrals()}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.network ? (
                  <div className="space-y-4">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
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
                    <p className="text-muted-foreground">Network data will appear here as you build your referral network</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-r from-navy/10 to-accent/10 rounded-lg border-2 border-navy">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">You</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-navy">{networkData.user.name}</h3>
                          <p className="text-sm text-gray-600">{networkData.user.email}</p>
                          <p className="text-xs text-gray-500">
                            Level: {networkData.user.referralLevel} • Code: {networkData.user.referralCode}
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

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-navy">Your Network Tree (Up to Level 3)</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Level 1
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Level 2
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            Level 3
                          </Badge>
                        </div>
                      </div>
                      {renderPersonalNetworkTree(networkData.network)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border rounded-lg">
                        <h4 className="font-semibold text-navy mb-3">Network Distribution</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Direct Referrals (Level 1)</span>
                              <span className="font-semibold">{calculatePersonalDirectReferrals()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (calculatePersonalDirectReferrals() / calculatePersonalNetworkSize()) * 100 || 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Indirect Referrals (Level 2)</span>
                              <span className="font-semibold">{calculatePersonalIndirectReferrals()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (calculatePersonalIndirectReferrals() / calculatePersonalNetworkSize()) * 100 || 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Extended Network (Level 3)</span>
                              <span className="font-semibold">{calculatePersonalLevel3Referrals()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (calculatePersonalLevel3Referrals() / calculatePersonalNetworkSize()) * 100 || 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white border rounded-lg">
                        <h4 className="font-semibold text-navy mb-3">Earnings Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Direct Earnings (Level 1)</span>
                            <span className="font-semibold">Rs. {Math.round(stats.directEarnings || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Indirect Earnings (Level 2)</span>
                            <span className="font-semibold">Rs. {Math.round(stats.indirectEarnings || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Extended Earnings (Level 3)</span>
                            <span className="font-semibold">Rs. {Math.round(stats.level3Earnings || 0)}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">Total Network Earnings</span>
                              <span className="font-bold text-lg text-navy">Rs. {Math.round(apexValues.totalEarnings || 0)}</span>
                            </div>
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
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Conversion Rate by Level</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Direct Referrals (Level 1)</span>
                            <span className="text-sm font-medium">
                              {stats.totalDirectReferrals > 0
                                ? `${((stats.completedDirectReferrals / stats.totalDirectReferrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  stats.totalDirectReferrals > 0
                                    ? (stats.completedDirectReferrals / stats.totalDirectReferrals) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedDirectReferrals || 0} completed</span>
                            <span>{stats.totalDirectReferrals || 0} total</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Indirect Referrals (Level 2)</span>
                            <span className="text-sm font-medium">
                              {stats.totalIndirectReferrals > 0
                                ? `${((stats.completedIndirectReferrals / stats.totalIndirectReferrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  stats.totalIndirectReferrals > 0
                                    ? (stats.completedIndirectReferrals / stats.totalIndirectReferrals) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedIndirectReferrals || 0} completed</span>
                            <span>{stats.totalIndirectReferrals || 0} total</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Extended Network (Level 3)</span>
                            <span className="text-sm font-medium">
                              {stats.totalLevel3Referrals > 0
                                ? `${((stats.completedLevel3Referrals / stats.totalLevel3Referrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  stats.totalLevel3Referrals > 0
                                    ? (stats.completedLevel3Referrals / stats.totalLevel3Referrals) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedLevel3Referrals || 0} completed</span>
                            <span>{stats.totalLevel3Referrals || 0} total</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">Average Earnings per Level</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Direct Referral (Level 1)</span>
                          <span className="font-semibold">
                            Rs. {stats.totalDirectReferrals > 0 ? Math.round(stats.directEarnings / stats.totalDirectReferrals) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Indirect Referral (Level 2)</span>
                          <span className="font-semibold">
                            Rs. {stats.totalIndirectReferrals > 0 ? Math.round(stats.indirectEarnings / stats.totalIndirectReferrals) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Level 3 Referral</span>
                          <span className="font-semibold">
                            Rs. {stats.totalLevel3Referrals > 0 ? Math.round(stats.level3Earnings / stats.totalLevel3Referrals) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Earnings Composition</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct Earnings (Level 1)</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.directEarnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Indirect Earnings (Level 2)</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.indirectEarnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level 3 Earnings</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.level3Earnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-gray-600">APEX Wallet</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((apexValues.apexWallet / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
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
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Monthly APEX Projection</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">Based on current APEX performance:</p>
                          <p className="text-lg font-bold text-blue-800 mt-1">Rs. {Math.round(apexValues.totalEarnings)}</p>
                          <p className="text-xs text-blue-600">Current total APEX earnings</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Referral Velocity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 1).length / 30) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Indirect referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 2).length / 30) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level 3 referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 3).length / 30) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">💡 APEX Optimization Tips</h4>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        {stats.totalDirectReferrals < 5 && <li>• Focus on getting your first 5 direct referrals for APEX bonus</li>}
                        {stats.totalLevel3Referrals === 0 && stats.totalIndirectReferrals > 0 && (
                          <li>• Ask your Level 2 referrals to refer others to build Level 3 network</li>
                        )}
                        {apexValues.apexWallet < apexValues.apexBonus && (
                          <li>• Encourage your referrals to make purchases for APEX Wallet growth</li>
                        )}
                        {stats.completedDirectReferrals < stats.totalDirectReferrals && (
                          <li>• Follow up with pending direct referrals to complete their first purchase</li>
                        )}
                        {stats.membershipIncentives === 0 && <li>• Explore membership upgrade incentives in APEX system</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-navy mb-6">How Our APEX Commission System Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                1
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">Level 1 Purchase Commission</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn commission on <strong>every purchase</strong> made by your direct referral.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                2
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">Level 2 Purchase Commission</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn commission on <strong>every purchase</strong> made by referrals under your Level 1 network.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                3
              </div>
              <h4 className="font-semibold text-navy mb-3 text-lg">Level 3 Purchase Commission</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn commission on <strong>every purchase</strong> made by referrals under your Level 2 network.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-center text-sm text-blue-700 leading-relaxed">
              <strong>Wish Link Purchase Incentive:</strong> Earn commission whenever someone buys a product using your shared link.
              <br />
              <strong>*3 Levels only — self purchases not eligible.</strong>
            </p>
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
