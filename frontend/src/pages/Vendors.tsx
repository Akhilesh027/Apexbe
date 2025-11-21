import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import ProductCard from "@/components/ProductCard";

const Vendors = () => {
  const [products, setProducts] = useState([]);

  const brands = [
    { name: "Max", logo: "https://logo.clearbit.com/maxfashion.in" },
    { name: "Central", logo: "https://logo.clearbit.com/centralandme.com" },
    { name: "Pantaloons", logo: "https://logo.clearbit.com/pantaloons.com" },
    { name: "Westside", logo: "https://logo.clearbit.com/westside.com" },
    { name: "Lifestyle", logo: "https://logo.clearbit.com/lifestylestores.com" },
    { name: "Bewakoof", logo: "https://logo.clearbit.com/bewakoof.com" },
    { name: "Taneira", logo: "https://logo.clearbit.com/taneira.com" },
    { name: "Zudio", logo: "https://logo.clearbit.com/zudio.com" },
    { name: "The Rebel Hut", logo: "https://logo.clearbit.com/therebelhut.com" },
  ];

  // ⭐ Fetch products from backend
  const loadProducts = async () => {
    try {
      const res = await fetch("https://api.apexbee.in/api/product");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-navy mb-8">Vendor Brand Stores</h1>

        {/* Brand Logos */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-12">
          {brands.map((brand) => (
            <BrandCard key={brand.name} {...brand} />
          ))}
        </div>

        {/* Wholesale Shopping */}
        <section>
          <h2 className="text-3xl font-bold text-navy mb-8">Whole Sale Shopping</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <p className="text-center col-span-4">Loading products...</p>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Vendors;
