import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import BrandCard from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const Category = () => {
  const { categoryName } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category icon mapping
  const getCategoryIcon = (name) => {
    const iconMap = {
      fashion: "👕",
      electronics: "📱",
      home: "🏠",
      beauty: "💄",
      sports: "⚽",
      books: "📚",
      toys: "🧸",
      food: "🍕",
    };
    return iconMap[name?.toLowerCase()] || "📦";
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all categories to find the current one
        const categoriesRes = await fetch("https://api.apexbee.in/api/categories");
        const categoriesData = await categoriesRes.json();

        if (!categoriesRes.ok) throw new Error(categoriesData.error || "Failed to fetch categories");

        const foundCategory = categoriesData.categories.find(
          (cat) => cat.name.toLowerCase() === categoryName?.toLowerCase()
        );

        if (!foundCategory) {
          setError("Category not found");
          setLoading(false);
          return;
        }

        setCategory(foundCategory);

        // Fetch subcategories
        const subcatsRes = await fetch(
          `https://api.apexbee.in/api/subcategories?category=${foundCategory._id}`
        );
        const subcatsData = await subcatsRes.json();
        if (subcatsRes.ok) setSubcategories(subcatsData.subcategories || []);

        // Fetch products for this category
        const productsRes = await fetch(
          `https://api.apexbee.in/api/products/${encodeURIComponent(foundCategory.name)}`
        );
        const productsData = await productsRes.json();

        if (productsRes.ok) setCategoryProducts(productsData || []);
        else console.error("Failed to fetch products:", productsData.error);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) fetchCategoryData();
  }, [categoryName]);

  const nearbyStores = [
    { name: "Max Fashion", logo: "/placeholder.svg" },
    { name: "Central", logo: "/placeholder.svg" },
    { name: "Pantaloons", logo: "/placeholder.svg" },
    { name: "Westside", logo: "/placeholder.svg" },
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

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-xl text-muted-foreground">Loading category...</div>
        </div>
      </div>
    );

  if (error || !category)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-xl text-red-600 mb-4">{error || "Category not found"}</div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Category Banner */}
      {category.image && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          / {category.name}
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-navy mb-6">{category.name} Categories</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory._id}
                to={`/subcategory/${subcategory.name.toLowerCase()}`}
                className="flex-shrink-0"
              >
                <div className="flex flex-col items-center gap-2 w-20 text-center">
                  <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center text-2xl">
                    {getCategoryIcon(subcategory.name)}
                  </div>
                  <span className="text-sm font-medium text-navy">{subcategory.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cashback Banner */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold">
          Earn 10% Cashback on Every App Order
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-navy mb-6">Featured {category.name} Products</h2>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No products available in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {categoryProducts.map((product) => (
              <Link to={`/product/${product._id}`} key={product._id} className="block">
                <div className="bg-blue-light rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-white/50">
                    <img
                      src={product.images?.[0] || "/placeholder-product.png"}
                      alt={product.itemName || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-navy mb-2 line-clamp-2">
                      {product.itemName || product.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-navy">
                        Rs. {product.salesPrice || product.price}
                      </span>
                      {product.userPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          Rs. {product.userPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="bg-accent text-white text-xs px-2 py-1 rounded">
                        ⭐ {product.rating || 4.0}
                      </div>
                      <span className="text-xs text-muted-foreground">({product.reviews || 0})</span>
                      {product.tag && (
                        <div className="ml-auto bg-yellow-banner text-navy text-xs px-2 py-1 rounded font-semibold">
                          {product.tag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Near By Stores */}
      <section className="container mx-auto px-4 py-12 mb-8">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Near By Stores</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {nearbyStores.map((store) => (
            <BrandCard key={store.name} {...store} />
          ))}
        </div>
      </section>

      {/* Special Edition / Promotional Products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Special Edition Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {promotionalProducts.map((product) => (
            <div key={product.id} className="bg-blue-light rounded-lg overflow-hidden">
              <div className="aspect-square bg-white/50 flex items-center justify-center">
                <span className="text-muted-foreground">Product Image</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                    {product.discount}% off
                  </div>
                  <span className="text-xs text-muted-foreground">{product.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Category;
