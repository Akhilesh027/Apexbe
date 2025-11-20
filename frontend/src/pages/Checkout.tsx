import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Check } from "lucide-react";
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

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  // Get order details from cart navigation
  const cartData = location.state || {};
  const [orderDetails, setOrderDetails] = useState({
    items: cartData.cartItems || [],
    subtotal: cartData.subtotal || 0,
    discount: cartData.discount || 0,
    shipping: cartData.shipping || 0,
    total: cartData.total || 0
  });

  // New address form
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
    isDefault: false
  });

  // Redirect if no cart data
  useEffect(() => {
    if (!cartData.cartItems || cartData.cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Redirecting to cart...",
        variant: "destructive"
      });
      navigate("/cart");
    }
  }, [cartData, navigate, toast]);

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSaveAddress = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      
      if (!user || !token) {
        toast({
          title: "Authentication required",
          description: "Please login to continue",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      const addressData = {
        ...addressForm,
        id: editingAddress?.id || undefined,
        userId: user._id
      };

      const response = await fetch(`https://api.apexbee.in/api/user/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save address");
      }

      const result = await response.json();
      
      // Update addresses list
      await loadAddresses();
      
      // If this is the first address or default, select it
      if (!selectedAddress || addressForm.isDefault) {
        setSelectedAddress(result.address);
      }

      // Reset form and close dialog
      setAddressForm({
        name: "",
        phone: "",
        pincode: "",
        address: "",
        city: "",
        state: "",
        isDefault: false
      });
      setEditingAddress(null);
      setShowAddressDialog(false);

      toast({
        title: "Success",
        description: editingAddress ? "Address updated successfully" : "Address added successfully",
      });
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      
      if (!user || !token) {
        return;
      }

      const response = await fetch(`https://api.apexbee.in/api/user/address/${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.address) {
          setAddresses([data.address]);
          // Select default address or first address
          const defaultAddress = data.address.isDefault ? data.address : data.address;
          setSelectedAddress(defaultAddress);
        } else {
          setAddresses([]);
          setSelectedAddress(null);
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      pincode: address.pincode,
      address: address.address,
      city: address.city,
      state: address.state,
      isDefault: address.isDefault
    });
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
      isDefault: addresses.length === 0
    });
    setShowAddressDialog(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a delivery address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      
      if (!user || !token) {
        toast({
          title: "Authentication required",
          description: "Please login to continue",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      const userId = user._id;

      // Prepare complete order data
      const orderData = {
        userId: userId,
        userDetails: {
          userId: userId,
          name: user.name || user.username,
          email: user.email,
          phone: selectedAddress.phone
        },
        shippingAddress: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          country: "India"
        },
        paymentDetails: {
          method: selectedPayment,
          status: selectedPayment === "cod" ? "pending" : "completed",
          amount: orderDetails.total,
          transactionId: selectedPayment !== "cod" ? `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null
        },
        orderItems: orderDetails.items.map(item => ({
          productId: item.productId || item._id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          image: item.image,
          quantity: item.quantity,
          color: item.selectedColor || item.color || "default",
          size: item.size || "One Size",
          vendorId: item.vendorId || "default-vendor",
          itemTotal: item.price * item.quantity
        })),
        orderSummary: {
          itemsCount: orderDetails.items.reduce((total, item) => total + item.quantity, 0),
          subtotal: orderDetails.subtotal,
          shipping: orderDetails.shipping,
          discount: orderDetails.discount,
          total: orderDetails.total,
          tax: Math.round(orderDetails.total * 0.18), // 18% GST
        },
        orderStatus: {
          currentStatus: "confirmed",
          timeline: [
            {
              status: "confirmed",
              timestamp: new Date().toISOString(),
              description: "Order confirmed and payment processing"
            }
          ]
        },
        deliveryDetails: {
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          shippingMethod: "Standard Delivery",
          trackingNumber: null
        },
        metadata: {
          source: cartData.fromBuyNow ? "buy_now" : "cart",
          userAgent: navigator.userAgent,
          referralCompleted: false // Will be updated by backend if first order
        }
      };

      console.log("Sending order data:", orderData);

      const response = await fetch("https://api.apexbee.in/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to place order");
      }

      console.log("Order created successfully:", result);
      
      // Show success message with referral info if applicable
      if (result.referral?.completed) {
        toast({
          title: "🎉 Referral Completed!",
          description: "You earned Rs. 100 for your first order with referral!",
          duration: 5000,
        });
      }
      
      // Clear cart after successful order (only if coming from cart, not Buy Now)
      if (!cartData.fromBuyNow) {
        await clearCart(userId, token);
      }
      
      // Navigate to success page with order details
      navigate("/order-success", { 
        state: { 
          orderId: result.order._id,
          orderNumber: result.order.orderNumber,
          orderDetails: result.order,
          paymentMethod: selectedPayment,
          referralCompleted: result.referral?.completed || false
        } 
      });
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart after successful order
  const clearCart = async (userId, token) => {
    try {
      const response = await fetch(`https://api.apexbee.in/api/cart/${userId}/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        console.warn("Failed to clear cart, but order was placed successfully");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`;
  };

  // Calculate delivery text
  const getDeliveryText = () => {
    return orderDetails.shipping === 0 ? 'Free' : `₹${orderDetails.shipping}`;
  };

  // Validate address form
  const isAddressFormValid = () => {
    return (
      addressForm.name.trim() &&
      addressForm.phone.trim() &&
      addressForm.pincode.trim() &&
      addressForm.address.trim() &&
      addressForm.city.trim() &&
      addressForm.state.trim() &&
      addressForm.phone.length >= 10 &&
      addressForm.pincode.length === 6
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar/>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Delivery Address</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddNewAddress}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </Button>
              </div>

              {/* Address List */}
              <div className="space-y-4 mb-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No addresses saved yet</p>
                    <Button 
                      variant="link" 
                      onClick={handleAddNewAddress}
                      className="mt-2"
                    >
                      Add your first address
                    </Button>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address._id || address.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress?._id === address._id || selectedAddress?.id === address.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{address.name}</span>
                            {address.isDefault && (
                              <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                                Default
                              </span>
                            )}
                            {(selectedAddress?._id === address._id || selectedAddress?.id === address.id) && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {address.phone}
                          </p>
                          <p className="text-sm">
                            {formatAddress(address)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedAddress && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold mb-1">
                    Delivering to {selectedAddress.name}
                  </p>
                  <p className="text-sm text-green-700">
                    {formatAddress(selectedAddress)}
                  </p>
                  <p className="text-sm text-green-700">
                    Phone: {selectedAddress.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              
              <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                    <span className="font-medium">UPI</span>
                  </Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer font-medium">
                      Credit or debit card
                    </Label>
                  </div>
                  <div className="ml-6 flex gap-2">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='24'%3E%3Crect width='40' height='24' rx='4' fill='%231434CB'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='10' font-weight='bold'%3EVISA%3C/text%3E%3C/svg%3E" alt="Visa" className="h-6" />
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='24'%3E%3Crect width='40' height='24' rx='4' fill='%23EB001B'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='8' font-weight='bold'%3EMC%3C/text%3E%3C/svg%3E" alt="Mastercard" className="h-6" />
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='24'%3E%3Crect width='40' height='24' rx='4' fill='%230066B2'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='9' font-weight='bold'%3EAMEX%3C/text%3E%3C/svg%3E" alt="Amex" className="h-6" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <Label htmlFor="netbanking" className="cursor-pointer font-medium">
                    Net Banking
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer font-medium">
                    Cash on Delivery/Pay on Delivery
                  </Label>
                </div>
              </RadioGroup>

              <p className="text-xs text-muted-foreground mt-4">
                Cash, UPI and Cards accepted. Know more.
              </p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-6 sticky top-4">
              {/* Product Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4">Product Details</h3>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={item._id || item.productId || index} className="bg-white rounded-lg border p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                        
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold">₹{item.price}</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{item.originalPrice}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className={orderDetails.shipping === 0 ? "text-green-600" : ""}>
                    {getDeliveryText()}
                  </span>
                </div>
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-green-600">-₹{orderDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (GST):</span>
                  <span>₹{Math.round(orderDetails.total * 0.18).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Order Total:</span>
                  <span>₹{orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3"
                onClick={handlePlaceOrder}
                disabled={isLoading || !selectedAddress || orderDetails.items.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Place Order • ₹${orderDetails.total.toFixed(2)}`
                )}
              </Button>

              <div className="mt-6 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold">Review items and shipping</p>
                <p>Need help? Check our help pages or contact us 24x7</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              Enter your delivery address details below
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name"
                value={addressForm.name} 
                onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone"
                value={addressForm.phone} 
                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your 10-digit phone number"
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input 
                id="pincode"
                value={addressForm.pincode} 
                onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="Enter 6-digit pincode"
                type="text"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={addressForm.address}
                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                placeholder="Enter your complete address (House no., Building, Street, Area)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city"
                  value={addressForm.city} 
                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State *</Label>
                <Input 
                  id="state"
                  value={addressForm.state} 
                  onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm">
                Set as default address
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddressDialog(false);
                setEditingAddress(null);
                setAddressForm({
                  name: "",
                  phone: "",
                  pincode: "",
                  address: "",
                  city: "",
                  state: "",
                  isDefault: false
                });
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={isLoading || !isAddressFormValid()}
            >
              {isLoading ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;