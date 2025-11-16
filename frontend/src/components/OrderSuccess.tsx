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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order details from navigation state
    const orderData = location.state;
    
    if (orderData) {
      setOrderDetails({
        orderId: orderData.orderId || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderNumber: orderData.orderDetails?.orderNumber,
        orderDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        items: orderData.orderDetails?.orderItems?.length || 1,
        total: orderData.orderDetails?.orderSummary?.total || 0,
        shipping: orderData.orderDetails?.orderSummary?.shipping || 0,
        discount: orderData.orderDetails?.orderSummary?.discount || 0,
        subtotal: orderData.orderDetails?.orderSummary?.subtotal || 0,
        paymentMethod: orderData.paymentMethod || "UPI",
        shippingAddress: orderData.orderDetails?.shippingAddress,
        orderItems: orderData.orderDetails?.orderItems || [],
        estimatedDelivery: orderData.orderDetails?.deliveryDetails?.expectedDelivery 
          ? new Date(orderData.orderDetails.deliveryDetails.expectedDelivery).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
      });
    } else {
      // Fallback to mock data if no state passed
      setOrderDetails({
        orderId: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        items: 1,
        total: 940,
        shipping: 0,
        discount: 29,
        subtotal: 969,
        paymentMethod: "UPI",
        shippingAddress: {
          name: "Customer Name",
          address: "123 Main Street",
          city: "Rajamundry",
          state: "Andhra Pradesh",
          pincode: "533101",
          phone: "9876543210"
        },
        orderItems: [{
          productId: "1",
          name: "Premium Wireless Headphones",
          price: 969,
          originalPrice: 998,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
          quantity: 1,
          color: "Black",
          size: "One Size",
          itemTotal: 969
        }],
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }

    setLoading(false);

    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [location.state]);

  const formatAddress = (address) => {
    if (!address) return "Address not available";
    return `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (showAnimation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="relative inline-block">
            <CheckCircle2 
              className="w-32 h-32 text-green-500 animate-[scale-in_0.5s_ease-out]" 
              strokeWidth={2}
            />
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-foreground animate-fade-in">
            Order Confirmed!
          </h2>
          <p className="mt-2 text-muted-foreground animate-fade-in">
            Processing your order...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          {orderDetails?.orderNumber && (
            <p className="text-sm text-muted-foreground mt-2">
              Order Number: <span className="font-medium">{orderDetails.orderNumber}</span>
            </p>
          )}
        </div>

        {/* Ordered Items */}
        <Card className="mb-6 animate-fade-in">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Ordered Items</h3>
            <div className="space-y-4">
              {orderDetails?.orderItems?.map((item, index) => (
                <div key={item.productId || index} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                    <img 
                      src={item.image.startsWith('http') ? item.image : `https://api.apexbee.in${item.image}`}
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.name}</h4>
                    <div className="flex items-center gap-4 mb-2">
                      {item.color && item.color !== 'default' && (
                        <span className="text-sm text-muted-foreground">Color: {item.color}</span>
                      )}
                      {item.size && item.size !== 'One Size' && (
                        <span className="text-sm text-muted-foreground">Size: {item.size}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(item.price)}</span>
                          {item.originalPrice > item.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-lg">{formatCurrency(item.itemTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6 animate-fade-in">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-medium">{orderDetails?.orderId}</span>
                  </div>
                  {orderDetails?.orderNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number:</span>
                      <span className="font-medium">{orderDetails.orderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="font-medium">{orderDetails?.orderDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">{orderDetails?.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(orderDetails?.subtotal || 0)}</span>
                  </div>
                  {orderDetails?.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(orderDetails.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium text-green-600">
                      {orderDetails?.shipping === 0 ? 'Free' : formatCurrency(orderDetails.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(orderDetails?.total || 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Delivery Information</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-sm text-muted-foreground">
                        {orderDetails?.shippingAddress?.name && `${orderDetails.shippingAddress.name}, `}
                        {formatAddress(orderDetails?.shippingAddress)}
                      </p>
                      {orderDetails?.shippingAddress?.phone && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Phone: {orderDetails.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Package className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Estimated Delivery</p>
                      <p className="text-sm text-muted-foreground">{orderDetails?.estimatedDelivery}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {orderDetails?.paymentMethod?.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Payment Successful</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You will receive an email confirmation with your order details and tracking information shortly. 
            You can track your order status in the "My Orders" section.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Continue Shopping
          </Button>
          <Button 
            size="lg"
            className="bg-yellow hover:bg-yellow/90 text-yellow-foreground flex items-center gap-2"
            onClick={() => navigate("/orders")}
          >
            <Truck className="w-4 h-4" />
            Track Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;