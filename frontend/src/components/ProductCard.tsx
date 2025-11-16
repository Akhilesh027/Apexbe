import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    subcategory: string;
    stock: number;
    vendorId?: string;
    description?: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Check if product is already wishlisted
  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!user?._id) {
        setLoadingWishlist(false);
        return;
      }

      try {
        const res = await axios.get(
          `https://api.apexbee.in/api/wishlist/status?userId=${user._id}&productId=${product._id}`
        );
        setIsWishlisted(res.data.isWishlisted);
      } catch (err) {
        console.error("Wishlist status error:", err);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlistStatus();
  }, [product._id, user?._id]);

  // Toggle wishlist
  const handleWishlist = async () => {
    if (!user?._id) {
      alert("Please login to manage your wishlist.");
      return;
    }

    try {
      const res = await axios.post("https://api.apexbee.in/api/wishlist/toggle", {
        userId: user._id,
        productId: product._id,
      });

      if (res.data.success) {
        setIsWishlisted(!isWishlisted);
      } else {
        alert(res.data.message || "Failed to update wishlist.");
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      alert("Server error while updating wishlist.");
    }
  };

  // Add to Cart
  const handleAddToCart = async () => {
    if (!user?._id) {
      alert("Please login to add to cart.");
      return;
    }

    try {
      const item = {
        userId: user._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        selectedColor: "default",
        vendorId: product.vendorId,
      };

      const res = await axios.post("https://api.apexbee.in/api/cart/add", item);

      if (res.data.success) {
        alert("Added to cart successfully!");
      } else {
        alert(res.data.message || "Failed to add to cart.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Server error while adding to cart.");
    }
  };

  return (
    <div className="bg-blue-light rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-300 relative">
      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        disabled={loadingWishlist}
        className="absolute z-10 top-3 right-3 bg-white rounded-full p-1 shadow-md hover:scale-110 transition disabled:opacity-50"
      >
        <Heart
          className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}`}
        />
      </button>

      <Link to={`/product/${product._id}`}>
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={`${product.image}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.stock === 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded font-semibold">
              Out of Stock
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-medium text-navy mb-2 line-clamp-2">{product.name}</h3>

          {/* ⭐ Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < 4 ? "fill-accent text-accent" : "text-gray-300"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-navy">Rs. {product.price}</span>
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <button
        disabled={product.stock === 0}
        onClick={handleAddToCart}
        className={`w-full py-2 text-sm font-semibold rounded-b-lg transition-colors ${
          product.stock === 0
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-navy text-white hover:bg-accent"
        }`}
      >
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
};

export default ProductCard;
