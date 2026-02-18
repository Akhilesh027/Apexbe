// src/pages/MyOrders.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  MapPin,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * ✅ FULL UPDATED FRONTEND (MyOrders)
 * - Fetch orders
 * - View details dialog
 * - If delivered => show "Write Review" per product
 * - If already reviewed => show "Reviewed ✅" + "View Review"
 * - Review dialog auto-fills existing review (read-only by default)
 * - Submits review with: orderId + productId + userId + rating + title + comment
 *
 * ✅ Backend required:
 * GET  /api/reviews/order/:orderId/user/:userId   -> { success, reviews: [] }
 * POST /api/reviews                             -> { success, review }
 */

const API_BASE = "https://api.apexbee.in/api";

type OrderItem = {
  _id?: string;
  productId: any; // string OR populated object { _id, itemName }
  name: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice: number;
  itemTotal: number;
  color?: string;
  size?: string;
};

type Order = {
  _id: string;
  orderNumber: string;
  createdAt: string;
  orderItems: OrderItem[];
  orderSummary?: {
    total?: number;
    subtotal?: number;
    shipping?: number;
    discount?: number;
    itemsCount?: number;
  };
  orderStatus?: {
    currentStatus?: string;
    timeline?: {
      _id?: string;
      status: string;
      timestamp: string;
      description?: string;
    }[];
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  paymentDetails?: {
    method?: string;
    status?: string;
    amount?: number;
    transactionId?: string;
  };
  deliveryDetails?: {
    expectedDelivery?: string;
    shippingMethod?: string;
  };
  metadata?: {
    source?: string;
  };
};

type Review = {
  _id: string;
  orderId: string;
  productId: any; // string or populated
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
};

const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ✅ Reviews map for current order: productId -> review
  const [reviewByProductId, setReviewByProductId] = useState<Record<string, Review>>({});

  // ✅ Review modal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProduct, setReviewProduct] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuth = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    return { user, token };
  };

  const normalizeId = (v: any) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return String(v._id || v.id || "");
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const { user, token } = getAuth();
      if (!user || !token) {
        navigate("/login");
        return;
      }

      const userId = user._id || user.id;

      const response = await fetch(`${API_BASE}/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to fetch orders");

      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (e: any) {
      console.error("Error fetching orders:", e);
      setError(e?.message || "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadReviewedForOrder = async (orderId: string) => {
    try {
      const { user, token } = getAuth();
      if (!user || !token) return;

      const userId = user._id || user.id;

      const res = await fetch(`${API_BASE}/reviews/order/${orderId}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      const map: Record<string, Review> = {};
      (json?.reviews || []).forEach((r: Review) => {
        const pid = normalizeId(r.productId);
        if (pid) map[pid] = r;
      });

      setReviewByProductId(map);
    } catch (e) {
      console.error("loadReviewedForOrder:", e);
      setReviewByProductId({});
    }
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
    await loadReviewedForOrder(order._id);
  };

  const openReview = async (order: Order, item: OrderItem) => {
    await loadReviewedForOrder(order._id);

    const pid = normalizeId(item.productId);
    const existing = reviewByProductId[pid];

    setReviewOrder(order);
    setReviewProduct(item);

    if (existing) {
      setReviewRating(existing.rating || 5);
      setReviewTitle(existing.title || "");
      setReviewComment(existing.comment || "");
    } else {
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
    }

    setReviewOpen(true);
  };

  const submitReview = async () => {
    try {
      if (!reviewOrder || !reviewProduct) return;

      const pid = normalizeId(reviewProduct.productId);
      const existing = reviewByProductId[pid];
      if (existing) {
        alert("You already submitted a review for this product.");
        return;
      }

      setReviewLoading(true);

      const { user, token } = getAuth();
      if (!user || !token) {
        navigate("/login");
        return;
      }

      const userId = user._id || user.id;

      const payload = {
        orderId: reviewOrder._id,
        productId: pid, // ✅ always string
        userId,
        rating: Number(reviewRating),
        title: reviewTitle?.trim() || "",
        comment: reviewComment?.trim() || "",
      };

      const res = await fetch(`${API_BASE}/product/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to submit review");

      // ✅ update map instantly so UI shows reviewed
      setReviewByProductId((prev) => ({
        ...prev,
        [pid]: json.review,
      }));

      setReviewOpen(false);
      setReviewOrder(null);
      setReviewProduct(null);
    } catch (e: any) {
      alert(e?.message || "Review submit failed");
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusConfig = (status?: string) => {
    const statusConfig: any = {
      pending: { icon: Clock, color: "text-orange-500", label: "Pending", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
      confirmed: { icon: CheckCircle, color: "text-blue-500", label: "Confirmed", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
      processing: { icon: Package, color: "text-purple-500", label: "Processing", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
      shipped: { icon: Truck, color: "text-indigo-500", label: "Shipped", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
      delivered: { icon: CheckCircle, color: "text-green-600", label: "Delivered", bgColor: "bg-green-50", borderColor: "border-green-200" },
      cancelled: { icon: AlertCircle, color: "text-red-500", label: "Cancelled", bgColor: "bg-red-50", borderColor: "border-red-200" },
      refunded: { icon: AlertCircle, color: "text-gray-500", label: "Refunded", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
      payment_pending: { icon: Clock, color: "text-orange-500", label: "Payment Pending", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
      payment_verified: { icon: CheckCircle, color: "text-green-600", label: "Payment Verified", bgColor: "bg-green-50", borderColor: "border-green-200" },
      payment_failed: { icon: AlertCircle, color: "text-red-500", label: "Payment Failed", bgColor: "bg-red-50", borderColor: "border-red-200" },
    };

    return (
      statusConfig[status || ""] || {
        icon: Package,
        color: "text-gray-500",
        label: status || "Unknown",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      }
    );
  };

  const formatCurrency = (amount: any) => {
    const v = typeof amount === "number" && !Number.isNaN(amount) ? amount : Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method?: string) => {
    const methods: any = {
      upi: "UPI",
      card: "Credit/Debit Card",
      netbanking: "Net Banking",
      scan: "Scan & Pay",
      cod: "Cash on Delivery",
      wallet: "Wallet",
      bank_transfer: "Bank Transfer",
    };
    return methods[method || ""] || method || "-";
  };

  const canReviewOrder = (order: Order) => order?.orderStatus?.currentStatus === "delivered";

  const existingReview =
    reviewProduct ? reviewByProductId[normalizeId(reviewProduct.productId)] : null;

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
            <Button onClick={fetchOrders} className="bg-navy hover:bg-navy/90 text-white">
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
            <Button onClick={() => navigate("/products")} className="bg-navy hover:bg-navy/90 text-white">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.orderStatus?.currentStatus);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={order._id} className={`bg-white rounded-lg shadow-sm overflow-hidden border ${statusConfig.borderColor}`}>
                  <div className={`${statusConfig.bgColor} p-4 flex justify-between items-center`}>
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                      <span className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {(order.orderItems || []).slice(0, 2).map((item, idx) => {
                      const pid = normalizeId(item.productId);
                      const reviewed = !!reviewByProductId[pid];

                      return (
                        <div key={item._id || `${order._id}-${idx}`} className="flex gap-4">
                          <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-navy">{item.name}</h3>

                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              {item.color && item.color !== "default" && (
                                <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                              )}
                              {item.size && item.size !== "One Size" && (
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

                            {canReviewOrder(order) && (
                              <div className="mt-2">
                                {!reviewed ? (
                                  <Button variant="outline" size="sm" onClick={() => openReview(order, item)}>
                                    Write Review
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 font-medium">Reviewed ✅</span>
                                    <Button variant="outline" size="sm" onClick={() => openReview(order, item)}>
                                      View Review
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {order.orderItems && order.orderItems.length > 2 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">+{order.orderItems.length - 2} more items</p>
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
                        <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => handleViewDetails(order)}>
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

      {/* ✅ ORDER DETAILS DIALOG */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details - {selectedOrder?.orderNumber}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" /> Order Status
                </h3>

                <div className="space-y-3">
                  {(selectedOrder.orderStatus?.timeline || []).map((t, index) => (
                    <div key={t._id || index} className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${
                          index === (selectedOrder.orderStatus?.timeline?.length || 0) - 1 ? "bg-green-500" : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{t.status}</p>
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                <div className="space-y-4">
                  {(selectedOrder.orderItems || []).map((item, idx) => {
                    const pid = normalizeId(item.productId);
                    const reviewed = !!reviewByProductId[pid];

                    return (
                      <div key={item._id || `${selectedOrder._id}-${idx}`} className="flex gap-4 p-3 border rounded-lg">
                        <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>

                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            {item.color && item.color !== "default" && <span>Color: {item.color}</span>}
                            {item.size && item.size !== "One Size" && <span>Size: {item.size}</span>}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold">{formatCurrency(item.price)}</span>
                            {item.originalPrice > item.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatCurrency(item.originalPrice)}
                              </span>
                            )}
                            <span className="ml-auto font-semibold">{formatCurrency(item.itemTotal)}</span>
                          </div>

                          {canReviewOrder(selectedOrder) && (
                            <div className="mt-2">
                              {!reviewed ? (
                                <Button variant="outline" size="sm" onClick={() => openReview(selectedOrder, item)}>
                                  Write Review
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-green-600 font-medium">Reviewed ✅</span>
                                  <Button variant="outline" size="sm" onClick={() => openReview(selectedOrder, item)}>
                                    View Review
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Shipping Address
                  </h3>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress?.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Phone: {selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Payment Information
                    </h3>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium capitalize">{getPaymentMethodLabel(selectedOrder.paymentDetails?.method)}</p>
                      <p className="text-sm text-muted-foreground capitalize">Status: {selectedOrder.paymentDetails?.status}</p>
                      <p className="text-sm text-muted-foreground">Amount: {formatCurrency(selectedOrder.paymentDetails?.amount || 0)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Delivery Information
                    </h3>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Expected Delivery: {formatDate(selectedOrder.deliveryDetails?.expectedDelivery)}</p>
                      <p className="text-sm text-muted-foreground">Method: {selectedOrder.deliveryDetails?.shippingMethod || "Standard"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({selectedOrder.orderSummary?.itemsCount || selectedOrder.orderItems?.length || 0} items):</span>
                    <span>{formatCurrency(selectedOrder.orderSummary?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className={selectedOrder.orderSummary?.shipping === 0 ? "text-green-600" : ""}>
                      {selectedOrder.orderSummary?.shipping === 0 ? "Free" : formatCurrency(selectedOrder.orderSummary?.shipping || 0)}
                    </span>
                  </div>
                  {(selectedOrder.orderSummary?.discount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="text-green-600">-{formatCurrency(selectedOrder.orderSummary?.discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.orderSummary?.total || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Order placed on: {formatDateTime(selectedOrder.createdAt)}</p>
                <p>Source: {selectedOrder.metadata?.source === "buy_now" ? "Buy Now" : "Shopping Cart"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ REVIEW DIALOG */}
      <Dialog
        open={reviewOpen}
        onOpenChange={(v) => {
          setReviewOpen(v);
          if (!v) {
            setReviewOrder(null);
            setReviewProduct(null);
            setReviewTitle("");
            setReviewComment("");
            setReviewRating(5);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {existingReview ? "Your Review" : "Write Review"} - {reviewProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {existingReview && (
              <div className="text-xs text-muted-foreground">
                Submitted on: {existingReview.createdAt ? formatDateTime(existingReview.createdAt) : "-"}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Rating (1-5)</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                disabled={!!existingReview}
                className="mt-1 w-full border rounded-md px-3 py-2 bg-white disabled:opacity-70"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Title (optional)</label>
              <input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                disabled={!!existingReview}
                className="mt-1 w-full border rounded-md px-3 py-2 disabled:opacity-70"
                placeholder="Great quality!"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Comment</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                disabled={!!existingReview}
                className="mt-1 w-full border rounded-md px-3 py-2 min-h-[110px] disabled:opacity-70"
                placeholder="Write your experience..."
              />
            </div>

            {existingReview ? (
              <Button className="w-full" variant="outline" onClick={() => setReviewOpen(false)}>
                Close
              </Button>
            ) : (
              <Button
                className="w-full bg-navy hover:bg-navy/90 text-white"
                onClick={submitReview}
                disabled={reviewLoading || !reviewOrder || !reviewProduct}
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyOrders;
