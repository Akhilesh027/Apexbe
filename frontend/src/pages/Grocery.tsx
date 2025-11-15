import { useEffect, useState } from "react";
import axios from "axios";
import grocary from '../Web images/Web images/grocary.png';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";

const Grocery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { icon: "🍎", label: "Fruits" },
    { icon: "🥦", label: "Vegetables" },
    { icon: "🥛", label: "Dairy" },
    { icon: "🍞", label: "Bakery" },
    { icon: "🍝", label: "Staples" },
  ];

  // Fetch grocery products from API
  useEffect(() => {
    const fetchGroceryProducts = async () => {
      try {
        const res = await axios.get(
          "https://website-backend-57f9.onrender.com/api/products?category=grocery"
        );

        setProducts(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching grocery products:", err);
        setLoading(false);
      }
    };

    fetchGroceryProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
                           <img src={grocary} alt="Fashion" />


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
          Earn 5% Cashback on Grocery Orders Above Rs. 500
        </div>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-navy mb-6">Fresh Arrivals</h2>

        {/* Loading */}
        {loading && (
          <p className="text-center text-gray-600 text-lg">Loading...</p>
        )}

        {/* No Products */}
        {!loading && products.length === 0 && (
          <p className="text-center text-gray-600 text-lg">
            No grocery products found.
          </p>
        )}

        {/* Product List */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Grocery;
