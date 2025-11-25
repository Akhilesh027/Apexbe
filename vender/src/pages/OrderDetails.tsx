import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Eye, Loader2, User, Mail, Phone, MapPin } from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [showScreenshot, setShowScreenshot] = useState(false);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id || !token) return;

      try {
        const res = await axios.get(`https://api.apexbee.in/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          const orderData = res.data.order;
          setOrder(orderData);
          setOrderStatus(orderData.orderStatus?.currentStatus || "pending");
        } else {
          toast.error(res.data.message || "Failed to fetch order details.");
        }
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        if (err.response?.status === 403) {
          toast.error("You don't have permission to view this order.");
          navigate("/orders");
        } else {
          toast.error("Server error while fetching order details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, token, navigate]);

  const handleStatusUpdate = async () => {
    if (!token) {
      toast.error("Please login to update order status.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `https://api.apexbee.in/api/orders/${id}/status`,
        { status: orderStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Order status updated to ${orderStatus}`);
        // Update local order state
        setOrder(res.data.order);
      } else {
        toast.error(res.data.message || "Failed to update status.");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      if (err.response?.status === 403) {
        toast.error("You don't have permission to update this order.");
      } else {
        toast.error("Server error while updating status.");
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const verifyUPIPayment = async (action: 'approve' | 'reject') => {
    if (!token) {
      toast.error("Please login to verify payments.");
      return;
    }

    if (action === 'reject' && !verificationNotes.trim()) {
      toast.error("Please provide notes for rejection.");
      return;
    }

    setVerifyingPayment(true);
    try {
      const res = await axios.put(
        `https://api.apexbee.in/api/orders/${id}/verify-payment`,
        { 
          action,
          notes: verificationNotes 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        toast.success(`UPI payment ${actionText} successfully`);
        
        // Update local order state
        setOrder(res.data.order);
        setOrderStatus(res.data.order.orderStatus?.currentStatus || "pending");
        setVerificationNotes("");
      } else {
        toast.error(res.data.message || `Failed to ${action} payment.`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing payment:`, err);
      if (err.response?.status === 403) {
        toast.error("Only admins can verify payments.");
      } else if (err.response?.status === 400) {
        toast.error(err.response.data.message);
      } else {
        toast.error(`Server error while ${action}ing payment.`);
      }
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: any = {
      'pending': { color: 'bg-yellow-500', label: 'PENDING' },
      'completed': { color: 'bg-green-600', label: 'COMPLETED' },
      'failed': { color: 'bg-red-600', label: 'FAILED' },
      'pending_verification': { color: 'bg-orange-500', label: 'PENDING VERIFICATION' },
      'verified': { color: 'bg-green-600', label: 'VERIFIED' },
      'rejected': { color: 'bg-red-600', label: 'REJECTED' },
      'refunded': { color: 'bg-purple-600', label: 'REFUNDED' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-500', label: status.toUpperCase() };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: any = {
      'pending': { color: 'bg-yellow-500' },
      'confirmed': { color: 'bg-blue-500' },
      'processing': { color: 'bg-orange-500' },
      'shipped': { color: 'bg-purple-500' },
      'delivered': { color: 'bg-green-600' },
      'cancelled': { color: 'bg-red-600' },
      'refunded': { color: 'bg-purple-600' },
      'payment_pending': { color: 'bg-orange-500' },
      'payment_verified': { color: 'bg-green-600' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-500' };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading order details...</span>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Order not found or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/orders")} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isUPIPayment = order.paymentDetails?.method === 'upi';
  const requiresVerification = order.paymentDetails?.status === 'pending_verification';
  const upiDetails = order.paymentDetails?.upiDetails;
  const paymentProof = order.paymentDetails?.paymentProof;
  const isAdmin = user.role === 'admin';
  const isVendor = user.role === 'vendor';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground mt-1">Order #{order.orderNumber}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Placed</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.paymentDetails?.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <div className="mt-1">
                    {getOrderStatusBadge(orderStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold capitalize">{order.paymentDetails?.method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(order.orderSummary?.total)}</p>
                </div>
              </div>
            </Card>

            {/* UPI Payment Details */}
            {isUPIPayment && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">UPI Payment Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">UPI ID</p>
                      <p className="font-semibold font-mono text-sm">{upiDetails?.upiId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-semibold font-mono text-sm">{upiDetails?.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verification Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentStatusBadge(order.paymentDetails?.status)}
                        {upiDetails?.verified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uploaded At</p>
                      <p className="font-semibold text-sm">
                        {upiDetails?.uploadedAt ? new Date(upiDetails.uploadedAt).toLocaleString('en-IN') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  {(paymentProof?.url || upiDetails?.screenshot) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="relative group">
                          <img
                            src={paymentProof?.url || upiDetails?.screenshot}
                            alt="Payment Screenshot"
                            className="w-32 h-32 object-cover rounded-lg border cursor-pointer"
                            onClick={() => setShowScreenshot(true)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowScreenshot(true)}
                          className="self-start"
                        >
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verification Notes */}
                  {upiDetails?.verificationNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Verification Notes</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{upiDetails.verificationNotes}</p>
                    </div>
                  )}

                  {/* Payment Verification Actions - Only for Admins */}
                  {requiresVerification && isAdmin && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-3">Verify Payment</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="verification-notes">Verification Notes</Label>
                          <Textarea
                            id="verification-notes"
                            placeholder="Add notes for verification (required for rejection)"
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => verifyUPIPayment('approve')}
                            disabled={verifyingPayment}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {verifyingPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve Payment
                          </Button>
                          <Button
                            onClick={() => verifyUPIPayment('reject')}
                            disabled={verifyingPayment || !verificationNotes.trim()}
                            variant="destructive"
                            className="flex-1"
                          >
                            {verifyingPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject Payment
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item: any) => (
                  <div key={item._id} className="flex gap-4 pb-4 border-b last:border-0">
                    <img
                      src={item.image || item.productId?.images?.[0] || "/placeholder.png"}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      {(item.color || item.size) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.color && `Color: ${item.color}`}
                          {item.color && item.size && ' • '}
                          {item.size && `Size: ${item.size}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">{formatCurrency(item.itemTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(order.orderSummary?.subtotal)}</span>
                  </div>
                  {order.orderSummary?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.orderSummary?.discount)}</span>
                    </div>
                  )}
                  {order.orderSummary?.shipping > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.orderSummary?.shipping)}</span>
                    </div>
                  )}
                  {order.orderSummary?.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(order.orderSummary?.tax)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(order.orderSummary?.total)}</span>
                </div>
              </div>
            </Card>

            {/* Update Status - For Vendors and Admins */}
            {(isVendor || isAdmin) && (
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleStatusUpdate} 
                    className="w-full"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Customer Info & Timeline */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{order.userDetails?.name || order.userId?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-sm">{order.userDetails?.email || order.userId?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{order.userDetails?.phone || order.shippingAddress?.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-semibold text-sm">
                      {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Timeline */}
            {order.orderStatus?.timeline && order.orderStatus.timeline.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Timeline</h2>
                <div className="space-y-3">
                  {order.orderStatus.timeline
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((event: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {index < order.orderStatus.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium capitalize text-sm">{event.status.replace('_', ' ')}</p>
                            {event.updatedBy && (
                              <Badge variant="outline" className="text-xs">
                                {event.updatedBy}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Screenshot Modal */}
        {showScreenshot && (paymentProof?.url || upiDetails?.screenshot) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Screenshot</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowScreenshot(false)}>
                  ✕
                </Button>
              </div>
              <div className="p-4 flex justify-center">
                <img
                  src={paymentProof?.url || upiDetails?.screenshot}
                  alt="Payment Screenshot Full Size"
                  className="max-w-full max-h-[80vh] object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrderDetails;