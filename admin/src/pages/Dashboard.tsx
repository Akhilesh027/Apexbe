import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Package, ShoppingCart, DollarSign, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingShopApprovals: 0,
    totalRevenue: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/dashboard/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  // Fetch sales data for chart
  const fetchSalesData = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/dashboard/sales");
      setSalesData(res.data);
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/dashboard/recent-activity");
      setRecentActivity(res.data);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSalesData();
    fetchRecentActivity();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Total Vendors", value: stats.totalVendors, icon: Store, color: "text-accent" },
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-warning" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-destructive" },
    { title: "Pending Approvals", value: stats.pendingShopApprovals, icon: Clock, color: "text-warning" },
    { title: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground">No sales data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user?.name || activity.product?.itemName || activity.order?._id || activity.vendor?.name}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No recent activity found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
