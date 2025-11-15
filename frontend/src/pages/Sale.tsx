import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const Sale = () => {
  const categories = [
    { icon: "👗", label: "Fashion", to: "/fashion" },
    { icon: "💍", label: "Jewelery", to: "/jewelry" },
    { icon: "📱", label: "Electronics", to: "/electronics" },
    { icon: "🏠", label: "Home", to: "/furniture" },
    { icon: "⚽", label: "Sports" },
  ];

  const saleProducts = [
    { id: "s1", image: "/placeholder.svg", title: "Premium Leather Jacket", price: 1999, originalPrice: 4999, rating: 5, discount: 60, badge: "Hot Deal" },
    { id: "s2", image: "/placeholder.svg", title: "Smart Watch Series 5", price: 2499, originalPrice: 5999, rating: 4, discount: 58, badge: "Limited" },
    { id: "s3", image: "/placeholder.svg", title: "Designer Sunglasses", price: 799, originalPrice: 1999, rating: 4, discount: 60, badge: "Hot Deal" },
    { id: "s4", image: "/placeholder.svg", title: "Wireless Earbuds Pro", price: 1299, originalPrice: 2999, rating: 5, discount: 57, badge: "Limited" },
    { id: "s5", image: "/placeholder.svg", title: "Running Shoes Premium", price: 1599, originalPrice: 3999, rating: 4, discount: 60, badge: "Hot Deal" },
    { id: "s6", image: "/placeholder.svg", title: "Formal Shirt Collection", price: 599, originalPrice: 1499, rating: 4, discount: 60, badge: "Limited" },
    { id: "s7", image: "/placeholder.svg", title: "Yoga Mat & Accessories", price: 899, originalPrice: 1999, rating: 5, discount: 55, badge: "Hot Deal" },
    { id: "s8", image: "/placeholder.svg", title: "Kitchen Appliance Set", price: 2999, originalPrice: 6999, rating: 4, discount: 57, badge: "Limited" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-orange to-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-white mb-4">MEGA SALE</h1>
          <p className="text-2xl text-white mb-2">Up to 70% OFF</p>
          <p className="text-lg text-white/90">Limited Time Offer - Shop Now!</p>
          <div className="mt-6">
            <Button size="lg" className="bg-white text-orange hover:bg-white/90 font-bold">
              Shop All Deals
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-6 overflow-x-auto pb-4">
          {categories.map((category) => (
            <CategoryIcon key={category.label} {...category} />
          ))}
        </div>
      </section>

      {/* Cashback Banner */}
      <div className="container mx-auto px-4">
        <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold mb-8">
          Earn 15% Cashback on Sale Items
        </div>
      </div>

      {/* Sale Products */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-navy mb-6">Flash Deals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {saleProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-navy rounded-3xl p-12 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">Don't Miss Out!</h3>
          <p className="text-xl text-white/90 mb-6">Sale ends in 2 days</p>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
            View All Offers
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sale;
