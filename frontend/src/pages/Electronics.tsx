import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";

const Electronics = () => {
  const categories = [
    { icon: "📱", label: "Mobiles" },
    { icon: "💻", label: "Laptops" },
    { icon: "📷", label: "Cameras" },
    { icon: "🎧", label: "Audio" },
    { icon: "⌚", label: "Wearables" },
  ];

  const products = [
    { id: "e1", image: "/placeholder.svg", title: "Smartphone 5G 128GB", price: 15999, originalPrice: 24999, rating: 5, discount: 36, badge: "Hot" },
    { id: "e2", image: "/placeholder.svg", title: "Laptop Core i5 8GB RAM", price: 35999, originalPrice: 49999, rating: 5, discount: 28, badge: "Bestseller" },
    { id: "e3", image: "/placeholder.svg", title: "Wireless Earbuds Pro", price: 1999, originalPrice: 3999, rating: 4, discount: 50, badge: "Hot" },
    { id: "e4", image: "/placeholder.svg", title: "Smart Watch Fitness", price: 2499, originalPrice: 4999, rating: 4, discount: 50, badge: "New" },
    { id: "e5", image: "/placeholder.svg", title: "DSLR Camera 24MP", price: 42999, originalPrice: 59999, rating: 5, discount: 28, badge: "Premium" },
    { id: "e6", image: "/placeholder.svg", title: "Bluetooth Speaker", price: 1499, originalPrice: 2999, rating: 4, discount: 50, badge: "Hot" },
    { id: "e7", image: "/placeholder.svg", title: "Gaming Headphones", price: 2999, originalPrice: 5999, rating: 5, discount: 50, badge: "Bestseller" },
    { id: "e8", image: "/placeholder.svg", title: "Power Bank 20000mAh", price: 999, originalPrice: 1999, rating: 4, discount: 50, badge: "Hot" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-white mb-2">Latest Technology</p>
              <h1 className="text-6xl font-bold text-white mb-4">Electronics</h1>
              <p className="text-2xl text-white/90 mb-4">Smart Choices</p>
              <div className="bg-white text-navy p-6 rounded-2xl inline-block">
                <p className="text-sm mb-1">UP TO</p>
                <p className="text-5xl font-bold">50%</p>
                <p className="text-2xl font-bold">OFF</p>
              </div>
            </div>
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
          Earn 12% Cashback on Electronics Above Rs. 10,000
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-navy mb-6">Trending Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Electronics;
