import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Edit, QrCode, Copy, Check, Loader2, Upload, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import upi from "../Web images/Web images/upi.jpg";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // User addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
    isDefault: false,
  });

  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // UPI Payment States
  const [showUPIDialog, setShowUPIDialog] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Payment Proof Upload States
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cart and order details
  const cartData = location.state || {};
  const [orderDetails, setOrderDetails] = useState({
    items: cartData.cartItems || [],
    subtotal: cartData.subtotal || 0,
    discount: cartData.discount || 0,
    shipping: cartData.shipping || 0,
    total: cartData.total || 0,
  });

  // UPI Configuration
  const upiConfig = {
    upiId: "9177176969-2@ybl",
    qrCodeUrl: upi,
    merchantName: "ApexBee Store",
    amount: orderDetails.total,
  };

  // File validation
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, GIF, WEBP, or PDF files only",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setPaymentProof(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPaymentProofPreview(null);
    }
  };

  // Remove uploaded file
  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    // Reset file input
    const fileInput = document.getElementById('payment-proof-upload');
    if (fileInput) fileInput.value = "";
  };

  // Upload payment proof to backend
  const uploadPaymentProof = async (file, transactionId) => {
    const formData = new FormData();
    formData.append('paymentProof', file);
    formData.append('transactionId', transactionId);
    formData.append('upiId', upiConfig.upiId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.apexbee.in/api/upload/payment-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const data = await response.json();
      return data.fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartData.cartItems || cartData.cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Redirecting to cart...",
        variant: "destructive",
      });
      navigate("/cart");
    }
  }, [cartData, navigate, toast]);

  // Load addresses and wallet balance
  useEffect(() => {
    loadAddresses();
    loadWalletBalance();
  }, []);

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(
        `https://api.apexbee.in/api/user/address/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;

      const data = await res.json();
      setAddresses(data.addresses || []);
      const defaultAddr =
        data.addresses?.find((a) => a.isDefault) || data.addresses?.[0] || null;
      setSelectedAddress(defaultAddr);
    } catch (err) {
      console.error("Load addresses error:", err);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(
        `https://api.apexbee.in/api/user/wallet/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;

      const data = await res.json();
      setWalletBalance(data.walletBalance || 0);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    }
  };

  const isAddressFormValid = () =>
    addressForm.name.trim() &&
    addressForm.phone.trim().length >= 10 &&
    addressForm.pincode.trim().length === 6 &&
    addressForm.address.trim() &&
    addressForm.city.trim() &&
    addressForm.state.trim();

  const handleAddOrEditAddress = async () => {
    if (!isAddressFormValid()) return;
    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      if (!user || !token) {
        toast({
          title: "Login required",
          description: "Please login",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const payload = {
        ...addressForm,
        id: editingAddress?.id,
        userId: user.id,
      };
      const res = await fetch("https://api.apexbee.in/api/user/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save address");

      await loadAddresses();
      if (!selectedAddress || addressForm.isDefault)
        setSelectedAddress(result.address);

      setShowAddressDialog(false);
      setAddressForm({
        name: "",
        phone: "",
        pincode: "",
        address: "",
        city: "",
        state: "",
        isDefault: false,
      });
      setEditingAddress(null);

      toast({
        title: "Success",
        description: editingAddress ? "Address updated" : "Address added",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyUPIId = async () => {
    try {
      await navigator.clipboard.writeText(upiConfig.upiId);
      setCopiedUPI(true);
      toast({
        title: "Copied!",
        description: "UPI ID copied to clipboard",
      });
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

const handlePlaceOrder = async (paymentMethod = selectedPayment) => {
  if (!selectedAddress) {
    toast({
      title: "Address required",
      description: "Please select a delivery address",
      variant: "destructive",
    });
    return;
  }

  const calculatedSubtotal = orderDetails.items.reduce((acc, item) => {
    const price = item.price || item.afterDiscount || 0;
    const quantity = item.quantity || 1;
    return acc + price * quantity;
  }, 0);

  const calculatedTotal =
    calculatedSubtotal +
    (orderDetails.shipping || 0) -
    (orderDetails.discount || 0);

  if (paymentMethod === "wallet" && walletBalance < calculatedTotal) {
    toast({
      title: "Insufficient Wallet",
      description: `Wallet balance ₹${walletBalance.toFixed(
        2
      )} is not enough`,
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Please login again",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Item mapping with all required fields
    const mappedItems = orderDetails.items.map((item) => {
      const price = item.price !== undefined
        ? item.price
        : item.afterDiscount !== undefined
        ? item.afterDiscount
        : 0;

      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;

      return {
        productId: item.productId || item._id || item.id,
        name: item.itemName || item.name || "Unnamed Product",
        price: Number(price),
        originalPrice: Number(item.originalPrice || price), // Add originalPrice
        image: item.images?.[0] || item.image || "/placeholder.png",
        quantity: Number(quantity),
        color: item.selectedColor || item.color || "default",
        size: item.size || "One Size",
        vendorId: item.vendorId || null,
        itemTotal: Number(itemTotal) // Add itemTotal
      };
    });

    const finalSubtotal = mappedItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const finalTotal = Math.max(
      0,
      finalSubtotal +
        (orderDetails.shipping || 0) -
        (orderDetails.discount || 0)
    );

    // Prepare UPI payment details with proof
    let upiDetails = null;
    if (paymentMethod === 'upi') {
      upiDetails = {
        upiId: upiConfig.upiId,
        transactionId: upiTransactionId || `UPI_${Date.now()}`,
        paymentProof: null // Will be added after Cloudinary upload
      };
    }

    // Order data
    const orderData = {
      userId: user.id,
      userDetails: {
        userId: user.id,
        name: user.name || user.username,
        email: user.email,
        phone: selectedAddress.phone,
      },
      shippingAddress: selectedAddress,

      paymentDetails: {
        method: paymentMethod,
        amount: finalTotal,
        status: paymentMethod === 'upi' ? 'pending_verification' : 'completed',
        transactionId: paymentMethod === 'wallet' 
          ? `WALLET_${Date.now()}` 
          : upiTransactionId || `TXN_${Date.now()}`,
        upiDetails: upiDetails,
      },

      orderItems: mappedItems,

      orderSummary: {
        itemsCount: mappedItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: finalSubtotal,
        shipping: orderDetails.shipping || 0,
        discount: orderDetails.discount || 0,
        total: finalTotal,
        tax: 0,
        grandTotal: finalTotal,
      },

      status: paymentMethod === 'upi' ? 'payment_pending' : 'confirmed',
    };

    console.log("Sending order data with items:", mappedItems);

    let response;
    if (paymentMethod === 'upi' && paymentProof) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('orderData', JSON.stringify(orderData));
      formData.append('paymentProof', paymentProof);
      formData.append('transactionId', upiTransactionId);

      response = await fetch("https://api.apexbee.in/api/orders/with-proof", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      // Regular JSON request for wallet payments
      response = await fetch("https://api.apexbee.in/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Order failed");
    }

    if (result.success) {
      // Clear cart
      localStorage.removeItem("cart");

      // Reset states
      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setShowUPIDialog(false);

      // Success message
      let successMessage = "";
      if (paymentMethod === 'upi') {
        successMessage = "Order placed successfully! Payment proof uploaded. Our team will verify your payment shortly.";
      } else {
        successMessage = "Order placed successfully!";
      }

      toast({
        title: "Success!",
        description: successMessage,
        variant: "default",
      });

      // Navigate to success page
      navigate("/order-success", {
        state: {
          orderId: result.order?._id || result.order?.orderNumber,
          paymentMethod: paymentMethod,
          requiresVerification: paymentMethod === 'upi',
          paymentProofUploaded: paymentMethod === 'upi' && paymentProof !== null,
        },
      });
    } else {
      throw new Error(result.message || "Order creation failed");
    }
  } catch (err) {
    console.error("Order error:", err);
    toast({
      title: "Order Failed",
      description: err.message || "Failed to place order",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
    setIsUploading(false);
  }
};


  const handleUPIPayment = async () => {
    // Validation
    if (!upiTransactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter UPI transaction ID to continue",
        variant: "destructive",
      });
      return;
    }

    if (!paymentProof) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload payment screenshot before proceeding",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingUPI(true);
    setIsUploading(true);
    
    try {
      // Place order with UPI payment
      await handlePlaceOrder("upi");
    } catch (error) {
      console.error("UPI payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process UPI payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessingUPI(false);
      setIsUploading(false);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({ ...addr });
    setShowAddressDialog(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: "",
      phone: "",
      pincode: "",
      address: "",
      city: "",
      state: "",
      isDefault: addresses.length === 0,
    });
    setShowAddressDialog(true);
  };

  const formatAddress = (addr) =>
    addr
      ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`
      : "";

  const handlePaymentSelection = (method) => {
    setSelectedPayment(method);
    if (method === "upi") {
      setShowUPIDialog(true);
    }
  };

  // Calculate real-time totals
  useEffect(() => {
    const calculatedSubtotal = orderDetails.items.reduce((acc, item) => {
      const price = item.price || item.afterDiscount || 0;
      const quantity = item.quantity || 1;
      return acc + price * quantity;
    }, 0);

    const calculatedTotal =
      calculatedSubtotal +
      (orderDetails.shipping || 0) -
      (orderDetails.discount || 0);

    setOrderDetails((prev) => ({
      ...prev,
      subtotal: calculatedSubtotal,
      total: calculatedTotal,
    }));
  }, [orderDetails.items, orderDetails.shipping, orderDetails.discount]);

  // Reset UPI dialog when closed
  useEffect(() => {
    if (!showUPIDialog) {
      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
    }
  }, [showUPIDialog]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          Checkout
        </h1>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left: Address & Payment */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">Delivery Address</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNewAddress}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No addresses saved yet
                  </p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`border p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedAddress?._id === addr._id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {addr.name}{" "}
                            {addr.isDefault && (
                              <span className="text-xs bg-primary text-white px-2 py-1 rounded ml-2">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {formatAddress(addr)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {addr.phone}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(addr);
                          }}
                          className="flex-shrink-0"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <RadioGroup
                value={selectedPayment}
                onValueChange={handlePaymentSelection}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem
                    value="wallet"
                    id="wallet"
                    disabled={walletBalance < orderDetails.total}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label
                    htmlFor="wallet"
                    className="cursor-pointer flex items-center gap-2 text-sm sm:text-base"
                  >
                    Wallet
                    {walletBalance < orderDetails.total ? (
                      <span className="text-red-500 text-xs">
                        (₹{walletBalance.toFixed(2)} insufficient)
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs">
                        (₹{walletBalance.toFixed(2)})
                      </span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem
                    value="upi"
                    id="upi"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label
                    htmlFor="upi"
                    className="cursor-pointer font-medium flex items-center gap-2 text-sm sm:text-base"
                  >
                    <QrCode className="h-4 w-4" />
                    UPI Payment
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4 sm:p-6 sticky top-4">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg mb-3 sm:mb-4">
                  Product Details
                </h3>
                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                  {orderDetails.items.map((item, index) => {
                    const price = item.price || item.afterDiscount || 0;
                    const quantity = item.quantity || 1;
                    const itemTotal = price * quantity;

                    return (
                      <div
                        key={item._id || item.productId || index}
                        className="bg-white rounded-lg border p-3 sm:p-4"
                      >
                        <div className="flex gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                            <img
                              src={
                                item.images?.[0] ||
                                item.image ||
                                "/placeholder.png"
                              }
                              alt={item.itemName || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                              {item.itemName || item.name}
                            </h4>
                            <div className="flex flex-wrap gap-1 sm:gap-2 text-muted-foreground text-xs mb-1">
                              <span>Qty: {quantity}</span>
                              {item.selectedColor && (
                                <span>• Color: {item.selectedColor}</span>
                              )}
                              {item.size && <span>• Size: {item.size}</span>}
                            </div>
                            <p className="font-semibold text-sm">
                              ₹{itemTotal.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₹{price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                </div>

                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Discount</span>
                    <span>-₹{orderDetails.discount.toFixed(2)}</span>
                </div>
                )}

                <div className="flex justify-between text-sm sm:text-base">
                  <span>Shipping</span>
                  <span>₹{orderDetails.shipping.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold text-base sm:text-lg border-t pt-2 sm:pt-3">
                  <span>Total</span>
                  <span>₹{orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 sm:mt-6 text-sm sm:text-base py-2.5 sm:py-3"
                onClick={() => {
                  if (selectedPayment === "upi") {
                    setShowUPIDialog(true);
                  } else {
                    handlePlaceOrder();
                  }
                }}
                disabled={isLoading || !selectedAddress}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              {!selectedAddress && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Please select a delivery address
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>Enter your address details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
            <Input
              placeholder="Full Name"
              value={addressForm.name}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
            <Input
              placeholder="Phone"
              value={addressForm.phone}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
            <Input
              placeholder="Pincode"
              value={addressForm.pincode}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
            <Textarea
              placeholder="Address"
              value={addressForm.address}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, address: e.target.value }))
              }
              className="text-sm sm:text-base min-h-[80px]"
            />
            <Input
              placeholder="City"
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, city: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
            <Input
              placeholder="State"
              value={addressForm.state}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, state: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!isAddressFormValid() || isLoading}
              onClick={handleAddOrEditAddress}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Dialog */}
      <Dialog open={showUPIDialog} onOpenChange={setShowUPIDialog}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              UPI Payment
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Complete your payment and upload screenshot for verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            {/* Step 1: Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Step 1: Make Payment</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</div>
                  </div>
                  <p className="text-sm text-blue-700">
                    Scan the QR code below or use UPI ID to make payment of ₹{orderDetails.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</div>
                  </div>
                  <p className="text-sm text-blue-700">
                    After successful payment, note down the <strong>transaction ID/reference number</strong> from your UPI app
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</div>
                  </div>
                  <p className="text-sm text-blue-700">
                    Take a <strong>screenshot</strong> of the payment confirmation screen
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code and UPI ID Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-3 sm:p-4 rounded-lg border inline-block max-w-full">
                  <img
                    src={upiConfig.qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-36 h-36 sm:w-44 sm:h-44 mx-auto"
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Scan QR code with any UPI app
                </p>
              </div>

              {/* UPI ID */}
              <div className="text-center">
                <Label className="text-sm sm:text-base font-medium mb-2 block">
                  Or use UPI ID
                </Label>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border border-primary/20">
                  <p className="font-mono text-base sm:text-lg font-bold break-all">
                    {upiConfig.upiId}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs sm:text-sm"
                    onClick={copyUPIId}
                  >
                    {copiedUPI ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    )}
                    {copiedUPI ? "Copied!" : "Copy UPI ID"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Merchant: <strong>{upiConfig.merchantName}</strong></p>
                  <p>Amount: <strong>₹{orderDetails.total.toFixed(2)}</strong></p>
                </div>
              </div>
            </div>

            {/* Step 2: Transaction ID */}
            <div className="space-y-2">
              <Label
                htmlFor="transaction-id"
                className="text-sm sm:text-base font-medium"
              >
                Step 2: Enter Transaction ID *
              </Label>
              <Input
                id="transaction-id"
                placeholder="Enter UPI transaction reference number"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your UPI app after payment (usually starts with TXN, REF, or similar)
              </p>
            </div>

            {/* Step 3: Upload Payment Proof */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">
                Step 3: Upload Payment Screenshot *
              </Label>
              
              {paymentProof ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">File uploaded successfully</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePaymentProof}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {paymentProofPreview ? (
                      <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-100 flex-shrink-0">
                        <span className="text-xs font-medium">PDF</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{paymentProof.name}</p>
                      <p className="text-xs text-gray-500">
                        {(paymentProof.size / 1024).toFixed(2)} KB • {paymentProof.type}
                      </p>
                      {paymentProofPreview && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => window.open(paymentProofPreview, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View full image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="payment-proof-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">Upload payment screenshot</p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF, WEBP or PDF (Max 5MB)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">What to upload:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Screenshot of payment confirmation from your UPI app</li>
                  <li>Clear image showing transaction ID/Reference number</li>
                  <li>Image should show amount (₹{orderDetails.total.toFixed(2)}) and recipient ({upiConfig.upiId})</li>
                </ul>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                ⚠️ Important Notes
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside pl-2">
                <li>Your order will be processed only after payment verification</li>
                <li>Verification usually takes 1-2 business hours</li>
                <li>Keep your UPI app open for verification</li>
                <li>Make sure transaction ID matches exactly with your UPI app</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowUPIDialog(false)}
                className="w-full sm:w-auto"
                disabled={isProcessingUPI || isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUPIPayment}
                disabled={!upiTransactionId.trim() || !paymentProof || isProcessingUPI || isUploading}
                className="w-full sm:w-auto"
              >
                {(isProcessingUPI || isUploading) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment & Place Order"
                )}
              </Button>
            </div>
            
            {(!upiTransactionId.trim() || !paymentProof) && (
              <p className="text-xs text-red-500 text-center mt-2 w-full">
                {!upiTransactionId.trim() && !paymentProof 
                  ? "Please enter transaction ID and upload payment proof" 
                  : !upiTransactionId.trim() 
                    ? "Please enter transaction ID" 
                    : "Please upload payment proof"}
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;