import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Store, Filter, Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "https://api.apexbee.in/api";

type Business = {
  _id: string;
  vendorId: string;
  businessName: string;
  phone?: string;
  email?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  businessTypes?: string[];
  industryType?: string;
};

type CategoryObj = {
  _id: string;
  name: string;
  image?: string;
};

type Product = {
  _id: string;
  vendorId: string;
  itemName: string;
  images: string[];
  afterDiscount?: number;
  userPrice?: number;
  category?: CategoryObj; // populated
  subcategory?: string;
  status?: string;
};

const StorePage = () => {
  const { id } = useParams(); // id = businessId
  const [store, setStore] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "ALL">("ALL");

  // ✅ Fetch store info
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoadingStore(true);
        setError(null);

        const res = await fetch(`${API_BASE}/business/${id}`);
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load store");
        }

        setStore(json.data);
      } catch (e: any) {
        setStore(null);
        setError(e?.message || "Failed to load store");
      } finally {
        setLoadingStore(false);
      }
    })();
  }, [id]);

  // ✅ Fetch vendor products (needs vendorId from store)
  useEffect(() => {
    if (!store?.vendorId) return;

    (async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${API_BASE}/products/vendor/${store.vendorId}`);
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load products");
        }

        setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (e: any) {
        setProducts([]);
        setError(e?.message || "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [store?.vendorId]);

  // ✅ Build unique categories from vendor products
  const vendorCategories = useMemo(() => {
    const map = new Map<string, CategoryObj>();

    for (const p of products) {
      if (p.category && p.category._id) {
        map.set(p.category._id, p.category);
      }
    }

    return Array.from(map.values());
  }, [products]);

  // ✅ Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === "ALL") return products;
    return products.filter((p) => p.category?._id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const formatPrice = (n?: number) =>
    typeof n === "number" ? `₹${n.toFixed(0)}` : "₹0";

  if (loadingStore) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="rounded-3xl border bg-white p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-red-600 font-semibold">{error || "Store not found"}</p>
          <Link to="/" className="text-accent underline mt-4 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ✅ STORE BANNER */}
      <section className="container mx-auto px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-navy to-navy/80 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          </div>

          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row gap-6 sm:items-center">
            <div className="h-24 w-24 rounded-2xl bg-white/15 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
              {store.logo ? (
                <img src={store.logo} alt={store.businessName} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-10 w-10 text-white/80" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold truncate">
                {store.businessName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
                <div className="inline-flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {store.city}, {store.state} {store.pinCode ? `- ${store.pinCode}` : ""}
                  </span>
                </div>

                {store.businessTypes?.length ? (
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                    {store.businessTypes.join(" • ")}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-white/75 line-clamp-2">
                {store.address}
              </p>
            </div>

            <div className="flex gap-3">
              {store.phone ? (
                <Button
                  className="bg-white text-navy hover:bg-white/90"
                  onClick={() => window.open(`tel:${store.phone}`, "_self")}
                >
                  Call Store
                </Button>
              ) : null}

              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setSelectedCategoryId("ALL")}
              >
                View All
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ CATEGORIES USED BY VENDOR */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-navy">Categories</h2>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Tap to filter products
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* ALL */}
          <button
            onClick={() => setSelectedCategoryId("ALL")}
            className={`px-4 py-2 rounded-full border text-sm font-semibold transition ${
              selectedCategoryId === "ALL"
                ? "bg-accent text-white border-accent"
                : "bg-white text-navy hover:bg-muted/30"
            }`}
          >
            All
          </button>

          {vendorCategories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategoryId(c._id)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold transition whitespace-nowrap ${
                selectedCategoryId === c._id
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-navy hover:bg-muted/30"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* ✅ PRODUCTS GRID */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy">Products</h2>
          {loadingProducts && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </div>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-4 space-y-3">
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground">
              No products found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <Link
                to={`/product/${p._id}`}
                key={p._id}
                className="group rounded-2xl border bg-white overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-44 bg-muted/20 overflow-hidden">
                  <img
                    src={p.images?.[0] || "/placeholder-product.png"}
                    alt={p.itemName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-navy line-clamp-2 min-h-[40px]">
                    {p.itemName}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-navy">
                      {formatPrice(p.afterDiscount)}
                    </span>

                    {p.userPrice ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(p.userPrice)}
                      </span>
                    ) : null}
                  </div>

                  {p.category?.name ? (
                    <div className="mt-3 text-xs inline-flex px-2 py-1 rounded-full bg-blue-light text-navy">
                      {p.category.name}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default StorePage;
