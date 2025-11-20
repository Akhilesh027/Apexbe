import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import Navbar from "@/components/Navbar";

const Wishlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch wishlist from backend
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user?._id) return;

      try {
        const res = await axios.get(`https://api.apexbee.in/api/wishlist/${user._id}`);
        if (res.data.success) {
          setWishlistItems(res.data.wishlist);
        } else {
          setWishlistItems([]);
        }
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user._id]);

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await axios.post("https://api.apexbee.in/api/wishlist/toggle", {
        userId: user._id,
        productId,
      });

      if (res.data.success) {
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
        });
      }
    } catch (err) {
      console.error("Error removing wishlist item:", err);
      toast({ title: "Error", description: "Failed to remove item" });
    }
  };

  const addToCart = async (item: any) => {
    try {
      const payload = {
        userId: user._id,
        productId: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        selectedColor: "default",
        vendorId: item.vendorId || null,
      };

      const res = await axios.post("https://api.apexbee.in/api/cart/add", payload);

      if (res.data.success) {
        toast({
          title: "Added to cart",
          description: `${item.name} has been added to your cart`,
        });
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      toast({ title: "Error", description: "Failed to add to cart" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar/>
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
                <p className="text-sm text-muted-foreground">
                  {wishlistItems.length} items saved
                </p>
              </div>
            </div>
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding products you love!</p>
            <Button onClick={() => navigate("/")}>
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item._id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={`${item.image}`}
                    alt={item.name}
                    className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                  />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-foreground px-4 py-2 rounded-full font-semibold">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromWishlist(item._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-foreground">
                      ₹{item.price.toFixed(2)}
                    </span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addToCart(item)}
                    disabled={!item.inStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {item.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
