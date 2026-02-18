import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function to format currency
const formatCurrency = (amount) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

// ✅ Read pickup/preorder flags safely (rename fields if needed)
const readItemFlags = (item) => {
  const allowPickup = Boolean(item?.allowPickup ?? item?.pickupAvailable ?? false);
  const isPreOrder = Boolean(item?.isPreOrder ?? item?.preOrder ?? false);
  const availableOn = item?.availableOn || item?.preOrderDate || null; // string/ISO
  return { allowPickup, isPreOrder, availableOn };
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // Fetch cart items from backend
  const fetchCart = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`https://api.apexbee.in/api/cart/${userId}`);
      const data = await res.json();
      setCartItems(data.cart || []);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  // Update quantity
  const updateQuantity = async (itemId, delta) => {
    if (!userId) return;
    const item = cartItems.find((i) => i._id === itemId || i.productId === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);

    try {
      setLoading(true);
      const res = await fetch(`https://api.apexbee.in/api/cart/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id, quantity: newQuantity }),
      });

      if (res.ok) {
        setCartItems((prev) =>
          prev.map((i) =>
            i._id === itemId || i.productId === itemId ? { ...i, quantity: newQuantity } : i
          )
        );
      } else {
        console.error("Failed to update quantity");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    if (!userId) return;
    const item = cartItems.find((i) => i._id === itemId || i.productId === itemId);
    if (!item) return;

    try {
      setLoading(true);
      const res = await fetch(`https://api.apexbee.in/api/cart/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id }),
      });

      if (res.ok) {
        setCartItems((prev) => prev.filter((i) => i._id !== itemId && i.productId !== itemId));
      } else {
        console.error("Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.afterDiscount || item.price) * item.quantity,
    0
  );
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.salesPrice || item.afterDiscount || item.price) * item.quantity,
    0
  );
  const discount = originalTotal - subtotal;

  // ✅ default shipping for delivery, checkout will set 0 for pickup
  const shipping = cartItems.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  // ✅ Pre-order: compute max availableOn
  const preOrderInfo = useMemo(() => {
    const preItems = cartItems
      .map((it) => ({ ...it, ...readItemFlags(it) }))
      .filter((it) => it.isPreOrder && it.availableOn);

    if (preItems.length === 0) return { hasPreOrder: false, availableOnMax: null };

    const maxDate = preItems
      .map((it) => new Date(it.availableOn))
      .reduce((a, b) => (a > b ? a : b));

    return { hasPreOrder: true, availableOnMax: maxDate.toISOString() };
  }, [cartItems]);

  // ✅ pickup possible if ANY item allows pickup (or you can require ALL items)
  const pickupPossible = useMemo(() => {
    return cartItems.some((it) => readItemFlags(it).allowPickup);
  }, [cartItems]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");

    navigate("/checkout", {
      state: {
        cartItems,
        subtotal,
        discount,
        shipping,
        total,
        // ✅ send extra info to checkout
        pickupPossible,
        preOrderInfo,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8">Shopping Cart</h1>

        {/* ✅ quick info banners */}
        {cartItems.length > 0 && (
          <div className="mb-5 space-y-2">
            {pickupPossible && (
              <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm">
                ✅ Self Pickup available for some items (choose in checkout)
              </div>
            )}
            {preOrderInfo.hasPreOrder && (
              <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm">
                ⏳ Pre-order items in cart. Ready on / after:{" "}
                <strong>{new Date(preOrderInfo.availableOnMax).toDateString()}</strong>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
                <Button
                  onClick={() => navigate("/products")}
                  className="bg-navy hover:bg-navy/90 text-white"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              cartItems.map((item) => {
                const { allowPickup, isPreOrder, availableOn } = readItemFlags(item);

                return (
                  <div
                    key={item._id || item.productId}
                    className="bg-white rounded-lg p-4 shadow-sm flex gap-4"
                  >
                    <img
                      src={item.images?.[0] || item.image || "/placeholder.svg"}
                      alt={item.itemName || item.name}
                      className="w-24 h-24 object-cover rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-navy mb-1">
                          {item.itemName || item.name}
                        </h3>

                        {/* ✅ badges */}
                        <div className="flex flex-wrap gap-2">
                          {allowPickup && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Pickup
                            </span>
                          )}
                          {isPreOrder && (
                            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Pre-order
                            </span>
                          )}
                        </div>
                      </div>

                      {isPreOrder && availableOn && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Available on: <strong>{new Date(availableOn).toDateString()}</strong>
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-navy">
                          {formatCurrency(item.afterDiscount || item.price)}
                        </span>
                        {item.salesPrice && item.salesPrice > (item.afterDiscount || item.price) && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(item.salesPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border rounded">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item._id || item.productId, -1)}
                            disabled={loading || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item._id || item.productId, 1)}
                            disabled={loading}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item._id || item.productId)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm h-fit sticky top-4">
            <h2 className="text-xl font-bold text-navy mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">{formatCurrency(shipping)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-navy">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-navy hover:bg-navy/90 text-white"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || loading}
            >
              {loading ? "Processing..." : "Proceed to Checkout"}
            </Button>

            {cartItems.length > 0 && (
              <Button variant="outline" className="w-full mt-3" onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
