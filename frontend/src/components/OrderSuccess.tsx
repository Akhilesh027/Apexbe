import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Home,
  Truck,
  Gift,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API_ORIGIN = "https://api.apexbee.in";

type OrderItem = {
  name: string;
  image?: string;
  color?: string;
  size?: string;
  quantity?: number;
};

type ShippingAddress = {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderDetails = {
  orderId?: string;
  orderNumber?: string;
  items: OrderItem[];
  paymentMethod: string;
  shippingAddress?: ShippingAddress;
  estimatedDelivery: string;
};

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showAnimation, setShowAnimation] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const orderData: any = location.state;

    if (orderData?.order) {
      const expected =
        orderData?.order?.deliveryDetails?.expectedDelivery ??
        Date.now() + 5 * 24 * 60 * 60 * 1000;

      setOrderDetails({
        orderId: orderData.order?._id,
        orderNumber: orderData.order?.orderNumber,
        items: Array.isArray(orderData.order?.orderItems)
          ? orderData.order.orderItems
          : [],
        paymentMethod: orderData?.paymentMethod || "UPI",
        shippingAddress: orderData.order?.shippingAddress,
        estimatedDelivery: new Date(expected).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    } else {
      setOrderDetails(null);
    }

    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, [location.state]);

  const formatAddress = (addr?: ShippingAddress) => {
    if (!addr) return "Address not available";
    const parts = [
      addr.address,
      addr.city,
      addr.state,
      addr.pincode ? `- ${addr.pincode}` : "",
    ].filter(Boolean);
    return parts.length ? parts.join(", ").replace(", -", " -") : "Address not available";
  };

  const getImageUrl = (img?: string) => {
    if (!img) return "/placeholder-product.png";
    if (img.startsWith("http")) return img;
    // if backend returns "/uploads/.."
    return `${API_ORIGIN}${img.startsWith("/") ? "" : "/"}${img}`;
  };

  // ✅ Empty state (no order data)
  if (!orderDetails && !showAnimation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="max-w-lg w-full">
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-lg font-semibold text-navy">
                No order data found
              </p>
              <p className="text-sm text-muted-foreground">
                Please place an order or open this page from the checkout flow.
              </p>
              <div className="pt-2">
                <Button onClick={() => navigate("/")}>Go Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ First Animation Screen
  if (showAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Gift className="w-28 h-28 text-yellow-500 animate-bounce" strokeWidth={2} />
          <div className="mt-6 text-3xl font-extrabold text-yellow-600 tracking-wide">
            Congratulations!
          </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Your order has been successfully placed.
          </p>
        </div>
      </div>
    );
  }

  // Safety: if animation ended but orderDetails is still null
  if (!orderDetails) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-4">
            <CheckCircle2 className="w-14 h-14 text-yellow-600" />
          </div>

          <h1 className="text-4xl font-bold mb-1 text-yellow-600">
            Congratulations!
          </h1>
          <p className="text-muted-foreground mb-2 text-lg">
            Your order has been confirmed successfully.
          </p>

          {orderDetails.orderNumber && (
            <p className="text-sm text-muted-foreground">
              Order Number: <strong>{orderDetails.orderNumber}</strong>
            </p>
          )}
        </div>

        {/* Products Ordered */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Products Ordered</h3>

            <div className="space-y-4">
              {orderDetails.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.name}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {item.color && <p>Color: {item.color}</p>}
                      {item.size && <p>Size: {item.size}</p>}
                      {typeof item.quantity === "number" && <p>Qty: {item.quantity}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Delivery Details</h3>

            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {formatAddress(orderDetails.shippingAddress)}
                  </p>
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
