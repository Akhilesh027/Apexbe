import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; 
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

// Helper function to format currency
const formatCurrency = (amount) => {
    const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

// Placeholder product structure for initial state and fallbacks
const initialProduct = {
    _id: null,
    name: "Loading Product...",
    category: "Loading",
    price: 0,
    originalPrice: 0,
    discount: 0,
    image: "/placeholder.svg",
    rating: 4,
    vendorName: "Store",
    description: "Product details loading...",
    details: { composition: "N/A" }
};

const ProductDetail = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [product, setProduct] = useState(initialProduct);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState("orange");
    const [quantity, setQuantity] = useState(1); 

    const colors = [
        { name: "orange", hex: "#ff8c42" },
        { name: "purple", hex: "#7c3aed" },
        { name: "teal", hex: "#14b8a6" },
        { name: "cyan", hex: "#06b6d4" },
    ];

    // --- Data Fetching Logic (Unchanged) ---
    useEffect(() => {
        if (!id) return;

        const fetchProductDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:5000/api/product/${id}`); 
                const data = await res.json();

                if (res.ok) {
                    setProduct(data);
                    fetchSimilarProducts(data.category, data._id); 
                } else {
                    console.error("Failed to fetch main product:", data.error);
                    setProduct(initialProduct);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Network error while fetching main product:", error);
                setProduct(initialProduct);
                setLoading(false);
            }
        };

        const fetchSimilarProducts = async (category, currentProductId) => {
            try {
                const res = await fetch(`http://localhost:5000/api/products?category=${category}&excludeId=${currentProductId}&limit=4`);
                const data = await res.json();
                
                if (res.ok) {
                    setSimilarProducts(data.products || data);
                } else {
                    setSimilarProducts([]);
                }
            } catch (error) {
                console.error("Error fetching similar products:", error);
                setSimilarProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [id]); 
    // ----------------------------------------

    // --- ADD TO CART FUNCTIONALITY ---
    const handleAddToCart = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user._id;

        if (!userId) {
            alert("Please login first.");
            return;
        }

        const item = {
            userId,
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity,
            selectedColor,
            vendorId: product.vendorId,
        };

        try {
            const res = await fetch("http://localhost:5000/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to add to cart.");
                return;
            }

            alert("Added to cart successfully!");
            console.log("Cart Response:", data);

        } catch (error) {
            console.error("Add to cart backend error:", error);
            alert("Server error");
        }
    };

    // --- BUY NOW FUNCTIONALITY ---
    const handleBuyNow = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (!user) {
            alert("Please login first to proceed with checkout.");
            navigate("/login");
            return;
        }

        // Calculate order details
        const subtotal = product.price * quantity;
        const discountAmount = product.originalPrice > product.price 
            ? (product.originalPrice - product.price) * quantity 
            : 0;
        const shipping = subtotal > 0 ? 50 : 0; // Fixed shipping cost
        const total = subtotal + shipping;

        // Prepare cart items for checkout
        const cartItems = [{
            _id: product._id,
            productId: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            quantity: quantity,
            selectedColor: selectedColor,
            vendorId: product.vendorId
        }];

        // Navigate to checkout with product details
        navigate("/checkout", {
            state: {
                cartItems: cartItems,
                subtotal: subtotal,
                discount: discountAmount,
                shipping: shipping,
                total: total,
                fromBuyNow: true // Flag to indicate this came from Buy Now
            }
        });
    };
    // -----------------------------------

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-xl font-medium text-primary">Loading Product Details...</p>
            </div>
        );
    }
    
    // Destructure product for cleaner JSX
    const { name, price, originalPrice, discount, category, vendorId, rating } = product;
    const currentRating = Math.round(rating || 4);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

           

            {/* Breadcrumb (Using dynamic category) */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm text-muted-foreground">
                    <Link to="/" className="hover:underline">Home</Link> / <Link to={`/category/${category}`} className="hover:underline">{category}</Link> / {name}
                </div>
            </div>

            {/* Cashback Banner (Unchanged) */}
            <div className="container mx-auto px-4 mb-8">
                <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold">
                    Earn 10% Cashback on Every App Order
                </div>
            </div>

            {/* Product Detail */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div>
                        <div className="bg-blue-light rounded-2xl overflow-hidden mb-4">
                            <img 
                                src={`${product.image}`} 
                                alt={name} 
                                className="aspect-[3/4] w-full object-cover"
                            />
                        </div>
                        {/* Color Selector and Size */}
                        <div className="flex gap-2">
                            <div className="text-sm font-semibold text-navy">Colours</div>
                            <div className="flex gap-2">
                                {colors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={`w-6 h-6 rounded-full border-2 ${
                                            selectedColor === color.name ? "border-navy" : "border-gray-300"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    />
                                ))}
                            </div>
                            <div className="ml-auto text-sm text-muted-foreground">
                                Size: <span className="font-semibold text-navy">One Size</span>
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < currentRating ? 'fill-accent text-accent' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">(Write a review)</span>
                        </div>

                        {/* Store Link */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-muted-foreground">Visit the Store: <Link to={`/vendor/${vendorId}`} className="text-accent hover:underline">{product.vendorName || "Store Name"}</Link></span>
                        </div>

                        {/* Product Title */}
                        <h1 className="text-3xl font-bold text-navy mb-4">
                            {name}
                            <span className="text-base font-normal text-muted-foreground block">({product.sku || 'T12636'}_{selectedColor}_Onesize)</span>
                        </h1>

                        {/* Offer Tag */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-accent text-white px-3 py-1 rounded text-sm font-semibold">
                                Limited Offer
                            </div>
                            <span className="text-lg font-bold text-accent">{discount || 68}% Off</span>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-bold text-navy">{formatCurrency(price)}</span>
                                <span className="text-xl text-muted-foreground line-through">MRP: {formatCurrency(originalPrice)}</span>
                            </div>
                        </div>

                        {/* Offers (Static) */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-navy mb-3">Offers</h3>
                            <div className="grid gap-3">
                                <div className="bg-secondary p-3 rounded-lg">
                                    <p className="text-sm">Earn 10% Cashback on Every App Order</p>
                                </div>
                                <div className="bg-secondary p-3 rounded-lg">
                                    <p className="text-sm">Rs. 500 Off for App Download</p>
                                </div>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-sm font-semibold text-navy">Quantity:</span>
                            <div className="flex items-center border rounded-lg overflow-hidden">
                                <Button 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                                    className="h-8 w-8 p-0 bg-gray-100 text-navy hover:bg-gray-200"
                                >
                                    -
                                </Button>
                                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                                <Button 
                                    onClick={() => setQuantity(q => q + 1)} 
                                    className="h-8 w-8 p-0 bg-gray-100 text-navy hover:bg-gray-200"
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        {/* Product Attributes */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-navy">Size:</span>
                                <span className="text-sm">One Size</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-navy">Style Name:</span>
                                <span className="text-sm">Saree</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-navy">Colour:</span>
                                <span className="text-sm">{selectedColor}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mb-8">
                            <Button 
                                onClick={handleAddToCart}
                                className="flex-1 bg-accent hover:bg-accent/90 text-white"
                            >
                                Add to Cart
                            </Button>
                            <Button 
                                onClick={handleBuyNow}
                                className="flex-1 bg-navy hover:bg-navy/90 text-white"
                            >
                                Buy Now
                            </Button>
                        </div>

                        {/* Product Details Box */}
                        <div className="bg-secondary p-6 rounded-lg">
                            <h3 className="font-bold text-navy mb-3">Product details</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-semibold text-navy">Material composition:</span> {product.details?.composition || 'Synthetic'}
                            </p>
                            <p className="text-sm text-muted-foreground">{product.description || 'Women\'s lightweight floral print saree'}</p>
                            <button className="text-sm text-accent mt-2 hover:underline">See more ↓</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Similar Styles (Dynamic) */}
          {similarProducts.length > 0 && (
  <section className="container mx-auto px-4 py-12">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl font-bold text-navy">
        Similar Styles in {category}
      </h2>

      {/* View All Button */}
      <button
        onClick={() => navigate(`/category/${category}`)}
        className="text-sm px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/80 transition"
      >
        View All
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
      {similarProducts.map((p) => (
        <div
          key={p._id}
          className="border rounded-xl p-3 shadow-md hover:shadow-xl transition cursor-pointer group"
          onClick={() => navigate(`/product/${p._id}`)}
        >
          <img
            src={`${p.image}`}
            alt={p.name}
            className="w-full h-48 object-cover rounded-md group-hover:scale-105 transition"
          />

          <h3 className="font-semibold mt-3 text-gray-900 truncate">
            {p.name}
          </h3>

          <p className="text-navy font-bold mt-1">₹{p.price}</p>

          {/* View Product Button */}
          <button
            className="w-full mt-3 border border-navy text-navy py-2 rounded-lg hover:bg-navy hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${p._id}`);
            }}
          >
            View Product
          </button>
        </div>
      ))}
    </div>
  </section>
)}


            <Footer />
        </div>
    );
};

export default ProductDetail;