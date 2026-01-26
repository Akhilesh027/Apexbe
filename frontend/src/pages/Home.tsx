import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Flame, Sparkles, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaveSection from "@/components/WaveSection";
import LocationModal from "@/components/LocationModal";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import grocary from "../Web images/Web images/grocary.png";

const API_BASE = "https://api.apexbee.in/api";
const LOCATION_KEY = "user_location";

type CategoryItem = {
  id: string;
  label: string;
  to: string;
  image?: string;
};

type StoredLocation = {
  lat: number;
  lng: number;
  colony: string;
  pincode: string;
  address: string;
};

type Business = {
  _id: string;
  businessName: string;
  phone?: string;
  email?: string;
  businessTypes?: string[];
  industryType?: string;
  logo?: string;
  address?: string;
  state?: string;
  city?: string;
  pinCode: string;
  createdAt?: string;
};

type Product = {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  afterDiscount?: number;
  userPrice?: number;
  rating?: number;
  reviews?: number;
  tag?: string;
};

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<StoredLocation | null>(null);

  // ✅ Nearby shops
  const [nearbyShops, setNearbyShops] = useState<Business[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  // ✅ Featured / Deals products
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);

  /** ---------------------------
   * Auth: Check login
   * -------------------------- */
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setLoggedInUser(JSON.parse(user));
  }, []);

  /** ---------------------------
   * Location: load from localStorage
   * If not found => open modal
   * -------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try {
        setUserLocation(JSON.parse(saved));
      } catch {
        localStorage.removeItem(LOCATION_KEY);
      }
    } else {
      setOpenLocationModal(true);
    }
  }, []);

  /** ---------------------------
   * Fetch categories
   * -------------------------- */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const list = Array.isArray(data?.categories) ? data.categories : [];

      const transformed: CategoryItem[] = list.map((cat: any) => ({
        id: cat._id,
        label:
          typeof cat.name === "string" && cat.name.length
            ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
            : "Category",
        to: `/category/${cat.name}`,
        image: cat.image,
      }));

      setCategories(transformed);
    } catch (e) {
      console.error("Error fetching categories:", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  /** ---------------------------
   * Fetch featured products
   * -------------------------- */
  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);

      // ✅ try featured endpoint
      let res = await fetch(`${API_BASE}/products?limit=8`);
      if (!res.ok) {
        // fallback
        res = await fetch(`${API_BASE}/products?limit=8`);
      }

      const json = await res.json();
      const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : [];
      setFeaturedProducts(list);
    } catch (e) {
      console.error("fetchFeaturedProducts:", e);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  /** ---------------------------
   * Fetch deals products
   * -------------------------- */
  const fetchDealsProducts = async () => {
    try {
      setDealsLoading(true);

      // ✅ try deals endpoint
      let res = await fetch(`${API_BASE}/products?limit=8`);
      if (!res.ok) {
        // fallback: reuse products with limit
        res = await fetch(`${API_BASE}/products?limit=8`);
      }

      const json = await res.json();
      const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : [];
      setDealProducts(list);
    } catch (e) {
      console.error("fetchDealsProducts:", e);
      setDealProducts([]);
    } finally {
      setDealsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
    fetchDealsProducts();
  }, []);

  /** ---------------------------
   * Fetch nearby shops by PINCODE
   * -------------------------- */
  const fetchNearbyShops = async (pincode: string) => {
    try {
      setShopsLoading(true);
      setShopsError(null);

      const res = await fetch(
        `${API_BASE}/business/by-pincode?pincode=${encodeURIComponent(pincode)}&limit=50`
      );

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch nearby shops");
      }

      const list: Business[] = Array.isArray(json?.data) ? json.data : [];
      setNearbyShops(list);
    } catch (e: any) {
      console.error("fetchNearbyShops error:", e);
      setNearbyShops([]);
      setShopsError(e?.message || "Failed to load nearby shops");
    } finally {
      setShopsLoading(false);
    }
  };

  // ✅ Auto fetch when pincode changes
  useEffect(() => {
    const pin = userLocation?.pincode?.trim();
    if (!pin) return;
    fetchNearbyShops(pin);
  }, [userLocation?.pincode]);

  /** ---------------------------
   * Category scroll (desktop arrows)
   * -------------------------- */
  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (!container) return;
    const amount = 240;
    container.scrollLeft += direction === "left" ? -amount : amount;
  };

  const handleViewAllCategories = () => navigate("/categories");

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = userLocation.pincode?.trim();
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  const renderProductCard = (p: Product) => {
    const title = p.itemName || p.name || "Product";
    const img = p.images?.[0] || "/placeholder-product.png";
    const price = typeof p.afterDiscount === "number" ? `₹${p.afterDiscount}` : "₹—";
    const mrp = typeof p.userPrice === "number" ? `₹${p.userPrice}` : null;

    return (
      <button
        key={p._id}
        onClick={() => navigate(`/product/${p._id}`)}
        className="text-left bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
      >
        <div className="h-44 bg-muted overflow-hidden">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <p className="font-semibold text-navy line-clamp-2">{title}</p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-navy">{price}</span>
            {mrp && (
              <span className="text-sm text-muted-foreground line-through">{mrp}</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-light text-navy font-semibold">
              ⭐ {p.rating || 4.0}
            </span>
            <span className="text-xs text-muted-foreground">
              ({p.reviews || 0})
            </span>

            {p.tag && (
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                {p.tag}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top Notice if NOT logged in */}
      {!loggedInUser && (
        <div className="bg-blue-light border-b text-center py-2 text-sm">
          On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
        </div>
      )}

      {/* Location strip */}
      <div className="container mx-auto px-4 pt-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-5 w-5 text-accent flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">Delivery Location</p>
              <p className="text-xs text-muted-foreground truncate">{locationLabel}</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="border-accent text-accent hover:bg-accent hover:text-white"
            onClick={() => setOpenLocationModal(true)}
          >
            {userLocation ? "Change" : "Set"}
          </Button>
        </div>
      </div>

      {/* ✅ HERO (Banner layout) */}
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols gap-6">
        {/* Big banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border bg-gradient-to-r from-navy to-navy-dark text-white shadow-md">
          <div className="absolute inset-0 opacity-20">
            <img src='https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt="banner" className="w-full h-full object-cover" />
          </div>

          <div className="relative p-8 md:p-10">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="h-4 w-4" /> NEW ARRIVALS
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
              Shop local stores near you <br /> with best wholesale deals
            </h1>
            <p className="mt-3 text-white/80 max-w-xl">
              Explore categories, featured products, and daily deals. Fast delivery options based on your pincode.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button className="bg-accent hover:bg-accent/90 text-white" onClick={() => navigate("/categories")}>
                Explore Categories
              </Button>
              <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={() => navigate("/local-stores")}
              >
                Browse Local Stores
              </Button>
            </div>
          </div>
        </div>

        
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy">Explore Categories</h2>
          <Button
            variant="outline"
            className="text-accent border-accent hover:bg-accent hover:text-white"
            onClick={handleViewAllCategories}
          >
            View All
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => scrollCategories("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div
            id="categories-container"
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth flex-1 pb-1"
          >
            {loadingCategories ? (
              Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2 min-w-[90px]">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="w-full rounded-xl border bg-muted/20 p-6 text-center text-muted-foreground">
                No categories available.
              </div>
            ) : (
              categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => navigate(category.to)}
                  className="flex flex-col items-center min-w-[92px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border bg-white">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm mt-2 text-center font-semibold text-navy group-hover:text-accent">
                    {category.label}
                  </p>
                </button>
              ))
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => scrollCategories("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ✅ FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy">Featured Products</h2>
            <p className="text-sm text-muted-foreground">Handpicked best items for you.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/products")}>
            View All
          </Button>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center text-muted-foreground">
            No featured products available.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featuredProducts.map(renderProductCard)}
          </div>
        )}
      </section>

      {/* ✅ DAILY DEALS */}
      <section className="container mx-auto px-4 pb-12">
        <div className="rounded-3xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold bg-white/70 px-3 py-1 rounded-full text-yellow-800">
                <Flame className="h-4 w-4" /> DAILY DEALS
              </div>
              <h2 className="text-2xl font-extrabold text-navy mt-3">Daily Seals / Deals</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Limited time offers. Grab them before they end!
              </p>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-navy font-bold" onClick={() => navigate("/deals")}>
              See All Deals
            </Button>
          </div>

          {dealsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border bg-white overflow-hidden">
                  <Skeleton className="h-44 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : dealProducts.length === 0 ? (
            <div className="rounded-2xl border bg-white/60 p-10 text-center text-muted-foreground">
              No deals available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {dealProducts.map(renderProductCard)}
            </div>
          )}
        </div>
      </section>

      {/* Coming soon: Wave */}
  
      {/* ✅ NEARBY STORES */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold bg-muted/40 px-3 py-1 rounded-full text-navy">
              <Store className="h-4 w-4" /> LOCAL STORES
            </div>
            <h2 className="text-2xl font-bold text-navy mt-2">Near By Stores</h2>
            <p className="text-sm text-muted-foreground">
              Showing shops for{" "}
              <span className="font-semibold text-navy">
                {userLocation?.colony ? `${userLocation.colony} - ` : ""}
                {userLocation?.pincode || "—"}
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-white"
              onClick={() => setOpenLocationModal(true)}
            >
              Change Location
            </Button>

            {userLocation?.pincode && (
              <Button variant="outline" onClick={() => fetchNearbyShops(userLocation.pincode)}>
                Refresh
              </Button>
            )}
          </div>
        </div>

        {!userLocation?.pincode ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Set your location to see nearby shops.
            </p>
            <Button onClick={() => setOpenLocationModal(true)}>Set Location</Button>
          </div>
        ) : shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : shopsError ? (
          <div className="rounded-2xl border bg-red-50 p-10 text-center">
            <p className="text-red-600 font-semibold">{shopsError}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => fetchNearbyShops(userLocation.pincode)}
            >
              Retry
            </Button>
          </div>
        ) : nearbyShops.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground">
              No shops found for this pincode. Try changing location.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nearbyShops.map((shop) => (
              <div
                key={shop._id}
                className="group rounded-2xl border bg-white p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center border">
                    <img
                      src={shop.logo || "/placeholder.svg"}
                      alt={shop.businessName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-navy text-lg leading-tight truncate">
                          {shop.businessName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {shop.city}, {shop.state} • {shop.pinCode}
                        </p>
                      </div>

                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-light text-navy">
                        OPEN
                      </span>
                    </div>

                    {Array.isArray(shop.businessTypes) && shop.businessTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {shop.businessTypes.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full bg-muted text-navy border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {shop.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Button className="flex-1" onClick={() => navigate(`/business/${shop._id}`)}>
                    View Store
                  </Button>

                  {shop.phone ? (
                    <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${shop.phone}`, "_self")}>
                      Call
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      Call
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate("/local-stores")}>
            View All Local Stores
          </Button>
        </div>
      </section>

      {/* App Download Banner - Coming Soon */}
      <section className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full translate-x-20 translate-y-20" />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-bold">APP COMING SOON</span>
          </div>

          <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-gray-300">
            Our mobile app is currently in development. Get ready for an amazing shopping experience!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gray-600 text-gray-300 font-semibold px-8 py-3 cursor-not-allowed" disabled>
              📱 iOS - Coming Soon
            </Button>
            <Button className="bg-gray-600 text-gray-300 font-semibold px-8 py-3 cursor-not-allowed" disabled>
              🤖 Android - Coming Soon
            </Button>
          </div>
        </div>
      </section>

      {/* Location Modal */}
      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onConfirm={(loc) => {
          setUserLocation(loc);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
          if (loc?.pincode) fetchNearbyShops(loc.pincode);
        }}
      />

      <Footer />
    </div>
  );
};

export default Home;
