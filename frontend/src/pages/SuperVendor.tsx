import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Star, BadgeCheck } from "lucide-react";

const SuperVendor = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // ⭐ Updated vendor logos (auto-fetch logos, no broken images)
  const topVendors = [
    { name: "Fashion Hub", logo: "https://logo.clearbit.com/maxfashion.in", rating: 4.8, products: 1240 },
    { name: "Tech Store", logo: "https://logo.clearbit.com/croma.com", rating: 4.9, products: 890 },
    { name: "Home Decor", logo: "https://logo.clearbit.com/hometown.in", rating: 4.7, products: 560 },
    { name: "Sports Zone", logo: "https://logo.clearbit.com/decathlon.in", rating: 4.6, products: 780 },
  ];

  // ⭐ Fetch featured products from backend
  const loadFeatured = async () => {
    try {
      const res = await fetch("https://website-backend-57f9.onrender.com/api/product");
      const data = await res.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error("Error loading featured products:", error);
    }
  };

  useEffect(() => {
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-purple-600 to-purple-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <BadgeCheck className="h-16 w-16 mx-auto text-white mb-4" />
          <h1 className="text-5xl font-bold text-white mb-4">Super Vendors</h1>
          <p className="text-xl text-white/90 mb-2">Verified & Trusted Sellers</p>
          <p className="text-lg text-white/80">Quality Products • Fast Delivery • Best Prices</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-bold text-navy mb-2">Verified Sellers</h3>
            <p className="text-sm text-muted-foreground">100% Authenticated</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-navy mb-2">Fast Shipping</h3>
            <p className="text-sm text-muted-foreground">Quick Delivery</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="font-bold text-navy mb-2">Best Deals</h3>
            <p className="text-sm text-muted-foreground">Exclusive Offers</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">💯</div>
            <h3 className="font-bold text-navy mb-2">Quality Assured</h3>
            <p className="text-sm text-muted-foreground">Premium Products</p>
          </div>
        </div>

        {/* Cashback Banner */}
        <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold mb-8">
          Earn 15% Extra Cashback on Super Vendor Products
        </div>

        {/* Top Vendors */}
        <h2 className="text-3xl font-bold text-navy mb-6">Top Rated Vendors</h2>
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {topVendors.map((vendor) => (
            <div
              key={vendor.name}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="w-20 h-20 mx-auto mb-4 object-contain"
              />
              <h3 className="font-bold text-navy text-center mb-2">{vendor.name}</h3>

              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{vendor.rating}</span>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {vendor.products}+ Products
              </p>

              <Button className="w-full mt-4 bg-navy hover:bg-navy/90 text-white">
                Visit Store
              </Button>
            </div>
          ))}
        </div>

        {/* Featured Products */}
        <h2 className="text-3xl font-bold text-navy mb-6">Featured Products</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="text-center col-span-4">Loading products...</p>
          )}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-navy rounded-3xl p-12 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Become a Super Vendor
          </h3>
          <p className="text-xl text-white/90 mb-6">
            List your products and reach millions of customers
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
            Register Now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuperVendor;
