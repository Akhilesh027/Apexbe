import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import axios from "axios";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState("NEW");
  const [loading, setLoading] = useState(true);

  // Get vendor ID from localStorage
  const vendorId = localStorage.getItem("vendorId");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id || !vendorId) return;

      try {
        const res = await axios.get(`https://website-backend-57f9.onrender.com/api/orders/${id}`);
        if (res.data.success) {
          const orderData = res.data.order;

          // Filter items for this vendor only
          const vendorItems = orderData.orderItems.filter(
            (item: any) => item.vendorId === vendorId
          );

          setOrder({ ...orderData, orderItems: vendorItems });
          setOrderStatus(orderData.orderStatus?.currentStatus || "NEW");
        } else {
          toast.error(res.data.message || "Failed to fetch order details.");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        toast.error("Server error while fetching order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, vendorId]);

  const handleStatusUpdate = async () => {
    try {
      const res = await axios.put(`https://website-backend-57f9.onrender.com/api/orders/${id}/status`, {
        status: orderStatus,
      });

      if (res.data.success) {
        toast.success(`Order status updated to ${orderStatus}`);
      } else {
        toast.error(res.data.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Server error while updating status.");
    }
  };

  if (loading) {
    return <AppLayout><div className="text-center py-10">Loading order details...</div></AppLayout>;
  }

  if (!order || order.orderItems.length === 0) {
    return <AppLayout><div className="text-center py-10">No items for your store in this order.</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
          <Button variant="outline" onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Placed</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString()}{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge className="bg-success text-success-foreground">{order.paymentDetails?.status.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge className="bg-success text-success-foreground">{orderStatus.toUpperCase()}</Badge>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item: any) => (
                  <div key={item._id} className="flex gap-4 pb-4 border-b last:border-0">
                    <img
                      src={`${item.productId?.image || item.image}`}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} ({item.color}, {item.size})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.itemTotal}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>₹{order.orderSummary?.total}</span>
                </div>
              </div>
            </Card>

            {/* Update Status */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStatusUpdate} className="w-full">
                  Update Status
                </Button>
              </div>
            </Card>
          </div>

          {/* Customer Info */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{order.userDetails?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{order.userDetails?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{order.userDetails?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="font-semibold">
                    {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}, {order.shippingAddress?.country}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderDetails;
