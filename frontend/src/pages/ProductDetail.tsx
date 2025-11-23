import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; 
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// Helper function for currency formatting
const formatCurrency = (amount) => {
    const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Placeholder product
const initialProduct = {
    _id: null,
    itemName: "Loading Product...",
    categoryName: "Loading",
    salesPrice: 0,
    afterDiscount: 0,
    discount: 0,
    images: ["/placeholder.svg"],
    rating: 4,
    vendorId: null,
    description: "Product details loading...",
    skuCode: "N/A",
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

    // Fetch product and similar products
    useEffect(() => {
        if (!id) return;

        const fetchProductDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://api.apexbee.in/api/product/${id}`);
                const data = await res.json();
                if (res.ok || data) {
                    setProduct(data);
                    fetchSimilarProducts(data.categoryName, data._id);
                } else {
                    setProduct(initialProduct);
                }
            } catch (error) {
                console.error("Network error:", error);
                setProduct(initialProduct);
            } finally {
                setLoading(false);
            }
        };

        const fetchSimilarProducts = async (categoryName, currentId) => {
            try {
                const res = await fetch(
                    `https://api.apexbee.in/api/products?category=${categoryName}&excludeId=${currentId}&limit=4`
                );
                const data = await res.json();
                setSimilarProducts(data.products || data || []);
            } catch (error) {
                console.error("Error fetching similar products:", error);
                setSimilarProducts([]);
            }
        };

        fetchProductDetails();
    }, [id]);

    // Add to Cart
    const handleAddToCart = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return alert("Please login first.");

        const item = {
            userId: user.id,
            productId: product._id,
            name: product.itemName,
            price: product.afterDiscount,
            image: product.images?.[0],
            quantity,
            selectedColor,
            vendorId: product.vendorId,
        };

        try {
            const res = await fetch("https://api.apexbee.in/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || "Failed to add to cart.");
            alert("Added to cart successfully!");
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Server error");
        }
    };

    // Buy Now
    const handleBuyNow = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please login first.");
            navigate("/login");
            return;
        }

        const subtotal = product.afterDiscount * quantity;
        const discountAmount =
            product.salesPrice > product.afterDiscount
                ? (product.salesPrice - product.afterDiscount) * quantity
                : 0;
        const shipping = subtotal > 0 ? 50 : 0;
        const total = subtotal + shipping;

        navigate("/checkout", {
            state: {
                cartItems: [{ ...product, quantity, selectedColor }],
                subtotal,
                discount: discountAmount,
                shipping,
                total,
                fromBuyNow: true,
            },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-xl font-medium text-primary">Loading Product Details...</p>
            </div>
        );
    }

    const currentRating = Math.round(product.rating || 4);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm text-muted-foreground">
                    <Link to="/" className="hover:underline">Home</Link> /{" "}
                    <Link to={`/category/${product.categoryName}`} className="hover:underline">{product.categoryName}</Link> / {product.itemName}
                </div>
            </div>

            {/* Cashback Banner */}
            <div className="container mx-auto px-4 mb-8">
                <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold">
                    Earn 10% Cashback on Every App Order
                </div>
            </div>

            {/* Product Detail */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Images & Colors */}
                    <div>
                        <div className="bg-blue-light rounded-2xl overflow-hidden mb-4">
                            <img
                                src={product.images?.[0] || "/placeholder.svg"}
                                alt={product.itemName}
                                className="aspect-[3/4] w-full object-cover"
                            />
                        </div>

                      
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < currentRating ? 'fill-accent text-accent' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-sm text-muted-foreground">(Write a review)</span>
                        </div>

                        <h1 className="text-3xl font-bold text-navy mb-4">
                            {product.itemName}
                            <span className="text-base font-normal text-muted-foreground block">
                                ({product.skuCode}_{selectedColor}_Onesize)
                            </span>
                        </h1>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-accent text-white px-3 py-1 rounded text-sm font-semibold">Limited Offer</div>
                            <span className="text-lg font-bold text-accent">{product.discount || 0}% Off</span>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-bold text-navy">{formatCurrency(product.afterDiscount)}</span>
                                <span className="text-xl text-muted-foreground line-through">MRP: {formatCurrency(product.userPrice)}</span>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-sm font-semibold text-navy">Quantity:</span>
                            <div className="flex items-center border rounded-lg overflow-hidden">
                                <Button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 p-0 bg-gray-100 text-navy hover:bg-gray-200">-</Button>
                                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                                <Button onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 p-0 bg-gray-100 text-navy hover:bg-gray-200">+</Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mb-8">
                            <Button onClick={handleAddToCart} className="flex-1 bg-accent hover:bg-accent/90 text-white">Add to Cart</Button>
                            <Button onClick={handleBuyNow} className="flex-1 bg-navy hover:bg-navy/90 text-white">Buy Now</Button>
                        </div>

                        {/* Product Details */}
                        <div className="bg-secondary p-6 rounded-lg">
                            <h3 className="font-bold text-navy mb-3">Product Details</h3>
                            <p className="text-sm text-muted-foreground mb-2">{product.description || "Description not available."}</p>
                            <button className="text-sm text-accent mt-2 hover:underline">See more ↓</button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ProductDetail;
