import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Share2 } from "lucide-react";
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
    const [mainImageIndex, setMainImageIndex] = useState(0);

    const [showShare, setShowShare] = useState(false); // NEW

    const colors = [
        { name: "orange", hex: "#ff8c42" },
        { name: "purple", hex: "#7c3aed" },
        { name: "teal", hex: "#14b8a6" },
        { name: "cyan", hex: "#06b6d4" },
    ];

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
                    setMainImageIndex(0);
                }
            } catch (error) {
                console.error("Network error:", error);
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
                setSimilarProducts(data.products || []);
            } catch (error) {
                console.error("Error fetching similar products:", error);
            }
        };

        fetchProductDetails();
    }, [id]);

    // 📌 SHARE HANDLER
    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.itemName,
                    text: "Check out this product on ApexBee!",
                    url,
                });
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            setShowShare(true);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    const whatsappShare = () => {
        window.open(`https://wa.me/?text=Check this product: ${window.location.href}`);
    };

    const facebookShare = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`);
    };

    const twitterShare = () => {
        window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=Check this product`);
    };

    // Add to Cart
    const handleAddToCart = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return alert("Please login first.");

        const item = {
            userId: user.id,
            productId: product._id,
            name: product.itemName,
            price: product.finalAmount,
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
            alert("Server error");
        }
    };

    const handleBuyNow = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please login first.");
            navigate("/login");
            return;
        }

        const subtotal = product.finalAmount * quantity;
        const discountAmount =
            product.userPrice > product.afterDiscount
                ? (product.userPrice - product.afterDiscount) * quantity
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
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-primary">Loading Product Details...</p>
            </div>
        );
    }

    const currentRating = Math.round(product.rating || 4);

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Product Section */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-12">

                    {/* LEFT SIDE IMAGES */}
                    <div>
                        <div className="bg-blue-light rounded-2xl overflow-hidden mb-4">
                            <img
                                src={product.images?.[mainImageIndex]}
                                className="aspect-[3/4] w-full object-cover"
                            />
                        </div>

                        <div className="flex gap-3 overflow-x-auto">
                            {product.images?.map((img, index) => (
                                <div
                                    key={index}
                                    onClick={() => setMainImageIndex(index)}
                                    className={`w-20 h-20 rounded-lg cursor-pointer p-1 border 
                                        ${index === mainImageIndex ? "border-accent" : "border-gray-300"}`}
                                >
                                    <img src={img} className="w-full h-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PRODUCT DETAILS */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < currentRating ? "fill-accent text-accent" : "text-gray-300"}`} />
                            ))}
                            <span className="text-sm text-muted-foreground">(Write a review)</span>

                            {/* SHARE ICON */}
                            <button onClick={handleShare} className="ml-auto text-accent flex items-center gap-1">
                                <Share2 size={18} /> Share
                            </button>
                        </div>

                        <h1 className="text-3xl font-bold text-navy mb-4">{product.itemName}</h1>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-navy">{formatCurrency(product.finalAmount)}</span>
                            <span className="text-xl line-through text-gray-500 ml-2">
                                {formatCurrency(product.userPrice)}
                            </span>
                        </div>

                        {/* Quantity */}
                        <div className="mb-6 flex items-center gap-4">
                            Quantity:
                            <div className="flex items-center border rounded-lg overflow-hidden">
                                <Button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                                <span className="px-4">{quantity}</span>
                                <Button onClick={() => setQuantity(q => q + 1)}>+</Button>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-4">
                            <Button onClick={handleAddToCart} className="flex-1 bg-accent text-white">
                                Add to Cart
                            </Button>
                            <Button onClick={handleBuyNow} className="flex-1 bg-navy text-white">
                                Buy Now
                            </Button>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="bg-gray-100 p-6 rounded-lg mt-6">
                            <h3 className="font-bold mb-2">Product Details</h3>
                            <p className="text-sm">{product.description}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* -------- SHARE POPUP -------- */}
            {showShare && (
                <div className="fixed inset-0 bg-black/30 flex items-end justify-center">
                    <div className="bg-white w-full p-6 rounded-t-2xl shadow-lg">
                        <h2 className="font-bold text-lg mb-3 text-center">Share Product</h2>

                        <div className="flex flex-col gap-3">
                            <Button onClick={copyLink} className="bg-gray-100 text-navy">
                                Copy Link
                            </Button>
                            <Button onClick={whatsappShare} className="bg-green-500 text-white">
                                WhatsApp
                            </Button>
                            <Button onClick={facebookShare} className="bg-blue-600 text-white">
                                Facebook
                            </Button>
                            <Button onClick={twitterShare} className="bg-black text-white">
                                Twitter
                            </Button>
                        </div>

                        <Button
                            onClick={() => setShowShare(false)}
                            className="w-full mt-4 bg-red-500 text-white"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;
