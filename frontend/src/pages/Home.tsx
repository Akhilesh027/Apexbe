import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import StoreCard from "@/components/StoreCard";
import BrandCard from "@/components/BrandCard";
import WaveSection from "@/components/WaveSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import ratnadeepLogo from "../Web images/Web images/ratandeep.png";
import wodden from "../Web images/Web images/wodden.png";
import urben from '../Web images/Web images/urban.png';
import grocary from '../Web images/Web images/grocary.png';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setLoggedInUser(JSON.parse(user));
  }, []);

  // Automatically get live location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          console.log("User location:", latitude, longitude);
          // Optional: Send location to backend or filter stores
        },
        (error) => {
          console.warn("Error getting location:", error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.apexbee.in/api/categories");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) {
          const transformedCategories = data.categories.map(cat => ({
            icon: getCategoryIcon(cat.name),
            label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
            to: `/category/${cat.name.toLowerCase()}`,
            image: cat.image,
            id: cat._id
          }));
          setCategories(transformedCategories);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to default categories
      setCategories(getDefaultCategories());
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      fashion: "🏃",
      grocery: "🍎",
      electronics: "📱",
      furniture: "🪑",
      medicine: "💊",
      beauty: "💄",
      sports: "⚽",
      books: "📚",
      food: "🥘",
      default: "🏷️"
    };
    return iconMap[categoryName.toLowerCase()] || iconMap.default;
  };

  const getDefaultCategories = () => [
    { icon: "🏃", label: "Fashion", to: "/category/fashion" },
    { icon: "🍎", label: "Grocery", to: "/category/grocery" },
    { icon: "📱", label: "Electronics", to: "/category/electronics" },
    { icon: "🪑", label: "Furniture", to: "/category/furniture" },
    { icon: "💊", label: "Medicines", to: "/category/medicines" },
    { icon: "💄", label: "Beauty", to: "/category/beauty" },
  ];

  const stores = [
    { name: "RATNADEEP", tagline: "Recycling since 1987", image: ratnadeepLogo },
    { name: "Wooden Street", tagline: "Furniture, loaded with love", image: wodden },
    { name: "Urban Ladder", tagline: "Quality & comfort", image: urben },
  ];

  const nearbyStores = [
    { name: "Max Fashion", logo: "https://logo.clearbit.com/maxfashion.in" },
    { name: "Central", logo: "https://logo.clearbit.com/centralandme.com" },
    { name: "Pantaloons", logo: "https://logo.clearbit.com/pantaloons.com" },
    { name: "Westside", logo: "https://logo.clearbit.com/westside.com" },
    { name: "Lifestyle", logo: "https://logo.clearbit.com/lifestylestores.com" },
    { name: "D-Mart", logo: "https://logo.clearbit.com/dmart.in" },
    { name: "Ratnadeep", logo: "https://logo.clearbit.com/ratnadeepretail.com" },
  ];

  const fashionBrands = [
    { name: "Raymond", logo: "https://logo.clearbit.com/raymond.in" },
    { name: "H&M", logo: "https://logo.clearbit.com/hm.com" },
    { name: "Harissons", logo: "https://logo.clearbit.com/harissonsbags.com" },
    { name: "Ray-Ban", logo: "https://logo.clearbit.com/ray-ban.com" },
  ];

  const handleViewAllCategories = () => {
    navigate('/categories');
  };

  const scrollCategories = (direction) => {
    const container = document.getElementById('categories-container');
    if (container) {
      const scrollAmount = 200;
      container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top banner notice only if user is NOT logged in */}
      {!loggedInUser && (
        <div className="bg-blue-light border-b text-center py-2 text-sm">
          On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
        </div>
      )}

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy">Explore Categories</h2>
          <Button 
            variant="outline" 
            className="text-accent border-accent hover:bg-accent hover:text-white"
            onClick={handleViewAllCategories}
          >
            View All Categories
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 hidden md:flex"
            onClick={() => scrollCategories('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div 
            id="categories-container"
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              ))
            ) : (
              categories.map((category) => (
                <CategoryIcon 
                  key={category.id || category.label} 
                  {...category} 
                />
              ))
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 hidden md:flex"
            onClick={() => scrollCategories('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Hero Banners */}
      <section className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
        <div className="relative group cursor-pointer">
          <img 
            src={grocary} 
            alt="Grocery Delivery" 
            className="w-full h-full object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold">Fresh Groceries</h3>
            <p className="text-sm">Delivery in 30 minutes</p>
          </div>
        </div>
        <div className="relative group cursor-pointer">
          <img 
            src={grocary} 
            alt="Special Offers" 
            className="w-full h-full object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold">Special Offers</h3>
            <p className="text-sm">Up to 50% off</p>
          </div>
        </div>
      </section>

      {/* Featured Stores with Wave */}
      <WaveSection bgColor="bg-navy">
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Grocery & Home Furnishing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard key={store.name} {...store} />
            ))}
          </div>
        </div>
      </WaveSection>

      {/* Near By Stores */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Near By Stores</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 mb-8">
          {nearbyStores.map((store) => (
            <BrandCard key={store.name} {...store} />
          ))}
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-navy text-center py-3 rounded-lg font-semibold shadow-md">
          🎉 Earn 10% Cashback on Every App Order
        </div>
      </section>

      {/* Fashion Brands */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Popular Fashion Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {fashionBrands.map((brand) => (
            <BrandCard key={brand.name} {...brand} />
          ))}
        </div>
      </section>

      {/* App Download Banner */}
      <section className="bg-gradient-to-r from-accent to-navy text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Get the best shopping experience with exclusive app-only deals and faster checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-navy hover:bg-gray-100 font-semibold px-8 py-3">
              📱 Download for iOS
            </Button>
            <Button className="bg-white text-navy hover:bg-gray-100 font-semibold px-8 py-3">
              🤖 Download for Android
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
