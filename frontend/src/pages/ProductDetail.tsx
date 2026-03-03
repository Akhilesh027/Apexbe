import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Share2, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// Helper function for currency formatting
const formatCurrency = (amount: any) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const initialProduct: any = {
  _id: null,
  itemName: "Loading Product...",
  categoryName: "Loading",
  salesPrice: 0,
  userPrice: 0,
  afterDiscount: 0,
  discount: 0,
  images: ["/placeholder.svg"],
  rating: 4,
  vendorId: null,
  description: "Product details loading...",
  skuCode: "N/A",
};

type Review = {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  createdAt?: string;
  userId?: { _id?: string; name?: string; email?: string } | string;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);

  // ✅ Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // 🔑 Get referral code
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const referralCode = user?.referralCode || "";

  const baseUrl = window.location.href.split("?")[0];
  const shareUrl = referralCode ? `${baseUrl}?ref=${referralCode}` : baseUrl;

  const shareText = referralCode
    ? `Check this product on ApexBee!\nUse my referral code ${referralCode} and get ₹50 on signup!`
    : `Check this product on ApexBee!`;

  useEffect(() => {
    if (!id) return;

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.apexbee.in/api/product/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          setProduct(data);
          setMainImageIndex(0);

          // fetch similar
          fetchSimilarProducts(data.categoryName, data._id);

          // ✅ fetch reviews
          fetchReviews(data._id);
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarProducts = async (categoryName: string, currentId: string) => {
      try {
        const res = await fetch(
          `https://api.apexbee.in/api/products?category=${encodeURIComponent(
            categoryName || ""
          )}&excludeId=${currentId}&limit=4`
        );
        const data = await res.json();
        setSimilarProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      }
    };

    // ✅ Reviews fetcher
    const fetchReviews = async (productId: string) => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        // 🔥 You need this API in backend:
        // GET /api/reviews/product/:productId
        const res = await fetch(`https://api.apexbee.in/api/reviews/product/${productId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || "Failed to fetch reviews");

        const list = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        setReviews(list);
      } catch (e: any) {
        console.error("fetchReviews:", e);
        setReviews([]);
        setReviewsError(e?.message || "Failed to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // ⭐ Review stats
  const reviewStats = useMemo(() => {
    const count = reviews.length || 0;
    if (!count) return { avg: Number(product?.rating || 0) || 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = sum / count;
    return { avg, count };
  }, [reviews, product?.rating]);

  // 📡 Share Handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.itemName,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      setShowShare(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("Referral link copied!");
  };

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`);
  };

  const facebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  };

  const twitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    );
  };

  // Add to Cart
  const handleAddToCart = async () => {
    if (!user?.id && !user?._id) return alert("Please login first.");

    const userId = user?.id || user?._id;

    const item = {
      userId,
      productId: product._id,
      name: product.itemName,
      price: product.afterDiscount,
      image: product.images?.[0],
      quantity,
      selectedColor: "default",
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
    } catch {
      alert("Server error");
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    const subtotal = Number(product.afterDiscount || 0) * quantity;
    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + shipping;

    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, quantity }],
        subtotal,
        discount: 0,
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

  const currentRating = Math.round(reviewStats.avg || product.rating || 4);

  const renderStars = (value: number) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? "fill-accent text-accent" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const safeUserName = (r: Review) => {
    const u: any = r.userId;
    if (!u) return "Customer";
    if (typeof u === "string") return "Customer";
    return u.name || u.email || "Customer";
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* LEFT IMAGES */}
          <div>
            <div className="bg-blue-light rounded-2xl overflow-hidden mb-4">
              <img
                src={product.images?.[mainImageIndex] || "/placeholder.svg"}
                alt={product.itemName || "Product"}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto">
              {product.images?.map((img: string, index: number) => (
                <div
                  key={index}
                  onClick={() => setMainImageIndex(index)}
                  className={`w-20 h-20 rounded-lg cursor-pointer p-1 border ${
                    index === mainImageIndex ? "border-accent" : "border-gray-300"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT DETAILS */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(currentRating)}
              <span className="text-sm text-muted-foreground">
                {reviewStats.count ? `(${reviewStats.count} reviews)` : "(No reviews yet)"}
              </span>

              <button onClick={handleShare} className="ml-auto text-accent flex items-center gap-1">
                <Share2 size={18} /> Share
              </button>
            </div>

            <h1 className="text-3xl font-bold text-navy mb-4">{product.itemName}</h1>

            <div className="mb-6">
              <span className="text-5xl font-bold text-navy">{formatCurrency(product.afterDiscount)}</span>
              {Number(product.userPrice || 0) > Number(product.afterDiscount || 0) && (
                <span className="text-xl line-through text-gray-500 ml-2">
                  {formatCurrency(product.userPrice)}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6 flex items-center gap-4">
              Quantity:
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  -
                </Button>
                <span className="px-4">{quantity}</span>
                <Button type="button" onClick={() => setQuantity((q) => q + 1)}>
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleAddToCart} className="flex-1 bg-accent text-white">
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 bg-navy text-white">
                Buy Now
              </Button>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg mt-6">
              <h3 className="font-bold mb-2">Product Details</h3>
              <p className="text-sm">{product.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ REVIEWS SECTION */}
      <section className="container mx-auto px-4 pb-10">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-navy">Customer Reviews</h2>
            <p className="text-sm text-muted-foreground">
              {reviewStats.count ? `Average ${reviewStats.avg.toFixed(1)} / 5` : "Be the first to review this product"}
            </p>
          </div>

          {/* Optional: Later you can navigate to write review page */}
          {/* <Button variant="outline" onClick={() => navigate(`/product/${product._id}/review`)}>Write Review</Button> */}
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-28 bg-gray-100 rounded" />
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                </div>
                <div className="mt-3 h-4 w-2/3 bg-gray-100 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviewsError ? (
          <div className="rounded-2xl border bg-red-50 p-5 text-red-700">
            {reviewsError}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-8 text-center text-muted-foreground">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-2xl border bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {renderStars(Math.round(Number(r.rating || 0)))}
                    <span className="text-sm font-semibold text-navy">{safeUserName(r)}</span>
                    {r.isVerifiedPurchase && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>

                {r.title && <h4 className="mt-3 font-bold text-navy">{r.title}</h4>}
                {r.comment && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}

                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-navy mb-2">
                      <ImageIcon className="h-4 w-4" />
                      Photos
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {r.images.slice(0, 10).map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer">
                          <img
                            src={img}
                            alt="review"
                            className="h-20 w-full object-cover rounded-lg border hover:opacity-90"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SHARE POPUP */}
      {showShare && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center">
          <div className="bg-white w-full p-6 rounded-t-2xl shadow-lg">
            <h2 className="font-bold text-lg mb-3 text-center">Share Product</h2>

            {referralCode ? (
              <p className="text-center font-semibold text-primary mb-3">
                Referral Code: {referralCode} — Get ₹50 on signup!
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground mb-3">
                Share this product
              </p>
            )}

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

            <Button onClick={() => setShowShare(false)} className="w-full mt-4 bg-red-500 text-white">
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