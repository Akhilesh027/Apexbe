import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, MapPin, CreditCard, Home, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAnimation, setShowAnimation] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const orderData = location.state;

    if (orderData?.order) {
      // Use the passed order object
      setOrderDetails({
        orderId: orderData.order._id || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderNumber: orderData.order.orderNumber,
        orderDate: new Date(orderData.order.createdAt || Date.now()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: orderData.order.orderItems?.length || 0,
        subtotal: orderData.order.orderSummary?.subtotal || 0,
        discount: orderData.order.orderSummary?.discount || 0,
        shipping: orderData.order.orderSummary?.shipping || 0,
        total: orderData.order.orderSummary?.total || 0,
        paymentMethod: orderData.paymentMethod || "UPI",
        shippingAddress: orderData.order.shippingAddress,
        orderItems: orderData.order.orderItems || [],
        estimatedDelivery: orderData.order.deliveryDetails?.expectedDelivery
          ? new Date(orderData.order.deliveryDetails.expectedDelivery).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
      });
    }

    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, [location.state]);

  const formatAddress = (addr) => addr ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}` : "Address not available";

  const formatCurrency = (amount) => 
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No order data found. <Button onClick={() => navigate("/")}>Go Home</Button></p>
      </div>
    );
  }

  if (showAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircle2 className="w-32 h-32 text-green-500 animate-[scale-in_0.5s_ease-out]" strokeWidth={2} />
          <div className="mt-6 text-2xl font-bold text-foreground">Order Confirmed!</div>
          <p className="text-muted-foreground mt-2">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Confirmation Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-2">Thank you for your purchase. Your order has been confirmed.</p>
          {orderDetails.orderNumber && (
            <p className="text-sm text-muted-foreground">Order Number: <strong>{orderDetails.orderNumber}</strong></p>
          )}
        </div>

        {/* Ordered Items */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Ordered Items</h3>
            <div className="space-y-4">
              {orderDetails.orderItems.map((item, idx) => (
                <div key={item.productId || idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image.startsWith("http") ? item.image : `http://localhost:5000${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.name}</h4>
                    <div className="flex gap-4 mb-2 text-sm text-muted-foreground">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.itemTotal || item.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary & Delivery Info */}
        <Card>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Order ID:</span><span>{orderDetails.orderId}</span></div>
                {orderDetails.orderNumber && <div className="flex justify-between"><span>Order Number:</span><span>{orderDetails.orderNumber}</span></div>}
                <div className="flex justify-between"><span>Date:</span><span>{orderDetails.orderDate}</span></div>
                <div className="flex justify-between"><span>Items:</span><span>{orderDetails.items}</span></div>
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(orderDetails.subtotal)}</span></div>
                {orderDetails.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span>-{formatCurrency(orderDetails.discount)}</span></div>}
                <div className="flex justify-between"><span>Shipping:</span><span>{orderDetails.shipping === 0 ? "Free" : formatCurrency(orderDetails.shipping)}</span></div>
                <div className="flex justify-between border-t pt-2 font-semibold text-lg"><span>Total:</span><span>{formatCurrency(orderDetails.total)}</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Delivery Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{formatAddress(orderDetails.shippingAddress)}</p>
                    {orderDetails.shippingAddress?.phone && <p className="mt-1">Phone: {orderDetails.shippingAddress.phone}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-muted-foreground">{orderDetails.estimatedDelivery}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-muted-foreground capitalize">{orderDetails.paymentMethod}</p>
                    <p className="text-xs text-green-600">Payment Successful</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/")} className="flex items-center gap-2">
            <Home className="w-4 h-4" /> Continue Shopping
          </Button>
          <Button size="lg" className="bg-yellow hover:bg-yellow/90 text-yellow-foreground flex items-center gap-2" onClick={() => navigate("/orders")}>
            <Truck className="w-4 h-4" /> Track Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
