import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, AlertCircle, Loader2, X, MapPin, CreditCard, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!user || !token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/orders/user/${user._id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      'pending': { 
        icon: Clock, 
        color: 'text-orange-500', 
        label: 'Pending',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      'confirmed': { 
        icon: CheckCircle, 
        color: 'text-blue-500', 
        label: 'Confirmed',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      'processing': { 
        icon: Package, 
        color: 'text-purple-500', 
        label: 'Processing',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      'shipped': { 
        icon: Truck, 
        color: 'text-indigo-500', 
        label: 'Shipped',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
      },
      'delivered': { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        label: 'Delivered',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'cancelled': { 
        icon: AlertCircle, 
        color: 'text-red-500', 
        label: 'Cancelled',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      'refunded': { 
        icon: AlertCircle, 
        color: 'text-gray-500', 
        label: 'Refunded',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    };

    return statusConfig[status] || { 
      icon: Package, 
      color: 'text-gray-500', 
      label: status,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/orders/${orderId}/track`);
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'upi': 'UPI',
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking',
      'scan': 'Scan & Pay',
      'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-navy mb-8">My Orders</h1>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2 text-muted-foreground">Loading your orders...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-navy mb-8">My Orders</h1>
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <Button 
              onClick={fetchOrders}
              className="bg-navy hover:bg-navy/90 text-white"
            >
              Try Again
            </Button>
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
        <h1 className="text-3xl font-bold text-navy mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold text-navy mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Button 
              onClick={() => navigate("/products")}
              className="bg-navy hover:bg-navy/90 text-white"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.orderStatus?.currentStatus);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={order._id} 
                  className={`bg-white rounded-lg shadow-sm overflow-hidden border ${statusConfig.borderColor}`}
                >
                  <div className={`${statusConfig.bgColor} p-4 flex justify-between items-center`}>
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                      <span className={`font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {order.orderItems?.slice(0, 2).map((item, idx) => (
                      <div key={item._id || idx} className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                          <img 
                            src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-navy">{item.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            {item.color && item.color !== 'default' && (
                              <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                            )}
                            {item.size && item.size !== 'One Size' && (
                              <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-lg font-bold text-navy">{formatCurrency(item.price)}</p>
                            {item.originalPrice > item.price && (
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(item.originalPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {order.orderItems && order.orderItems.length > 2 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          +{order.orderItems.length - 2} more items
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <span className="text-muted-foreground">Total Amount: </span>
                        <span className="text-xl font-bold text-navy">
                          {formatCurrency(order.orderSummary?.total || 0)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {order.orderStatus?.currentStatus !== 'delivered' && 
                         order.orderStatus?.currentStatus !== 'cancelled' && (
                          <Button 
                            variant="outline"
                            onClick={() => handleTrackOrder(order._id)}
                          >
                            Track Order
                          </Button>
                        )}
                        <Button 
                          className="bg-navy hover:bg-navy/90 text-white"
                          onClick={() => handleViewDetails(order)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details - {selectedOrder?.orderNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status Timeline */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </h3>
                <div className="space-y-3">
                  {selectedOrder.orderStatus?.timeline?.map((timeline, index) => (
                    <div key={timeline._id} className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${
                        index === selectedOrder.orderStatus.timeline.length - 1 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{timeline.status}</p>
                        <p className="text-sm text-muted-foreground">{timeline.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(timeline.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.orderItems?.map((item) => (
                    <div key={item._id} className="flex gap-4 p-3 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                        <img 
                          src={item.image.startsWith('http') ? item.image : `${item.image}`} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          {item.color && item.color !== 'default' && (
                            <span>Color: {item.color}</span>
                          )}
                          {item.size && item.size !== 'One Size' && (
                            <span>Size: {item.size}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold">{formatCurrency(item.price)}</span>
                          {item.originalPrice > item.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                          <span className="ml-auto font-semibold">
                            {formatCurrency(item.itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </h3>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress?.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Phone: {selectedOrder.shippingAddress?.phone}
                    </p>
                  </div>
                </div>

                {/* Payment & Delivery Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </h3>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium capitalize">
                        {getPaymentMethodLabel(selectedOrder.paymentDetails?.method)}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        Status: {selectedOrder.paymentDetails?.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(selectedOrder.paymentDetails?.amount)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Delivery Information
                    </h3>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">
                        Expected Delivery: {formatDate(selectedOrder.deliveryDetails?.expectedDelivery)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Method: {selectedOrder.deliveryDetails?.shippingMethod}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({selectedOrder.orderSummary?.itemsCount} items):</span>
                    <span>{formatCurrency(selectedOrder.orderSummary?.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className={selectedOrder.orderSummary?.shipping === 0 ? 'text-green-600' : ''}>
                      {selectedOrder.orderSummary?.shipping === 0 ? 'Free' : formatCurrency(selectedOrder.orderSummary?.shipping)}
                    </span>
                  </div>
                  {selectedOrder.orderSummary?.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="text-green-600">
                        -{formatCurrency(selectedOrder.orderSummary?.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.orderSummary?.total)}</span>
                  </div>
                </div>
              </div>

              {/* Order Metadata */}
              <div className="text-xs text-muted-foreground">
                <p>Order placed on: {formatDateTime(selectedOrder.createdAt)}</p>
                <p>Source: {selectedOrder.metadata?.source === 'buy_now' ? 'Buy Now' : 'Shopping Cart'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyOrders;