import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const API_BASE = "https://api.apexbee.in/api"; // ✅ change if needed

type Category = {
  _id: string;
  name: string;
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
  category?: string | Category; // could be "Electronics" OR {_id,name} OR id string
  tag?: string;
};

function money(n: any) {
  const v = typeof n === "number" && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat("en-IN").format(v);
}

/** ✅ Extract array from ANY common API response shape */
function extractArray<T = any>(json: any): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;

  const candidates = [
    json.products,
    json.items,
    json.data,
    json.result,
    json.results,
    json.payload,
    json?.products?.docs,
    json?.data?.docs,
    json?.items?.docs,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  return [];
}

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Filters state
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [selectedCats, setSelectedCats] = useState<string[]>(
    searchParams.get("cats")?.split(",").filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState<number>(
    Number(searchParams.get("min")) || 0
  );
  const [maxPrice, setMaxPrice] = useState<number>(
    Number(searchParams.get("max")) || 100000
  );
  const [minRating, setMinRating] = useState<number>(
    Number(searchParams.get("rating")) || 0
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");

  // Fetch categories + products
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/products`),
        ]);

        if (!catRes.ok) {
          throw new Error(`Categories API failed (${catRes.status})`);
        }
        if (!prodRes.ok) {
          // ✅ show exact status & likely reason
          throw new Error(`Products API failed (${prodRes.status}). Check /api/products route.`);
        }

        const catJson = await catRes.json();
        const prodJson = await prodRes.json();

        // ✅ DEBUG: check actual shapes in console
        console.log("✅ categories response:", catJson);
        console.log("✅ products response:", prodJson);

        const cats = extractArray<Category>(catJson);
        const prods = extractArray<Product>(prodJson);

        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (e: any) {
        console.error("❌ ProductsPage load error:", e);
        setErrorMsg(e?.message || "Failed to load products");
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const next: any = {};
    if (q.trim()) next.q = q.trim();
    if (selectedCats.length) next.cats = selectedCats.join(",");
    if (minPrice) next.min = String(minPrice);
    if (maxPrice) next.max = String(maxPrice);
    if (minRating) next.rating = String(minRating);
    if (sort && sort !== "relevance") next.sort = sort;

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedCats, minPrice, maxPrice, minRating, sort]);

  /** ✅ Build maps for category id->name and name->id (for string categories) */
  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c._id, c));
    return m;
  }, [categories]);

  const categoryIdByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.name.toLowerCase(), c._id));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...products];

    // Search
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) =>
        (p.itemName || p.name || "").toLowerCase().includes(s)
      );
    }

    // Category filter
    if (selectedCats.length) {
      list = list.filter((p) => {
        const raw = p.category;

        // Case 1: category stored as object
        if (raw && typeof raw === "object" && "_id" in raw) {
          return selectedCats.includes((raw as any)._id);
        }

        // Case 2: category stored as id string
        if (typeof raw === "string") {
          // if it matches id directly
          if (selectedCats.includes(raw)) return true;

          // if stored as category name string like "Electronics"
          const possibleId = categoryIdByName.get(raw.toLowerCase());
          if (possibleId && selectedCats.includes(possibleId)) return true;

          return false;
        }

        return false;
      });
    }

    // Price (fallback: use afterDiscount or userPrice)
    list = list.filter((p) => {
      const price = Number(p.afterDiscount ?? p.userPrice ?? 0);
      return price >= minPrice && price <= maxPrice;
    });

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => Number(p.rating || 0) >= minRating);
    }

    // Sorting
    if (sort === "price_low") {
      list.sort(
        (a, b) =>
          Number(a.afterDiscount ?? a.userPrice ?? 0) -
          Number(b.afterDiscount ?? b.userPrice ?? 0)
      );
    }
    if (sort === "price_high") {
      list.sort(
        (a, b) =>
          Number(b.afterDiscount ?? b.userPrice ?? 0) -
          Number(a.afterDiscount ?? a.userPrice ?? 0)
      );
    }
    if (sort === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, q, selectedCats, minPrice, maxPrice, minRating, sort, categoryIdByName]);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearAll = () => {
    setQ("");
    setSelectedCats([]);
    setMinPrice(0);
    setMaxPrice(100000);
    setMinRating(0);
    setSort("relevance");
  };

  const Filters = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>

      {/* Search */}
      <div>
        <label className="text-sm font-semibold text-navy">Search</label>
        <div className="relative mt-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="pr-10"
          />
          <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-semibold text-navy">Categories</label>
        <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted-foreground">No categories</div>
          ) : (
            categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => toggleCat(c._id)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                  selectedCats.includes(c._id)
                    ? "bg-accent text-white border-accent"
                    : "bg-white hover:bg-muted/40"
                }`}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="text-sm font-semibold text-navy">Price Range</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value || 0))}
            placeholder="Min"
          />
          <Input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value || 0))}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-sm font-semibold text-navy">Minimum Rating</label>
        <div className="mt-2 flex gap-2 flex-wrap">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${
                minRating === r ? "bg-navy text-white border-navy" : "bg-white"
              }`}
            >
              <Star className="h-4 w-4" />
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-semibold text-navy">Sort</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-2 w-full border rounded-lg px-3 py-2 bg-white"
        >
          <option value="relevance">Relevance</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy to-navy-dark text-white">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold">Shop Products</h1>
          <p className="text-white/80 mt-2 max-w-2xl">
            Explore the best deals from local stores. Filter by categories, price and rating.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedCats.length > 0 && (
              <span className="bg-white/15 px-3 py-1 rounded-full text-sm">
                {selectedCats.length} categories selected
              </span>
            )}
            {q.trim() && (
              <span className="bg-white/15 px-3 py-1 rounded-full text-sm">
                Search: “{q.trim()}”
              </span>
            )}
            {!loading && (
              <span className="bg-white/15 px-3 py-1 rounded-full text-sm">
                Total loaded: {products.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="container mx-auto px-4 py-8">
        {errorMsg && (
          <Card className="rounded-2xl mb-6 border-red-200">
            <CardContent className="p-5">
              <p className="font-semibold text-red-700">Could not load products</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Open console → check “products response” log to see exact JSON shape.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* LEFT FILTERS (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 rounded-2xl border bg-white p-5 shadow-sm">
              <Filters />
            </div>
          </aside>

          {/* MOBILE FILTER BUTTON */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[380px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Filters />
                </div>
              </SheetContent>
            </Sheet>

            <div className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} items`}
            </div>
          </div>

          {/* RIGHT PRODUCTS */}
          <main className="lg:col-span-9">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground hidden lg:block">
                {loading ? "Loading..." : `${filtered.length} items found`}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-white p-3">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-10 text-center">
                  <p className="text-lg font-semibold text-navy">No products found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    If you expected products, check console logs for API response shape.
                  </p>
                  <div className="flex gap-2 justify-center mt-5">
                    <Button onClick={clearAll}>Clear Filters</Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Reload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((p) => {
                  const title = p.itemName || p.name || "Product";
                  const price = Number(p.afterDiscount ?? p.userPrice ?? 0);
                  const img = p.images?.[0] || "https://via.placeholder.com/400x300?text=Product";

                  return (
                    <Link key={p._id} to={`/product/${p._id}`} className="group">
                      <div className="rounded-2xl border bg-white overflow-hidden hover:shadow-lg transition">
                        <div className="h-44 bg-muted">
                          <img
                            src={img}
                            alt={title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://via.placeholder.com/400x300?text=Product";
                            }}
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-navy line-clamp-2">{title}</h3>

                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-lg font-bold text-navy">₹{money(price)}</span>
                            {p.userPrice && p.afterDiscount ? (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{money(p.userPrice)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs bg-accent text-white px-2 py-1 rounded">
                              ⭐ {Number(p.rating || 4).toFixed(1)}
                            </div>
                            {p.tag ? (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-yellow-banner text-navy">
                                {p.tag}
                              </span>
                            ) : null}
                          </div>

                          <Button className="w-full mt-3">View</Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;
