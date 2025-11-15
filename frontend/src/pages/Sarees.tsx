import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import BrandCard from "@/components/BrandCard";
import { Button } from "@/components/ui/button";

const Sarees = () => {
  const categories = [
    { icon: "👗", label: "Day Wear" },
    { icon: "🎉", label: "Party Glam" },
    { icon: "✨", label: "Timeless" },
    { icon: "💒", label: "Wedding Edit" },
    { icon: "🎊", label: "Festive" },
  ];

  const products = [
    { id: "1", image: "/placeholder.svg", title: "Women's Cotton Silk Blend Printed Saree", price: 489, originalPrice: 799, rating: 4, badge: "Limited" },
    { id: "2", image: "/placeholder.svg", title: "Women's Cotton Silk Blend Printed Saree", price: 248, originalPrice: 599, rating: 4, badge: "Limited" },
    { id: "3", image: "/placeholder.svg", title: "Kuri Premium Pure Soft Silk Saree", price: 569, originalPrice: 899, rating: 4, badge: "Limited" },
    { id: "4", image: "/placeholder.svg", title: "Organics Sequence Embroidery Saree", price: 589, originalPrice: 999, rating: 4, badge: "Limited" },
    { id: "5", image: "/placeholder.svg", title: "Tanya Butti Silk Embroidered Saree", price: 699, originalPrice: 1199, rating: 4, badge: "Limited" },
    { id: "6", image: "/placeholder.svg", title: "DBL Women's Printed Cotton Saree", price: 489, originalPrice: 799, rating: 4, badge: "Limited" },
    { id: "7", image: "/placeholder.svg", title: "Kashmiri Kanchali Jacquard Saree", price: 789, originalPrice: 1299, rating: 4, badge: "Limited" },
    { id: "8", image: "/placeholder.svg", title: "Women's Cotton Silk Blend Printed Saree", price: 779, originalPrice: 1299, rating: 4, badge: "Limited" },
  ];

  const nearbyStores = [
    { name: "Max", logo: "/placeholder.svg" },
    { name: "Central", logo: "/placeholder.svg" },
    { name: "Pantaloons", logo: "/placeholder.svg" },
    { name: "Westside", logo: "/placeholder.svg" },
    { name: "Lifestyle", logo: "/placeholder.svg" },
    { name: "D-Mart", logo: "/placeholder.svg" },
    { name: "Ratnadeep", logo: "/placeholder.svg" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-pink-banner py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-navy mb-2">Festive Special Edition</p>
              <h1 className="text-6xl font-bold text-[#c4698b] mb-4">Sarees</h1>
              <p className="text-2xl text-[#c4698b]">Discount Offer</p>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/30 rounded-full"></div>
              <div className="absolute top-8 right-8 bg-[#5d2e1a] text-white p-6 rounded-2xl">
                <p className="text-xs mb-1">EXCLUSIVE OFFER ON</p>
                <p className="text-xs mb-2">FASHION</p>
                <p className="text-5xl font-bold">65%</p>
                <p className="text-2xl font-bold">OFF</p>
                <p className="text-xs mt-2">*T&C Apply</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb and Categories */}
      <div className="container mx-auto px-4">
        <div className="py-4 text-sm text-muted-foreground">
          Fashion / Womens Wear / Day Wear / Sarees
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Button className="bg-navy text-white hover:bg-navy/90">Womens Collection</Button>
          <Button variant="outline">Fashion Special Series</Button>
          <Button variant="outline">Saree</Button>
          <Button variant="outline">Filter</Button>
        </div>

        {/* Cashback Banner */}
        <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold mb-8">
          Earn 10% Cashback on Every App Order
        </div>

        {/* Categories */}
        <div className="flex gap-6 overflow-x-auto pb-4 mb-8">
          {categories.map((category) => (
            <CategoryIcon key={category.label} {...category} />
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#f5d5c8] rounded-2xl p-8 relative overflow-hidden">
            <h3 className="text-4xl font-bold text-[#5d2e1a] mb-2">Radiant</h3>
            <h4 className="text-4xl font-bold text-[#5d2e1a] mb-4">Elegance</h4>
            <p className="text-lg text-navy-light mb-4">Saree</p>
            <div className="absolute bottom-4 right-4">
              <div className="bg-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold text-navy">68% off*</span>
              </div>
            </div>
          </div>

          <div className="bg-orange rounded-2xl p-8 relative overflow-hidden">
            <h3 className="text-4xl font-bold text-white mb-2">Ethnic</h3>
            <h4 className="text-4xl font-bold text-white mb-4">Sarees</h4>
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-lg">
              <span className="text-xs font-semibold text-navy">OFFER VALID TILL FEB 25</span>
            </div>
            <div className="absolute bottom-4 right-4">
              <div className="bg-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold text-navy">68% off*</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Products */}
      <section className="container mx-auto px-4 py-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={`bottom-${product.id}`} {...product} />
          ))}
        </div>
      </section>

      {/* Near By Stores */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Near By Stores</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {nearbyStores.map((store) => (
            <BrandCard key={store.name} {...store} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sarees;
