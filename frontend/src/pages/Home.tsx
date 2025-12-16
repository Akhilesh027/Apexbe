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

  // Get live location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          console.log("User location:", latitude, longitude);
        },
        (error) => {
          console.warn("Error getting location:", error.message);
        },
        { enableHighAccuracy: true }
      );
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
          const transformed = data.categories.map((cat) => ({
            label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
            to: `/category/${cat.name}`,
            image: cat.image,
            id: cat._id
          }));
          setCategories(transformed);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

 

  const handleViewAllCategories = () => {
    navigate("/categories");
  };

  const scrollCategories = (direction) => {
    const container = document.getElementById("categories-container");
    if (container) {
      const amount = 200;
      container.scrollLeft += direction === "left" ? -amount : amount;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner if NOT logged in */}
      {!loggedInUser && (
        <div className="bg-blue-light border-b text-center py-2 text-sm">
          On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
        </div>
      )}

      {/* Categories Section */}
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
      className="hidden md:flex"
      onClick={() => scrollCategories("left")}
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
          <div
            key={category.id}
            onClick={() => navigate(category.to)}
            className="flex flex-col items-center min-w-[90px] cursor-pointer group"
          >
            <img
              src={category.image}
              alt={category.label}
              className="w-16 h-16 rounded-full object-cover border group-hover:scale-105 transition"
            />
            <p className="text-sm mt-2 text-center font-semibold text-navy group-hover:text-accent">
              {category.label}
            </p>
          </div>
        ))
      )}
    </div>

    <Button
      variant="ghost"
      size="icon"
      className="hidden md:flex"
      onClick={() => scrollCategories("right")}
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
            className="w-full h-full object-cover rounded-xl shadow-md group-hover:scale-105 transition"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg">
            <h3 className="text-lg font-bold">Fresh Groceries</h3>
            <p className="text-sm">Delivery in 30 minutes</p>
          </div>
        </div>

        <div className="relative group cursor-pointer">
          <img
            src={grocary}
            alt="Special Offers"
            className="w-full h-full object-cover rounded-xl shadow-md group-hover:scale-105 transition"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg">
            <h3 className="text-lg font-bold">Special Offers</h3>
            <p className="text-sm">Up to 50% off</p>
          </div>
        </div>
      </section>

      {/* Featured Stores with Wave - Coming Soon */}
<WaveSection bgColor="bg-navy">
  <div className="container mx-auto px-4 py-12">
    <div className="relative">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Grocery & Home Furnishing
      </h2>
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
        <span className="bg-yellow-500 text-navy text-xs font-bold px-3 py-1 rounded-full animate-pulse">
          COMING SOON
        </span>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative">
          <div className="bg-gray-800 rounded-xl p-6 h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-600">
            <div className="text-5xl mb-4 animate-bounce">🛒</div>
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="text-white text-lg font-bold bg-navy/80 px-4 py-2 rounded-lg">
              Launching Soon!
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</WaveSection>

{/* Near By Stores - Coming Soon */}
<section className="container mx-auto px-4 py-12 relative">
  <div className="relative">
    <h2 className="text-2xl font-bold text-navy text-center mb-8">
      Near By Stores
    </h2>
    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-navy text-xs font-bold px-3 py-1 rounded-full">
        <div className="w-2 h-2 bg-navy rounded-full animate-ping"></div>
        <span>COMING SOON</span>
        <div className="w-2 h-2 bg-navy rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 mb-8">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} className="relative group">
        <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-3xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            🏪
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent rounded-lg flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-xs font-bold">Coming Soon</span>
        </div>
      </div>
    ))}
  </div>
  <div className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 text-center py-3 rounded-lg font-semibold shadow-md relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
    <span className="relative">🎉 Feature Launching Soon!</span>
  </div>
</section>

{/* Fashion Brands - Coming Soon */}
<section className="container mx-auto px-4 py-12">
  <div className="relative">
    <h2 className="text-2xl font-bold text-navy text-center mb-8">
      Popular Fashion Brands
    </h2>
    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
      <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
        LAUNCHING SOON
      </span>
    </div>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="relative overflow-hidden rounded-xl group">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-3 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
            👗
          </div>
          <div className="h-3 bg-gray-300 rounded w-2/3 mb-2 animate-pulse"></div>
          <div className="h-2 bg-gray-300 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="text-white text-center">
            <div className="text-sm font-bold mb-1">Launching Soon</div>
            <div className="text-xs">Stay tuned!</div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

{/* App Download Banner - Coming Soon */}
<section className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-12 relative overflow-hidden">
  <div className="absolute inset-0">
    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-x-16 -translate-y-16"></div>
    <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full translate-x-20 translate-y-20"></div>
  </div>
  <div className="container mx-auto px-4 text-center relative">
    <div className="inline-block mb-4">
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">APP COMING SOON</span>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
    <h2 className="text-3xl font-bold mb-4 animate-pulse">Download Our App</h2>
    <p className="text-lg mb-6 max-w-2xl mx-auto text-gray-300">
      Our mobile app is currently in development. Get ready for an amazing shopping experience!
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button className="bg-gray-600 text-gray-300 font-semibold px-8 py-3 relative overflow-hidden group cursor-not-allowed">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <span className="relative">📱 iOS - Coming Soon</span>
      </Button>
      <Button className="bg-gray-600 text-gray-300 font-semibold px-8 py-3 relative overflow-hidden group cursor-not-allowed">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" style={{ animationDelay: '0.5s' }}></div>
        <span className="relative">🤖 Android - Coming Soon</span>
      </Button>
    </div>
    <div className="mt-6 text-sm text-gray-400">
      <div className="inline-flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
        Estimated Launch: Q1 2024
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  </div>
</section>

{/* Add to your global CSS or Tailwind config */}
<style jsx global>{`
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`}</style>

      <Footer />
    </div>
  );
};

export default Home;
