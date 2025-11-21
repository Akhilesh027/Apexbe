import { useEffect, useState } from "react";
import { Eye, Truck, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get vendor ID from localStorage (assuming vendor is logged in)
  const vendorId = localStorage.getItem("vendorId");


  useEffect(() => {
    const fetchVendorOrders = async () => {
      if (!vendorId) return;

      try {
        const res = await axios.get(`http://localhost:5000/api/orders/vendor/${vendorId}`);
        if (res.data.success) {
          setOrders(res.data.orders);
        } else {
          console.error("Failed to fetch orders:", res.data.message);
        }
      } catch (err) {
        console.error("Error fetching vendor orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorOrders();
  }, [vendorId]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Order Management</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary text-primary-foreground">
            <div className="grid grid-cols-8 gap-4 px-6 py-3 text-sm font-semibold">
              <div>Order ID</div>
              <div>Customer</div>
              <div>Total Amount</div>
              <div>Payment Status</div>
              <div>Order Status</div>
              <div>Items</div>
              <div>Date Placed</div>
              <div>Actions</div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="text-center p-6 col-span-8">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center p-6 col-span-8">No orders found for your store.</div>
            ) : (
              orders.map((order) => {
                const customer = order.userDetails;
                const totalAmount = order.orderSummary?.total || 0;
                const paymentStatus = order.paymentDetails?.status || "Pending";
                const orderStatus = order.orderStatus?.currentStatus || "Pending";
                const itemsCount = order.orderSummary?.itemsCount || order.orderItems.length;
                const datePlaced = new Date(order.createdAt).toLocaleDateString();
                const time = new Date(order.createdAt).toLocaleTimeString();

                return (
                  <div
                    key={order._id}
                    className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-muted/50"
                  >
                    <div className="font-medium">{order.orderNumber}</div>
                    <div>
                      <div className="font-medium">{customer?.name}</div>
                      <div className="text-xs text-muted-foreground">{customer?.email}</div>
                    </div>
                    <div className="font-semibold">₹{totalAmount}</div>
                    <div>
                      <Badge className="bg-success text-success-foreground">
                        {paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Badge className="bg-success text-success-foreground">
                        {orderStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm">{itemsCount} items</div>
                    <div className="text-sm">
                      <div>{datePlaced}</div>
                      <div className="text-muted-foreground">{time}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/orders/${order._id}`}>
                        <Button size="icon" variant="ghost" className="text-success hover:text-success/80">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" className="text-success hover:text-success/80">
                        <Truck className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-accent hover:text-accent/80">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Orders;
