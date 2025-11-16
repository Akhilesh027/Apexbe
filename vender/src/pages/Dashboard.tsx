import { useEffect, useState } from "react";
import { Package, XCircle, CheckCircle, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";

interface Stats {
  totalOrders: number;
  canceledOrders: number;
  completedOrders: number;
  profit: number;
  loss: number;
  returnedOrders: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.apexbee.in/api/dashboard"); // Replace with your API endpoint
        const data = await res.json();

        if (res.ok && data.success) {
          setStats(data.stats);
        } else {
          toast.error(data.message || "Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while fetching dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center text-lg text-muted-foreground">
          Loading dashboard data...
        </div>
      </AppLayout>
    );
  }

  const statItems = [
    { title: "Total Orders", value: stats.totalOrders, icon: Package, iconColor: "text-accent" },
    { title: "Canceled Orders", value: stats.canceledOrders, icon: XCircle, iconColor: "text-destructive" },
    { title: "Completed Orders", value: stats.completedOrders, icon: CheckCircle, iconColor: "text-success" },
    { title: "Profit on Orders", value: `₹${stats.profit}`, icon: TrendingUp, iconColor: "text-success" },
    { title: "Loss on Orders", value: `₹${stats.loss}`, icon: TrendingDown, iconColor: "text-destructive" },
    { title: "Returned Orders", value: stats.returnedOrders, icon: RotateCcw, iconColor: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="inline-block bg-primary text-primary-foreground px-4 py-2 mb-4">
            Vendor Panel
          </div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statItems.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
