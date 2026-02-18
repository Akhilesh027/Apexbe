import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Flame, Sparkles, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "https://api.apexbee.in/api";
const LOCATION_KEY = "user_location";

/** ---------------------------
 * Types
 * -------------------------- */
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
  afterDiscount?: number | string | null;
  userPrice?: number | string | null;
  discount?: number | string | null;
  rating?: number;
  reviews?: number;
  tag?: string;
};

/** ---------------------------
 * Helpers
 * -------------------------- */
const onlyDigits = (s: any) => String(s ?? "").replace(/\D/g, "");
const normPincode = (p: any) => onlyDigits(p).slice(0, 6);

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (n: number) => `₹${n.toFixed(2)}`;

/**
 * ✅ Price logic (Correct)
 * Priority:
 * 1) afterDiscount (final customer price)
 * 2) userPrice (MRP) if afterDiscount missing
 * If both missing => 0
 */
const getDisplayPrices = (p: Product) => {
  const after = toNumber(p.afterDiscount);
  const mrp = toNumber(p.userPrice);

  if (after > 0) {
    const showMrp = mrp > after ? mrp : 0;
    const percentOff = showMrp ? Math.round(((showMrp - after) / showMrp) * 100) : 0;
    return { price: after, mrp: showMrp, percentOff };
  }

  if (mrp > 0) return { price: mrp, mrp: 0, percentOff: 0 };

  return { price: 0, mrp: 0, percentOff: 0 };
};

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<StoredLocation | null>(null);

  // Nearby shops
  const [nearbyShops, setNearbyShops] = useState<Business[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  // Featured / Deals products
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
   * -------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try {
        setUserLocation(JSON.parse(saved));
      } catch {
        localStorage.removeItem(LOCATION_KEY);
        setOpenLocationModal(true);
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

      const transformed: CategoryItem[] = list.map((cat: any) => {
        const name: string = String(cat?.name || "category");
        const label = name.length ? name.charAt(0).toUpperCase() + name.slice(1) : "Category";
        const to = `/category/${encodeURIComponent(name)}`;
        return { id: cat._id, label, to, image: cat.image };
      });

      setCategories(transformed);
    } catch (e) {
      console.error("Error fetching categories:", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  /** ---------------------------
   * Fetch products (reuse)
   * -------------------------- */
  const fetchProducts = async (limit: number) => {
    const res = await fetch(`${API_BASE}/products?limit=${limit}`);
    const json = await res.json();

    const list =
      Array.isArray(json?.products) ? json.products :
      Array.isArray(json?.data) ? json.data :
      Array.isArray(json) ? json :
      [];

    return list as Product[];
  };

  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);
      const list = await fetchProducts(10); // ✅ upto 10 products
      setFeaturedProducts(list);
    } catch (e) {
      console.error("fetchFeaturedProducts:", e);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchDealsProducts = async () => {
    try {
      setDealsLoading(true);
      const list = await fetchProducts(10); // ✅ upto 10 products
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
      const pin = normPincode(pincode);
      if (pin.length !== 6) return;

      setShopsLoading(true);
      setShopsError(null);

      const res = await fetch(
        `${API_BASE}/business/by-pincode?pincode=${encodeURIComponent(pin)}&limit=50`
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

  useEffect(() => {
    const pin = normPincode(userLocation?.pincode);
    if (pin.length !== 6) return;
    fetchNearbyShops(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.pincode]);

  /** ---------------------------
   * UI helpers
   * -------------------------- */
  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (!container) return;
    const amount = 240;
    container.scrollLeft += direction === "left" ? -amount : amount;
  };

  // ✅ horizontal scrollers for featured/deals
  const scrollRow = (id: string, direction: "left" | "right") => {
    const el = document.getElementById(id);
    if (!el) return;
    const amount = 420;
    el.scrollLeft += direction === "left" ? -amount : amount;
  };

  const handleViewAllCategories = () => navigate("/categories");

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = normPincode(userLocation.pincode);
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  const renderProductCard = (p: Product) => {
    const title = p.itemName || p.name || "Product";
    const img = p.images?.[0] || "/placeholder-product.png";
    const { price, mrp, percentOff } = getDisplayPrices(p);

    return (
      <button
        key={p._id}
        onClick={() => navigate(`/product/${p._id}`)}
        className="text-left bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group min-w-[170px] sm:min-w-[220px]"
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
            <span className="text-lg font-bold text-navy">{price > 0 ? formatINR(price) : "₹—"}</span>

            {mrp > 0 && (
              <span className="text-sm text-muted-foreground line-through">{formatINR(mrp)}</span>
            )}

            {percentOff > 0 && (
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                {percentOff}% OFF
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-light text-navy font-semibold">
              ⭐ {p.rating || 4.0}
            </span>
            <span className="text-xs text-muted-foreground">({p.reviews || 0})</span>

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

      {/* HERO */}
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border bg-gradient-to-r from-navy to-navy-dark text-white shadow-md">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1170&auto=format&fit=crop"
              alt="banner"
              className="w-full h-full object-cover"
            />
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
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
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
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scrollCategories("left")}>
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

          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scrollCategories("right")}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Featured (✅ one row horizontal scroll) */}
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
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[170px] sm:min-w-[220px] rounded-2xl border bg-white overflow-hidden">
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => scrollRow("featured-row", "left")}
              aria-label="Scroll featured left"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div id="featured-row" className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth flex-1 pb-2">
              {featuredProducts.slice(0, 10).map(renderProductCard)}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => scrollRow("featured-row", "right")}
              aria-label="Scroll featured right"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </section>

      {/* Deals (✅ one row horizontal scroll) */}
      <section className="container mx-auto px-4 pb-12">
        <div className="rounded-3xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold bg-white/70 px-3 py-1 rounded-full text-yellow-800">
                <Flame className="h-4 w-4" /> DAILY DEALS
              </div>
              <h2 className="text-2xl font-extrabold text-navy mt-3">Daily Deals</h2>
              <p className="text-sm text-muted-foreground mt-1">Limited time offers. Grab them before they end!</p>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-navy font-bold" onClick={() => navigate("/deals")}>
              See All Deals
            </Button>
          </div>

          {dealsLoading ? (
            <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[170px] sm:min-w-[220px] rounded-2xl border bg-white overflow-hidden">
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => scrollRow("deals-row", "left")}
                aria-label="Scroll deals left"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div id="deals-row" className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth flex-1 pb-2">
                {dealProducts.slice(0, 10).map(renderProductCard)}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => scrollRow("deals-row", "right")}
                aria-label="Scroll deals right"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Nearby Stores */}
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
                {normPincode(userLocation?.pincode) || "—"}
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

        {!normPincode(userLocation?.pincode) ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground mb-4">Set your location to see nearby shops.</p>
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
            <Button className="mt-4" variant="outline" onClick={() => fetchNearbyShops(userLocation!.pincode)}>
              Retry
            </Button>
          </div>
        ) : nearbyShops.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground">No shops found for this pincode. Try changing location.</p>
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
                          <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-muted text-navy border">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{shop.address}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Button className="flex-1" onClick={() => navigate(`/business/${shop._id}`)}>
                    View Store
                  </Button>

                  {shop.phone ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`tel:${shop.phone}`, "_self")}
                    >
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

      {/* Location Modal */}
      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onConfirm={(loc) => {
          setUserLocation(loc);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
          const pin = normPincode(loc?.pincode);
          if (pin) fetchNearbyShops(pin);
        }}
      />

      <Footer />
    </div>
  );
};

export default Home;