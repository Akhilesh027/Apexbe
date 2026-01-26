import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

/** -----------------------------
 * Types
 * ---------------------------- */
interface Product {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  subcategory?: string; // subcategory id
  userPrice?: number; // MRP
  afterDiscount?: number; // Selling price
  rating?: number;
  reviews?: number;
  tag?: string;
  [key: string]: any;
}

interface Subcategory {
  _id: string;
  name: string;
}

interface CategoryType {
  _id: string;
  name: string;
  image?: string;
  subcategories?: Subcategory[];
}

/** -----------------------------
 * UI: Empty State
 * ---------------------------- */
const ComingSoonAnimation = ({ isSubcategory }: { isSubcategory: boolean }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-blue-light/50 rounded-xl shadow-inner border border-blue-light transition-all duration-500 hover:shadow-xl">
    <div className="mb-6 animate-bounce transition-all duration-1000">
      <span className="text-6xl" role="img" aria-label="Hourglass">
        ⏳
      </span>
    </div>
    <h3 className="text-3xl font-extrabold text-navy mb-3">
      Products Coming Soon!
    </h3>
    <p className="text-lg text-muted-foreground text-center max-w-md px-4">
      We're busy stocking the best items for this{" "}
      {isSubcategory ? "subcategory" : "category"}. Check back shortly for
      amazing deals!
    </p>
    <div className="mt-6">
      <Link
        to="/"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-10 px-6 py-2 bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
      >
        Explore Other Categories
      </Link>
    </div>
  </div>
);

/** -----------------------------
 * Small helpers
 * ---------------------------- */
const API_BASE = "https://api.apexbee.in/api";

function normalizeName(v?: string) {
  return (v || "").trim().toLowerCase();
}

function getSubIcon(name?: string) {
  // You can expand mapping for better icons
  const iconMap: Record<string, string> = {
    fashion: "👕",
    electronics: "📱",
    home: "🏠",
    beauty: "💄",
    sports: "⚽",
    books: "📚",
    toys: "🧸",
    food: "🍕",
    grocery: "🛒",
  };
  return iconMap[normalizeName(name)] || "📦";
}

/** -----------------------------
 * Component
 * ---------------------------- */
