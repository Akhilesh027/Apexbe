import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import BrandCard from "@/components/BrandCard";

const Jewelry = () => {
  const categories = [
    { icon: "💍", label: "Rings" },
    { icon: "📿", label: "Necklaces" },
    { icon: "👂", label: "Earrings" },
    { icon: "⌚", label: "Bracelets" },
    { icon: "✨", label: "Bridal" },
  ];

  const products = [
    { id: "j1", image: "/placeholder.svg", title: "Gold Plated Necklace Set", price: 2499, originalPrice: 4999, rating: 5, discount: 50, badge: "Trending" },
    { id: "j2", image: "/placeholder.svg", title: "Diamond Studded Earrings", price: 3999, originalPrice: 7999, rating: 5, discount: 50, badge: "Premium" },
    { id: "j3", image: "/placeholder.svg", title: "Silver Bracelet Collection", price: 1299, originalPrice: 2599, rating: 4, discount: 50, badge: "New" },
    { id: "j4", image: "/placeholder.svg", title: "Bridal Jewelry Set", price: 8999, originalPrice: 15999, rating: 5, discount: 44, badge: "Premium" },
    { id: "j5", image: "/placeholder.svg", title: "Pearl Necklace Elegant", price: 1999, originalPrice: 3999, rating: 4, discount: 50, badge: "Trending" },
    { id: "j6", image: "/placeholder.svg", title: "Rose Gold Ring Set", price: 1599, originalPrice: 3199, rating: 5, discount: 50, badge: "New" },
    { id: "j7", image: "/placeholder.svg", title: "Kundan Maang Tikka", price: 899, originalPrice: 1799, rating: 4, discount: 50, badge: "Trending" },
    { id: "j8", image: "/placeholder.svg", title: "Temple Jewelry Collection", price: 2999, originalPrice: 5999, rating: 5, discount: 50, badge: "Premium" },
  ];

  const brands = [
    { name: "Tanishq", logo: "/placeholder.svg" },
    { name: "Kalyan", logo: "/placeholder.svg" },
    { name: "PC Jeweller", logo: "/placeholder.svg" },
    { name: "Malabar Gold", logo: "/placeholder.svg" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-yellow-100 to-yellow-200 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-navy mb-2">Exclusive Collection</p>
              <h1 className="text-6xl font-bold text-yellow-800 mb-4">Jewelry</h1>
              <p className="text-2xl text-yellow-700 mb-4">Shine Bright</p>
              <div className="bg-navy text-white p-6 rounded-2xl inline-block">
                <p className="text-sm mb-1">SPECIAL OFFER</p>
                <p className="text-5xl font-bold">50%</p>
                <p className="text-2xl font-bold">OFF</p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/30 rounded-full"></div>
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
          Earn 10% Cashback on Every Jewelry Purchase
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-navy mb-6">Featured Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Brands */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Premium Jewelry Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <BrandCard key={brand.name} {...brand} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Jewelry;
