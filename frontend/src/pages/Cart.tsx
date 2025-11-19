import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // Fetch cart items from backend
  const fetchCart = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${userId}`);
      const data = await res.json();
      setCartItems(data.cart || []);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  // Update quantity for a cart item
  const updateQuantity = async (itemId, delta) => {
    if (!userId) return;
    const item = cartItems.find(i => i._id === itemId || i.productId === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/cart/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id, quantity: newQuantity }),
      });

      if (res.ok) {
        setCartItems(prev =>
          prev.map(i =>
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

  // Remove item from cart
  const removeItem = async (itemId) => {
    if (!userId) return;
    const item = cartItems.find(i => i._id === itemId || i.productId === itemId);
    if (!item) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/cart/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id }),
      });

      if (res.ok) {
        setCartItems(prev => prev.filter(i => i._id !== itemId && i.productId !== itemId));
      } else {
        console.error("Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const discount = originalTotal - subtotal;
  const shipping = cartItems.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");
    navigate("/checkout", {
      state: { cartItems, subtotal, discount, shipping, total },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  Your cart is empty
                </p>
                <Button
                  onClick={() => navigate("/products")}
                  className="bg-navy hover:bg-navy/90 text-white"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              cartItems.map(item => (
                <div
                  key={item._id || item.productId}
                  className="bg-white rounded-lg p-4 shadow-sm flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-navy mb-2">{item.name}</h3>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-navy">
                        Rs. {item.price}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          Rs. {item.originalPrice}
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
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm h-fit sticky top-4">
            <h2 className="text-xl font-bold text-navy mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">Rs. {subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-Rs. {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">Rs. {shipping.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-navy">Rs. {total.toFixed(2)}</span>
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
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => navigate("/products")}
              >
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
