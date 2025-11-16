import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import StoreCard from "@/components/StoreCard";
import BrandCard from "@/components/BrandCard";
import LocationModal from "@/components/LocationModal";
import WaveSection from "@/components/WaveSection";
import { Button } from "@/components/ui/button";
import ratnadeepLogo from "../Web images/Web images/ratandeep.png";
import wodden from "../Web images/Web images/wodden.png";
import urben from '../Web images/Web images/urban.png';

import grocary from '../Web images/Web images/grocary.png';
import logo from '../Web images/Web images/logo.jpg';
const Home = () => {
  const [showLocationModal, setShowLocationModal] = useState(true);

  const categories = [
    { icon: "🏃", label: "Fashion", to: "/fashion" },
    //{ icon: "💍", label: "Jewelery", to: "/jewelry" },
    { icon: "🍎", label: "Grocery", to: "/grocery" },
    // { icon: "🏠", label: "Electronics", to: "/electronics" },
    // { icon: "🪑", label: "Furniture", to: "/furniture" },
    // { icon: "💊", label: "Medicines" },
    // { icon: "📱", label: "Personal Care" },
    // { icon: "🥘", label: "Food" },
    // { icon: "🚗", label: "Pet & Toys" },
    // { icon: "⚽", label: "Sports" },
    // { icon: "🎮", label: "Books" },
    // { icon: "💄", label: "Makeup" },
  ];

  const stores = [
    { name: "RATNADEEP", tagline: "Recycling since 1987", image: ratnadeepLogo },
    { name: "Wooden Street", tagline: "Furniture, loaded with love", image: wodden },
    { name: "Urban Ladder", tagline: "Quality & comfort", image: urben },
  ];
const nearbyStores = [
  { 
    name: "Max Fashion", 
    logo: "https://logo.clearbit.com/maxfashion.in"
  },
  { 
    name: "Central", 
    logo: "https://logo.clearbit.com/centralandme.com"
  },
  { 
    name: "Pantaloons", 
    logo: "https://logo.clearbit.com/pantaloons.com"
  },
  { 
    name: "Westside", 
    logo: "https://logo.clearbit.com/westside.com"
  },
  { 
    name: "Lifestyle", 
    logo: "https://logo.clearbit.com/lifestylestores.com"
  },
  { 
    name: "D-Mart", 
    logo: "https://logo.clearbit.com/dmart.in"
  },
  { 
    name: "Ratnadeep", 
    logo: "https://logo.clearbit.com/ratnadeepretail.com"
  },
];

const fashionBrands = [
  { 
    name: "Raymond", 
    logo: "https://logo.clearbit.com/raymond.in"
  },
  { 
    name: "H&M", 
    logo: "https://logo.clearbit.com/hm.com"
  },
  { 
    name: "Harissons", 
    logo: "https://logo.clearbit.com/harissonsbags.com"
  },
  { 
    name: "Ray-Ban", 
    logo: "https://logo.clearbit.com/ray-ban.com"
  },
];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LocationModal open={showLocationModal} onOpenChange={setShowLocationModal} />

      {/* Banner Notice */}
      <div className="bg-blue-light border-b text-center py-2 text-sm">
        On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
      </div>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-navy mb-6">Explore</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-6 overflow-x-auto">
            {categories.map((category) => (
              <CategoryIcon key={category.label} {...category} />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Hero Banners */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
           <img src={grocary} alt="Home" />

         <img src={grocary} alt="grocary" />
        </div>
      </section>

      {/* Featured Stores with Wave */}
      <WaveSection bgColor="bg-navy">
        <div className="container mx-auto px-4">
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
        <div className="bg-yellow-banner text-navy text-center py-2 rounded-lg font-semibold">
          Earn 10% Cashback on Every App Order
        </div>
      </section>

      {/* Fashion Brands */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-navy text-center mb-8">Fashion Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {fashionBrands.map((brand) => (
            <BrandCard key={brand.name} {...brand} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