const Category = () => {
  const { categoryName } = useParams();

  // Main screen modes:
  // 1) showAllCategories = true => grid of categories
  // 2) showAllCategories = false => category detail + products
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [allCategories, setAllCategories] = useState<CategoryType[]>([]);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** -----------------------------
   * Fetch logic
   * ---------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always get categories first (we use them for fallback view)
        const categoriesRes = await axios.get(`${API_BASE}/categories`);
        const categories: CategoryType[] = categoriesRes?.data?.categories || [];
        setAllCategories(categories);

        // If no categoryName in URL => show all categories
        if (!categoryName) {
          setShowAllCategories(true);
          setCategory(null);
          setSubcategories([]);
          setAllProducts([]);
          setSelectedSubcategoryId(null);
          return;
        }

        // Find category by name
        const found = categories.find(
          (c) => normalizeName(c.name) === normalizeName(categoryName)
        );

        // If not found => show all categories
        if (!found) {
          setShowAllCategories(true);
          setCategory(null);
          setSubcategories([]);
          setAllProducts([]);
          setSelectedSubcategoryId(null);
          return;
        }

        // Category found => detail view
        setShowAllCategories(false);
        setCategory(found);
        setSubcategories(found.subcategories || []);
        setSelectedSubcategoryId(null);

        // Fetch products for this category
        const productsRes = await axios.get(
          `${API_BASE}/products/${encodeURIComponent(categoryName)}`
        );

        const ok = !!productsRes?.data?.success;
        if (!ok) {
          throw new Error(productsRes?.data?.error || "Failed to fetch products");
        }

        setAllProducts(productsRes?.data?.products || []);
      } catch (err: any) {
        console.error("Category fetch error:", err);

        // As a last resort, show categories if we have them
        setShowAllCategories(true);
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setSelectedSubcategoryId(null);

        // Avoid blocking UI with error if fallback works
        const msg =
          err?.response?.data?.error || err?.message || "Network error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryName]);

  /** -----------------------------
   * Derived / memo
   * ---------------------------- */
  const filteredProducts = useMemo(() => {
    if (!selectedSubcategoryId) return allProducts;
    return allProducts.filter((p) => p.subcategory === selectedSubcategoryId);
  }, [allProducts, selectedSubcategoryId]);

  const selectedSubName = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    return subcategories.find((s) => s._id === selectedSubcategoryId)?.name;
  }, [selectedSubcategoryId, subcategories]);

  /** -----------------------------
   * Static data (kept)
   * ---------------------------- */
  const nearbyStores = [
    { name: "Max Fashion", logo: "/placeholder.svg" },
    { name: "Central", logo: "/placeholder.svg" },
    { name: "Pantaloons", logo: "/placeholder.svg" },
    { name: "Westside", logo: "/placeholder-product.png" },
    { name: "Lifestyle", logo: "/placeholder.svg" },
    { name: "D-Mart", logo: "/placeholder.svg" },
    { name: "Ratnadeep", logo: "/placeholder.svg" },
  ];

  const promotionalProducts = [
    { id: 1, name: "Limited time deal", discount: 85 },
    { id: 2, name: "Limited time deal", discount: 85 },
    { id: 3, name: "Limited time deal", discount: 85 },
    { id: 4, name: "Limited time deal", discount: 85 },
  ];

  /** -----------------------------
   * Loading screen
   * ---------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-2xl font-bold text-navy mb-2">
              Loading...
            </div>
            <p className="text-muted-foreground">
              Fetching categories and products.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /** -----------------------------
   * ALL CATEGORIES VIEW
   * ---------------------------- */
  if (showAllCategories) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="container mx-auto px-4 pt-10 pb-6">
          <div className="rounded-2xl border bg-blue-light/30 p-6 md:p-10">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-extrabold text-navy">
                Browse All Categories
              </h1>
              <p className="mt-2 text-muted-foreground">
                {error
                  ? "We couldn't find that category. Here are all available categories."
                  : "Pick a category to explore the best products and offers."}
              </p>
            </div>
          </div>
        </section>

        {/* Categories grid */}
        <section className="container mx-auto px-4 pb-14">
          {allCategories.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-10 text-center text-muted-foreground">
              No categories available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {allCategories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/category/${cat.name}`}
                  className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-lg transition"
                >
                  <div className="h-36 md:h-44 bg-muted/30">
                    <img
                      src={cat.image || "/placeholder.svg"}
                      alt={cat.name}
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-navy text-base md:text-lg line-clamp-1">
                        {cat.name}
                      </h3>
                      <span className="text-lg" aria-hidden>
                        {getSubIcon(cat.name)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs md:text-sm text-muted-foreground line-clamp-2">
                      Explore products and deals in {cat.name}.
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Footer />
      </div>
    );
  }

  /** -----------------------------
   * Safety: if we are in detail view, category must exist
   * ---------------------------- */
  if (!category) {
    // fallback UI (should rarely happen)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-xl text-red-600 mb-4">
            Category not found
          </div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  /** -----------------------------
   * CATEGORY DETAIL VIEW
   * ---------------------------- */
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <section className="w-full">
        <div className="container mx-auto px-4 pt-6">
          <div className="overflow-hidden rounded-2xl border bg-muted/20">
            <div className="relative h-44 md:h-64">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-navy shadow">
                  <span className="text-lg">{getSubIcon(category.name)}</span>
                  <span className="capitalize">{category.name}</span>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="px-4 md:px-6 py-4">
              <div className="text-sm text-muted-foreground">
                <Link to="/" className="hover:underline">
                  Home
                </Link>{" "}
                / <span className="text-navy font-medium">{category.name}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategory tabs */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="text-2xl font-bold text-navy">
            {category.name} Categories
          </h2>

          <button
            onClick={() => setShowAllCategories(true)}
            className="text-sm text-primary hover:underline"
            type="button"
          >
            View all categories
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* All tab */}
          <button
            type="button"
            onClick={() => setSelectedSubcategoryId(null)}
            className={`flex-shrink-0 rounded-xl border px-4 py-3 transition ${
              !selectedSubcategoryId
                ? "bg-primary text-white border-primary shadow"
                : "bg-white hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <span className="text-sm font-semibold">All</span>
            </div>
          </button>

          {/* Dynamic tabs */}
          {subcategories.map((s) => {
            const active = selectedSubcategoryId === s._id;
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => setSelectedSubcategoryId(s._id)}
                className={`flex-shrink-0 rounded-xl border px-4 py-3 transition ${
                  active
                    ? "bg-primary text-white border-primary shadow"
                    : "bg-white hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getSubIcon(s.name)}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {s.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Cashback */}
      <section className="container mx-auto px-4">
        <div className="rounded-xl border bg-yellow-banner/60 text-navy text-center py-3 font-semibold shadow-sm">
          Earn 10% Cashback on Every App Order
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy">
              {selectedSubName ? `${selectedSubName} Products` : "Featured Products"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredProducts.length} item(s) found
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <ComingSoonAnimation isSubcategory={!!selectedSubcategoryId} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const title = product.itemName || product.name || "Product";
              const img = product.images?.[0] || "/placeholder-product.png";
              const price =
                typeof product.afterDiscount === "number"
                  ? `Rs. ${product.afterDiscount.toFixed(2)}`
                  : "Price N/A";

              return (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="group block rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-lg transition"
                >
                  {/* Image */}
                  <div className="h-44 md:h-56 bg-muted/20 overflow-hidden">
                    <img
                      src={img}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-navy line-clamp-2 min-h-[44px]">
                      {title}
                    </h3>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base md:text-lg font-bold text-navy">
                          {price}
                        </span>

                        {typeof product.userPrice === "number" && (
                          <span className="text-xs md:text-sm text-muted-foreground line-through">
                            Rs. {product.userPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="bg-accent text-white text-xs px-2 py-1 rounded-md">
                          ⭐ {(product.rating ?? 4.0).toFixed(1)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviews ?? 0})
                        </span>

                        {product.tag && (
                          <div className="ml-auto bg-yellow-banner text-navy text-xs px-2 py-1 rounded-md font-semibold">
                            {product.tag}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    

      <Footer />
    </div>
  );
};

export default Category;
