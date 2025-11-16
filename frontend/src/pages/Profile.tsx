import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Package, MapPin, Gift, Edit, ChevronRight, Loader2, X, Truck, CheckCircle, Clock, AlertCircle, CreditCard, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState({
    user: true,
    orders: false,
    addresses: false
  });
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Get user data from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        _id: user._id,
        name: user.name || user.username,
        email: user.email,
        phone: user.phone || "+91 98765 43210",
        avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      });
      setLoading(prev => ({ ...prev, user: false }));
    } else {
      setError("User not found. Please login again.");
      setLoading(prev => ({ ...prev, user: false }));
    }
  }, []);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === "orders" && userData?._id && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab, userData]);

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === "addresses" && userData?._id && addresses.length === 0) {
      fetchAddresses();
    }
  }, [activeTab, userData]);

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api.apexbee.in/api/orders/user/${userData._id}`, {
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
      setError("Failed to load orders");
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchAddresses = async () => {
    setLoading(prev => ({ ...prev, addresses: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api.apexbee.in/api/user/address/${userData._id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const data = await response.json();
      // Handle both single address and array of addresses
      if (data.address) {
        setAddresses([data.address]);
      } else if (Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("Failed to load addresses");
    } finally {
      setLoading(prev => ({ ...prev, addresses: false }));
    }
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

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'secondary', color: 'bg-yellow-500', label: 'Pending' },
      'confirmed': { variant: 'secondary', color: 'bg-blue-500', label: 'Confirmed' },
      'processing': { variant: 'secondary', color: 'bg-orange-500', label: 'Processing' },
      'shipped': { variant: 'secondary', color: 'bg-purple-500', label: 'Shipped' },
      'delivered': { variant: 'default', color: 'bg-green-500', label: 'Delivered' },
      'cancelled': { variant: 'secondary', color: 'bg-red-500', label: 'Cancelled' },
      'refunded': { variant: 'secondary', color: 'bg-gray-500', label: 'Refunded' }
    };

    const config = statusConfig[status] || { variant: 'secondary', color: 'bg-gray-500', label: status };
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
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

  const handleSaveProfile = async () => {
    // Implement profile update functionality
    console.log("Save profile functionality to be implemented");
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (loading.user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.href = '/login'} className="mt-4">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-yellow">
                  <AvatarImage src={userData?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{userData?.name}</h1>
                  <p className="text-muted-foreground">{userData?.email}</p>
                  <p className="text-muted-foreground">{userData?.phone}</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                My Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                <Gift className="h-4 w-4" />
                Referrals
              </TabsTrigger>
            </TabsList>

            {/* Profile Details Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={userData?.name || ''} 
                        onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={userData?.email || ''}
                        onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={userData?.phone || ''}
                        onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" />
                    </div>
                  </div>
                  <Button 
                    className="bg-navy hover:bg-navy/90"
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.orders ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-navy" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                      <Button 
                        onClick={() => navigate("/products")} 
                        className="mt-4 bg-navy hover:bg-navy/90"
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {order.orderItems?.[0]?.image && (
                            <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                              <img
                                src={`https://api.apexbee.in${order.orderItems[0].image}`}
                                alt={order.orderItems[0].name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              {getOrderStatusBadge(order.orderStatus?.currentStatus)}
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">
                                {order.orderSummary?.itemsCount || order.orderItems?.length || 0} items
                              </p>
                              <div className="flex items-center gap-4">
                                <p className="font-semibold text-lg">
                                  {formatCurrency(order.orderSummary?.total || 0)}
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => handleViewOrderDetails(order)}
                                >
                                  View Details
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Saved Addresses</CardTitle>
                    <Button className="bg-navy hover:bg-navy/90">
                      Add New Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading.addresses ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-navy" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No addresses saved</p>
                      <Button className="mt-4 bg-navy hover:bg-navy/90">
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id || address.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{address.type || 'Address'}</Badge>
                              {address.isDefault && (
                                <Badge className="bg-yellow text-navy">Default</Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{address.name}</h3>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">Phone: {address.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Refer & Earn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-navy to-navy/80 text-white p-6 rounded-lg">
                    <h3 className="text-2xl font-bold mb-2">Your Referral Code</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        readOnly
                        value={userData?._id ? `REF${userData._id.slice(-8).toUpperCase()}` : "LOADING"}
                        className="bg-white text-navy font-bold text-xl"
                      />
                      <Button className="bg-yellow text-navy hover:bg-yellow/90">Copy</Button>
                    </div>
                    <p className="text-sm opacity-90">
                      Share your code with friends and earn ₹100 for each successful referral!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-navy mb-2">0</div>
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-green-500 mb-2">₹0</div>
                        <p className="text-sm text-muted-foreground">Earned</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-yellow mb-2">₹0</div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Recent Referrals</h3>
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No referrals yet</p>
                      <p className="text-sm mt-2">Share your referral code to start earning!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details - {selectedOrder?.orderNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOrderDetails(false)}
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
    </div>
  );
};

export default Profile;