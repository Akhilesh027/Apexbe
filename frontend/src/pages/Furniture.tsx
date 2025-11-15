import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";

const Furniture = () => {
  const categories = [
    { icon: "🛋️", label: "Sofa" },
    { icon: "🛏️", label: "Beds" },
    { icon: "🪑", label: "Chairs" },
    { icon: "🗄️", label: "Storage" },
    { icon: "🪞", label: "Decor" },
  ];

  const products = [
    { id: "f1", image: "/placeholder.svg", title: "3 Seater Sofa Premium", price: 24999, originalPrice: 45999, rating: 5, discount: 46, badge: "Premium" },
    { id: "f2", image: "/placeholder.svg", title: "Queen Size Bed Wooden", price: 18999, originalPrice: 32999, rating: 5, discount: 42, badge: "Bestseller" },
    { id: "f3", image: "/placeholder.svg", title: "Office Chair Ergonomic", price: 5999, originalPrice: 10999, rating: 4, discount: 45, badge: "Hot" },
    { id: "f4", image: "/placeholder.svg", title: "Dining Table Set 6 Seater", price: 22999, originalPrice: 39999, rating: 5, discount: 43, badge: "Premium" },
    { id: "f5", image: "/placeholder.svg", title: "Wardrobe 3 Door", price: 15999, originalPrice: 27999, rating: 4, discount: 43, badge: "New" },
    { id: "f6", image: "/placeholder.svg", title: "Study Table with Storage", price: 6999, originalPrice: 12999, rating: 4, discount: 46, badge: "Hot" },
    { id: "f7", image: "/placeholder.svg", title: "Bookshelf Modern Design", price: 4999, originalPrice: 8999, rating: 5, discount: 44, badge: "Trending" },
    { id: "f8", image: "/placeholder.svg", title: "Center Table Glass Top", price: 3999, originalPrice: 7999, rating: 4, discount: 50, badge: "Hot" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-amber-100 to-amber-200 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-navy mb-2">Home Collection</p>
              <h1 className="text-6xl font-bold text-amber-900 mb-4">Furniture</h1>
              <p className="text-2xl text-amber-800 mb-4">Comfort & Style</p>
              <div className="bg-navy text-white p-6 rounded-2xl inline-block">
                <p className="text-sm mb-1">MEGA SALE</p>
                <p className="text-5xl font-bold">45%</p>
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
          Earn 8% Cashback on Furniture Orders
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-navy mb-6">Best Sellers</h2>
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

export default Furniture;
