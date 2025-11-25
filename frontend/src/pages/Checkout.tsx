import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Upload, QrCode, Copy, Check, Loader2 } from "lucide-react";
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
import upi from '../Web images/Web images/upi.jpg'
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
  const [upiScreenshot, setUpiScreenshot] = useState(null);
  const [upiScreenshotFile, setUpiScreenshotFile] = useState(null);
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

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
    qrCodeUrl: upi, // Replace with your actual QR code image path
    merchantName: "ApexBee Store",
    amount: orderDetails.total
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

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setUpiScreenshotFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUpiScreenshot(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadScreenshotToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      formData.append('uploadType', 'payment_proof');

      const token = localStorage.getItem("token");
      const response = await fetch('https://api.apexbee.in/api/upload/payment-proof', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      const data = await response.json();
      return data.imageUrl; // Return the uploaded image URL
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      // Fallback: convert to base64 and store directly
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  };

  // **UPDATED: Enhanced order placement with backend integration**
  const handlePlaceOrder = async (paymentMethod = selectedPayment) => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    // Calculate totals from cart items
    const calculatedSubtotal = orderDetails.items.reduce((acc, item) => {
      const price = item.price || item.afterDiscount || 0;
      const quantity = item.quantity || 1;
      return acc + (price * quantity);
    }, 0);

    const calculatedTotal = calculatedSubtotal + (orderDetails.shipping || 0) - (orderDetails.discount || 0);

    if (paymentMethod === "wallet" && walletBalance < calculatedTotal) {
      toast({
        title: "Insufficient Wallet",
        description: `Wallet balance ₹${walletBalance.toFixed(2)} is not enough`,
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

      // **ENHANCED: Proper item mapping with backend expectations**
      const mappedItems = orderDetails.items.map((item) => {
        const price = item.price !== undefined 
          ? item.price 
          : item.afterDiscount !== undefined 
          ? item.afterDiscount 
          : 0;

        const quantity = item.quantity || 1;

        return {
          productId: item.productId || item._id || item.id,
          name: item.itemName || item.name || "Unnamed Product",
          price: Number(price),
          quantity: Number(quantity),
          image: item.images?.[0] || item.image || "/placeholder.png",
          color: item.selectedColor || item.color || 'default',
          size: item.size || 'One Size'
        };
      });

      const finalSubtotal = mappedItems.reduce(
        (acc, item) => acc + (item.price * item.quantity),
        0
      );

      const finalTotal = Math.max(0, finalSubtotal + (orderDetails.shipping || 0) - (orderDetails.discount || 0));

      // **ENHANCED: Order data structure matching backend schema**
      const orderData = {
        userId: user.id,
        userDetails: {
          userId: user.id,
          name: user.name || user.username,
          email: user.email,
          phone: selectedAddress.phone
        },
        shippingAddress: selectedAddress,
        
        // Enhanced payment details for backend
        paymentDetails: {
          method: paymentMethod,
          amount: finalTotal,
          transactionId: paymentMethod === "wallet" 
            ? `WALLET_${Date.now()}`
            : paymentMethod === "upi"
            ? upiTransactionId || `UPI_${Date.now()}`
            : `TXN_${Date.now()}`,
          upiId: paymentMethod === "upi" ? upiConfig.upiId : undefined,
        },

        // Payment proof for UPI (matches backend expectation)
        paymentProof: paymentMethod === "upi" ? {
          type: 'upi_screenshot',
          url: upiScreenshot,
          transactionReference: upiTransactionId,
          upiId: upiConfig.upiId,
          fileName: upiScreenshotFile?.name || `payment_${Date.now()}`,
          fileSize: upiScreenshotFile?.size,
          mimeType: upiScreenshotFile?.type || 'image/jpeg'
        } : undefined,

        orderItems: mappedItems,

        orderSummary: {
          itemsCount: mappedItems.reduce((acc, item) => acc + item.quantity, 0),
          subtotal: finalSubtotal,
          shipping: orderDetails.shipping || 0,
          discount: orderDetails.discount || 0,
          total: finalTotal,
          tax: 0,
          grandTotal: finalTotal
        },

        metadata: {
          source: 'cart',
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          userAgent: navigator.userAgent
        }
      };

      console.log("Sending order data to backend:", orderData);

      // **ENHANCED: API call with proper error handling**
      const res = await fetch("https://api.apexbee.in/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();
      
      if (!res.ok) {
        // Handle specific backend errors
        if (result.message?.includes("stock")) {
          throw new Error(`Stock issue: ${result.message}`);
        }
        if (result.message?.includes("Product")) {
          throw new Error(`Product error: ${result.message}`);
        }
        throw new Error(result.message || result.error || "Order failed");
      }

      // **SUCCESS: Handle different order statuses**
      if (result.success) {
        // Clear cart after successful order
        localStorage.removeItem("cart");

        // Reset UPI states if used
        if (paymentMethod === "upi") {
          setUpiScreenshot(null);
          setUpiScreenshotFile(null);
          setUpiTransactionId("");
          setShowUPIDialog(false);
        }

        // Show appropriate success message
        const successMessage = result.requiresVerification 
          ? "Order placed! Payment verification pending. We'll notify you once verified."
          : "Order placed successfully!";

        toast({
          title: "Success!",
          description: successMessage,
          variant: "default",
        });

        // Navigate to success page with order details
        navigate("/order-success", {
          state: {
            order: result.order,
            paymentMethod: paymentMethod,
            orderId: result.order?._id || result.order?.orderNumber,
            requiresVerification: result.requiresVerification || false,
            referral: result.referral
          },
        });

      } else {
        throw new Error(result.message || "Order creation failed");
      }

    } catch (err) {
      console.error("Order error:", err);
      
      // Show specific error messages
      let errorMessage = err.message || "Failed to place order. Please try again.";
      
      if (err.message.includes("stock")) {
        errorMessage = "Some items are out of stock. Please update your cart.";
        // Optionally redirect to cart
        setTimeout(() => navigate("/cart"), 2000);
      }
      
      if (err.message.includes("Product")) {
        errorMessage = "Product not available. Please update your cart.";
        setTimeout(() => navigate("/cart"), 2000);
      }

      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // **UPDATED: Enhanced UPI payment handler**
  const handleUPIPayment = async () => {
    if (!upiScreenshot) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment screenshot",
        variant: "destructive",
      });
      return;
    }

    if (!upiTransactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter UPI transaction ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingUPI(true);
    try {
      let screenshotUrl = upiScreenshot;
      
      // Upload screenshot to server if file exists
      if (upiScreenshotFile) {
        try {
          screenshotUrl = await uploadScreenshotToServer(upiScreenshotFile);
          console.log("Screenshot uploaded successfully:", screenshotUrl);
        } catch (uploadError) {
          console.warn("Screenshot upload failed, using base64:", uploadError);
          // Continue with base64 as fallback
        }
      }

      // Process UPI payment with the uploaded screenshot URL
      await handlePlaceOrder("upi");
    } catch (error) {
      console.error("UPI payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: "Failed to process UPI payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingUPI(false);
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

  // **NEW: Calculate real-time totals**
  useEffect(() => {
    const calculatedSubtotal = orderDetails.items.reduce((acc, item) => {
      const price = item.price || item.afterDiscount || 0;
      const quantity = item.quantity || 1;
      return acc + (price * quantity);
    }, 0);

    const calculatedTotal = calculatedSubtotal + (orderDetails.shipping || 0) - (orderDetails.discount || 0);

    setOrderDetails(prev => ({
      ...prev,
      subtotal: calculatedSubtotal,
      total: calculatedTotal
    }));
  }, [orderDetails.items, orderDetails.shipping, orderDetails.discount]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">Checkout</h1>
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
                  <RadioGroupItem value="upi" id="upi" className="h-4 w-4 sm:h-5 sm:w-5" />
                  <Label htmlFor="upi" className="cursor-pointer font-medium flex items-center gap-2 text-sm sm:text-base">
                    <QrCode className="h-4 w-4" />
                    UPI Payment
                  </Label>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem value="card" id="card" className="h-4 w-4 sm:h-5 sm:w-5" />
                  <Label htmlFor="card" className="cursor-pointer font-medium text-sm sm:text-base">
                    Card
                  </Label>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem value="cod" id="cod" className="h-4 w-4 sm:h-5 sm:w-5" />
                  <Label htmlFor="cod" className="cursor-pointer font-medium text-sm sm:text-base">
                    COD
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4 sm:p-6 sticky top-4">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg mb-3 sm:mb-4">Product Details</h3>
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
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              UPI Payment
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Scan the QR code or use UPI ID to complete your payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 py-4">
            {/* QR Code Section */}
            <div className="text-center">
              <div className="bg-white p-3 sm:p-4 rounded-lg border inline-block max-w-full">
                <img
                  src={upiConfig.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-40 h-40 sm:w-48 sm:h-48 mx-auto"
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Scan QR code with any UPI app
              </p>
            </div>

            {/* UPI ID Section */}
            <div className="text-center">
              <Label className="text-sm sm:text-base font-medium mb-2 block">Or use UPI ID</Label>
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
            </div>

            {/* Payment Details */}
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm sm:text-base">Amount to pay:</span>
                <span className="font-bold text-lg sm:text-xl">₹{orderDetails.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Merchant:</span>
                <span>{upiConfig.merchantName}</span>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium">Upload Payment Screenshot *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 sm:p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="cursor-pointer block"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload screenshot</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </label>
              </div>
              {upiScreenshot && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-green-600 mb-2">✓ Screenshot uploaded</p>
                  <img
                    src={upiScreenshot}
                    alt="Payment screenshot"
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded border mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transaction-id" className="text-sm sm:text-base font-medium">
                UPI Transaction ID *
              </Label>
              <Input
                id="transaction-id"
                placeholder="Enter UPI transaction reference number"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your UPI app after payment
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleUPIPayment}
              disabled={!upiScreenshot || !upiTransactionId.trim() || isProcessingUPI}
              className="w-full text-sm sm:text-base py-2.5 sm:py-3"
            >
              {isProcessingUPI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "Confirm Payment & Place Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;