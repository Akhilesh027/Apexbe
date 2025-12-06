import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Smartphone,
  Mail,
  Calendar,
  ShoppingBag,
  IndianRupee,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const { data } = await axios.get("https://api.apexbee.in/api/admin/orders", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (data.success) {
        setOrders(data.orders);
        toast.success(`Loaded ${data.orders.length} orders`);
      } else {
        toast.error("No orders found");
        setOrders([]);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch orders");
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Order status badge display
  const getStatusBadge = (status: string, type: "delivery" | "payment" = "delivery") => {
    const deliveryConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Package },
      confirmed: { className: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle2 },
      processing: { className: "bg-purple-100 text-purple-800 border-purple-200", icon: Package },
      shipped: { className: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Truck },
      out_for_delivery: { className: "bg-orange-100 text-orange-800 border-orange-200", icon: Truck },
      delivered: { className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
      cancelled: { className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      returned: { className: "bg-gray-100 text-gray-800 border-gray-200", icon: RefreshCw },
    };

    const paymentConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      processing: { className: "bg-purple-100 text-purple-800 border-purple-200", icon: CreditCard },
      completed: { className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
      failed: { className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      refunded: { className: "bg-gray-100 text-gray-800 border-gray-200", icon: RefreshCw },
      partially_refunded: { className: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
      requires_verification: { className: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
    };

    const config = type === "delivery" ? deliveryConfig : paymentConfig;
    const { className, icon: Icon } = config[status as keyof typeof config] || { 
      className: "bg-gray-100 text-gray-800 border-gray-200", 
      icon: AlertCircle 
    };

    return (
      <Badge variant="outline" className={`${className} font-medium capitalize`}>
        <Icon className="h-3 w-3 mr-1" />
        {status ? status.replace(/_/g, ' ') : 'Unknown'}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Table columns
  const columns = [
    { 
      header: "Order ID", 
      accessor: (item: any) => (
        <div className="font-mono text-sm">{item.orderNumber || item._id?.slice(-8) || 'N/A'}</div>
      ) 
    },
    { 
      header: "Customer", 
      accessor: (item: any) => (
        <div>
          <div className="font-medium">{item.userDetails?.name || "Guest"}</div>
          <div className="text-xs text-muted-foreground">{item.userDetails?.email || 'No email'}</div>
        </div>
      ) 
    },
    { 
      header: "Amount", 
      accessor: (item: any) => (
        <div className="font-semibold">₹{item.orderSummary?.total?.toFixed(2) || '0.00'}</div>
      ) 
    },
    { 
      header: "Delivery Status", 
      accessor: (item: any) => getStatusBadge(item.orderStatus?.currentStatus || 'pending') 
    },
    { 
      header: "Payment Status", 
      accessor: (item: any) => getStatusBadge(item.paymentDetails?.status || 'pending', 'payment') 
    },
    { 
      header: "Payment Method", 
      accessor: (item: any) => (
        <Badge variant="secondary" className="capitalize">
          {item.paymentDetails?.method || 'N/A'}
        </Badge>
      ) 
    },
    {
      header: "Order Date",
      accessor: (item: any) => formatDate(item.createdAt)
    },
    {
      header: "Actions",
      accessor: (item: any) => (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setSelectedOrder(item)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  // Update delivery status
  const handleUpdateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(`delivery-${orderId}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const response = await fetch(`https://api.apexbee.in/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      if (data.success) {
        toast.success(data.message || `Status updated to ${newStatus}`);
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  orderStatus: { 
                    ...order.orderStatus, 
                    currentStatus: newStatus 
                  } 
                }
              : order
          )
        );

        // Update selected order if open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            orderStatus: {
              ...prev.orderStatus,
              currentStatus: newStatus
            }
          }));
        }
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Update delivery status error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Update payment status
  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(`payment-${orderId}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const response = await fetch(`https://api.apexbee.in/api/admin/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment status');
      }

      if (data.success) {
        toast.success(data.message || `Payment status updated to ${newStatus}`);
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  paymentDetails: { 
                    ...order.paymentDetails, 
                    status: newStatus 
                  } 
                }
              : order
          )
        );

        // Update selected order if open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            paymentDetails: {
              ...prev.paymentDetails,
              status: newStatus
            }
          }));
        }
      } else {
        toast.error(data.message || 'Failed to update payment status');
      }
    } catch (error: any) {
      console.error('Update payment status error:', error);
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // View payment proof
  const handleViewPaymentProof = () => {
    if (!selectedOrder?.paymentProof) {
      toast.info("No payment proof available");
      return;
    }

    let paymentProofUrl = selectedOrder.paymentProof;
    
    // If paymentProof is an object, extract URL
    if (typeof selectedOrder.paymentProof === 'object' && selectedOrder.paymentProof.url) {
      paymentProofUrl = selectedOrder.paymentProof.url;
    }
    
    // If it's a base64 string
    if (paymentProofUrl.startsWith('data:image')) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Payment Proof - ${selectedOrder.orderNumber}</title></head>
            <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
              <img src="${paymentProofUrl}" style="max-width:90%;max-height:90vh;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);" />
            </body>
          </html>
        `);
      }
    } else {
      // If it's a URL, open in new tab
      window.open(paymentProofUrl, '_blank');
    }
  };

  // Download invoice
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const response = await fetch(`https://api.apexbee.in/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download invoice');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `invoice-${orderId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully");
    } catch (error: any) {
      console.error('Download invoice error:', error);
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  // Get the loading state for specific order
  const isLoading = (orderId: string, type: 'delivery' | 'payment') => {
    return updatingStatus === `${type}-${orderId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">Manage customer orders and track status</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders Count Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.orderStatus?.currentStatus === 'pending').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To Ship</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['confirmed', 'processing'].includes(o.orderStatus?.currentStatus)).length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.orderStatus?.currentStatus === 'delivered').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        data={orders} 
        columns={columns} 
        searchKey="orderNumber" 
        loading={loading}
        emptyMessage="No orders found"
      />

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Details: {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Complete information about the order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm font-medium">{selectedOrder.userDetails?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-medium">{selectedOrder.userDetails?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Phone:</span>
                          <span className="text-sm font-medium">{selectedOrder.shippingAddress?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Order Date:</span>
                          <span className="text-sm font-medium">{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Invoice Number:</span>
                          <span className="text-sm font-medium font-mono">{selectedOrder.invoiceNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Order Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Subtotal:</span>
                          <span className="text-sm font-medium">₹{selectedOrder.orderSummary?.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Shipping:</span>
                          <span className="text-sm font-medium">₹{selectedOrder.orderSummary?.shipping?.toFixed(2) || '0.00'}</span>
                        </div>
                        {(selectedOrder.orderSummary?.discount || 0) > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-sm">Discount:</span>
                            <span className="text-sm font-medium">-₹{selectedOrder.orderSummary?.discount?.toFixed(2)}</span>
                          </div>
                        )}
                        {(selectedOrder.orderSummary?.tax || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tax:</span>
                            <span className="text-sm font-medium">₹{selectedOrder.orderSummary?.tax?.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Total Amount:</span>
                          <span>₹{selectedOrder.orderSummary?.total?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Delivery Status</h3>
                        {getStatusBadge(selectedOrder.orderStatus?.currentStatus || 'pending')}
                      </div>
                      <Select
                        value={selectedOrder.orderStatus?.currentStatus || 'pending'}
                        onValueChange={(value) => handleUpdateDeliveryStatus(selectedOrder._id, value)}
                        disabled={isLoading(selectedOrder._id, 'delivery')}
                      >
                        <SelectTrigger>
                          {isLoading(selectedOrder._id, 'delivery') ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Change delivery status" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Payment Status</h3>
                        {getStatusBadge(selectedOrder.paymentDetails?.status || 'pending', 'payment')}
                      </div>
                      <Select
                        value={selectedOrder.paymentDetails?.status || 'pending'}
                        onValueChange={(value) => handleUpdatePaymentStatus(selectedOrder._id, value)}
                        disabled={isLoading(selectedOrder._id, 'payment')}
                      >
                        <SelectTrigger>
                          {isLoading(selectedOrder._id, 'payment') ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Change payment status" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                          <SelectItem value="requires_verification">Requires Verification</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Order Items ({selectedOrder.orderItems?.length || 0})</h3>
                    <div className="space-y-3">
                      {selectedOrder.orderItems?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={item.image || "/placeholder.png"} 
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.png";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.name || 'Unnamed Product'}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Qty: {item.quantity || 1}</span>
                              {item.color && <span>• Color: {item.color}</span>}
                              {item.size && <span>• Size: {item.size}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">₹{item.price?.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shipping Tab */}
              <TabsContent value="shipping" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h3>
                    {selectedOrder.shippingAddress ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedOrder.shippingAddress.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedOrder.shippingAddress.phone}</span>
                        </div>
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="font-medium">{selectedOrder.shippingAddress.address}</p>
                          <p className="text-sm">
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                          </p>
                        </div>
                        
                        {selectedOrder.deliveryDetails && (
                          <>
                            <Separator />
                            <h4 className="font-semibold mt-4">Delivery Information</h4>
                            {selectedOrder.deliveryDetails.trackingNumber && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Tracking Number:</span>
                                <span className="text-sm font-medium font-mono">{selectedOrder.deliveryDetails.trackingNumber}</span>
                              </div>
                            )}
                            {selectedOrder.deliveryDetails.carrier && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Carrier:</span>
                                <span className="text-sm font-medium">{selectedOrder.deliveryDetails.carrier}</span>
                              </div>
                            )}
                            {selectedOrder.deliveryDetails.estimatedDelivery && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Estimated Delivery:</span>
                                <span className="text-sm font-medium">{formatDate(selectedOrder.deliveryDetails.estimatedDelivery)}</span>
                              </div>
                            )}
                            {selectedOrder.deliveryDetails.actualDelivery && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Delivered On:</span>
                                <span className="text-sm font-medium">{formatDate(selectedOrder.deliveryDetails.actualDelivery)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No shipping address provided</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium capitalize">{selectedOrder.paymentDetails?.method || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">₹{selectedOrder.paymentDetails?.amount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Transaction ID</p>
                          <p className="font-mono text-sm truncate">{selectedOrder.paymentDetails?.transactionId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Date</p>
                          <p className="text-sm font-medium">
                            {selectedOrder.paymentDetails?.paymentDate 
                              ? formatDate(selectedOrder.paymentDetails.paymentDate) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.paymentDetails?.upiId && (
                        <div>
                          <p className="text-sm text-muted-foreground">UPI ID</p>
                          <p className="font-mono text-sm">{selectedOrder.paymentDetails.upiId}</p>
                        </div>
                      )}

                      {/* Payment Proof Section */}
                      {selectedOrder.paymentProof && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Payment Proof</h4>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleViewPaymentProof}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Proof
                            </Button>
                          </div>
                          
                          {/* Show payment proof image if available */}
                          {selectedOrder.paymentProof && 
                           (typeof selectedOrder.paymentProof === 'string' && 
                            selectedOrder.paymentProof.startsWith('data:image')) && (
                            <div className="mt-2 flex justify-center">
                              <img 
                                src={selectedOrder.paymentProof} 
                                alt="Payment Proof"
                                className="max-w-full h-auto max-h-48 rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={handleViewPaymentProof}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => handleDownloadInvoice(selectedOrder?._id)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;