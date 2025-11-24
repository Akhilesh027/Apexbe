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

  // Cart and order details
  const cartData = location.state || {};
  const [orderDetails, setOrderDetails] = useState({
    items: cartData.cartItems || [],
    subtotal: cartData.subtotal || 0,
    discount: cartData.discount || 0,
    shipping: cartData.shipping || 0,
    total: cartData.total || 0,
  });

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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (selectedPayment === "wallet" && walletBalance < orderDetails.total) {
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
      const mappedItems = orderDetails.items.map(item => ({
  productId: item._id,
  name: item.itemName,
  price: item.price || item.finalAmount || 0,
  quantity: item.quantity || 1,
  image: item.images?.[0] || "/placeholder.png",
  discount: item.discount || 0,
  commission: item.commission || 0,
  finalAmount: item.finalAmount || (item.afterDiscount || item.userPrice) - (item.commission || 0),
}));


      const orderData = {
        userId: user.id,
        shippingAddress: selectedAddress,
        paymentDetails: {
          method: selectedPayment,
          amount: orderDetails.total,
          transactionId:
            selectedPayment === "wallet"
              ? `WALLET_${Date.now()}`
              : `TXN_${Date.now()}`,
        },
        orderItems: mappedItems,
        orderSummary: orderDetails,
      };

      const res = await fetch("https://api.apexbee.in/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Order failed");

      // Deduct wallet
      if (selectedPayment === "wallet") {
        await fetch(`https://api.apexbee.in/api/user/wallet/deduct/${user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: orderDetails.total }),
        });
      }

   navigate("/order-success", {
  state: { 
    order: result.order, // pass the whole order object
    paymentMethod: selectedPayment,
  },
});

    } catch (err) {
      toast({
        title: "Order Failed",
        description: err.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Delivery Address</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNewAddress}
                >
                  <Plus className="h-4 w-4" /> Add New
                </Button>
              </div>
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-muted-foreground">
                    No addresses saved yet
                  </p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`border p-4 rounded-lg cursor-pointer ${
                        selectedAddress?._id === addr._id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {addr.name}{" "}
                            {addr.isDefault && (
                              <span className="text-xs bg-primary text-white px-1 rounded">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm">{formatAddress(addr)}</p>
                          <p className="text-sm">{addr.phone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(addr);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <RadioGroup
                value={selectedPayment}
                onValueChange={setSelectedPayment}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="wallet"
                    id="wallet"
                    disabled={walletBalance < orderDetails.total}
                  />
                  <Label
                    htmlFor="wallet"
                    className="cursor-pointer flex items-center gap-2"
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
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="cursor-pointer font-medium">
                    UPI
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer font-medium">
                    Card
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer font-medium">
                    COD
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            {" "}
            <div className="bg-muted/30 rounded-lg p-6 sticky top-4">
              {" "}
              <div className="mb-6">
                {" "}
                <h3 className="font-semibold text-lg mb-4">
                  Product Details
                </h3>{" "}
                <div className="space-y-4">
                  {" "}
                  {orderDetails.items.map((item, index) => (
                    <div
                      key={item._id || item.productId || index}
                      className="bg-white rounded-lg border p-4"
                    >
                      {" "}
                      <div className="flex gap-4">
                        {" "}
                        <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                          {" "}
                          <img
                            src={
                              item.images?.[0] ||
                              item.image ||
                              "/placeholder.png"
                            }
                            alt={item.itemName || item.name}
                            className="w-full h-full object-cover"
                          />{" "}
                        </div>{" "}
                        <div className="flex-1 min-w-0">
                          {" "}
                          <h4 className="font-semibold text-sm mb-1 truncate">
                            {item.itemName || item.name}
                          </h4>{" "}
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            {" "}
                            <span>Qty: {item.quantity || 1}</span>{" "}
                            {item.selectedColor && (
                              <span>Color: {item.selectedColor}</span>
                            )}{" "}
                            {item.size && <span>Size: {item.size}</span>}{" "}
                          </div>{" "}
                          <p className="font-semibold text-sm">
                                 <span>₹{((item.price || item.finalAmount || item.salesPrice) * (item.quantity || 1)).toFixed(2)}</span>

                          </p>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
              </div>{" "}
              {/* Order Summary */}{" "}
           {/* Order Summary */}
<div className="border-t border-gray-200 pt-4 space-y-2">
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span>₹{orderDetails.subtotal.toFixed(2)}</span>
  </div>

 
  <div className="flex justify-between">
    <span>Shipping</span>
    <span>₹{orderDetails.shipping.toFixed(2)}</span>
  </div>

  <div className="flex justify-between font-semibold text-lg">
    <span>Total</span>
    <span>₹{orderDetails.total.toFixed(2)}</span>
  </div>
</div>

              <Button
                className="w-full mt-6"
                onClick={handlePlaceOrder}
                disabled={isLoading}
              >
                {" "}
                {isLoading ? "Processing..." : "Place Order"}{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>Enter your address details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Full Name"
              value={addressForm.name}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              placeholder="Phone"
              value={addressForm.phone}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
            <Input
              placeholder="Pincode"
              value={addressForm.pincode}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))
              }
            />
            <Textarea
              placeholder="Address"
              value={addressForm.address}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
            <Input
              placeholder="City"
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, city: e.target.value }))
              }
            />
            <Input
              placeholder="State"
              value={addressForm.state}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, state: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!isAddressFormValid()}
              onClick={handleAddOrEditAddress}
            >
              {isLoading ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
