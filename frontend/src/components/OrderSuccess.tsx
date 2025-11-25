import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, MapPin, CreditCard, Home, Truck, Gift } from "lucide-react";
import Navbar from "@/components/Navbar";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAnimation, setShowAnimation] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const orderData = location.state;

    if (orderData?.order) {
      setOrderDetails({
        orderId: orderData.order._id,
        orderNumber: orderData.order.orderNumber,
        items: orderData.order.orderItems || [],
        paymentMethod: orderData.paymentMethod || "UPI",
        shippingAddress: orderData.order.shippingAddress,
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

  const formatAddress = (addr) =>
    addr ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}` : "Address not available";

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          No order data found. <Button onClick={() => navigate("/")}>Go Home</Button>
        </p>
      </div>
    );
  }

  // First Animation Screen
  if (showAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <Gift className="w-32 h-32 text-yellow-500 animate-bounce" strokeWidth={2} />
          <div className="mt-6 text-3xl font-extrabold text-yellow-600 tracking-wide">
            Congratulations!
          </div>
          <p className="text-muted-foreground mt-2 text-lg">Your order has been successfully placed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Congratulations Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-4 animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-yellow-600" />
          </div>

          <h1 className="text-4xl font-bold mb-1 text-yellow-600">Congratulations!</h1>
          <p className="text-muted-foreground mb-2 text-lg">Your order has been confirmed successfully.</p>

          {orderDetails.orderNumber && (
            <p className="text-sm text-muted-foreground">
              Order Number: <strong>{orderDetails.orderNumber}</strong>
            </p>
          )}
        </div>

        {/* Ordered Products */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Products Ordered</h3>
            <div className="space-y-4">
              {orderDetails.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={
                        item.image?.startsWith("http")
                          ? item.image
                          : `https://api.apexbee.in${item.image}`
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.name}</h4>
                    {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
                    {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Delivery Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{formatAddress(orderDetails.shippingAddress)}</p>
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
                  
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Continue Shopping
          </Button>
          <Button
            size="lg"
            className="bg-yellow hover:bg-yellow/90 text-yellow-foreground flex items-center gap-2"
            onClick={() => navigate("/orders")}
          >
            <Truck className="w-4 h-4" /> Track Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
