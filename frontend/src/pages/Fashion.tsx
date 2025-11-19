import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import BrandCard from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // Import Link for dynamic navigation
import { useEffect, useState } from "react"; // Import hooks for data fetching
import fasion from '../Web images/Web images/fasion.png';
// Placeholder for the product data structure (Adjust this based on your actual API response)

const Fashion = () => {
    const categoryName = "fasion"; // You can make this dynamic based on route params if needed
    const [fashionProducts, setFashionProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { icon: "👕", label: "Tops & Tees" },
        { icon: "👗", label: "Dresses & Jumpsuits" },
        { icon: "👖", label: "Jeans & Jeggings" },
        { icon: "🏃‍♀️", label: "Active Wear" },
        { icon: "👙", label: "Beach Wear" },
        { icon: "👘", label: "Kurtas & Kurtis" },
        { icon: "🥻", label: "Sarees" },
        { icon: "👔", label: "Ethnic Bottom" },
        { icon: "🎽", label: "Fusion Wear" },
        { icon: "🤰", label: "Maternity Wear" },
    ];

    const nearbyStores = [
        { name: "Max Fashion", logo: "/placeholder.svg" },
        { name: "Central", logo: "/placeholder.svg" },
        { name: "Pantaloons", logo: "/placeholder.svg" },
        { name: "Westside", logo: "/placeholder.svg" },
        { name: "Lifestyle", logo: "/placeholder.svg" },
        { name: "D-Mart", logo: "/placeholder.svg" },
        { name: "Ratnadeep", logo: "/placeholder.svg" },
    ];

    const winterProducts = [
        { id: 1, name: "Limited time deal", discount: 85 },
        { id: 2, name: "Limited time deal", discount: 85 },
        { id: 3, name: "Limited time deal", discount: 85 },
        { id: 4, name: "Limited time deal", discount: 85 },
    ];
    // ---------------------------------------------


    // --- Dynamic Data Fetching ---
    useEffect(() => {
        const fetchFashionProducts = async () => {
            setLoading(true);
            try {
                // Assuming your API endpoint accepts a category filter or has a specific endpoint for 'fashion'
                // You may need to replace 'https://api.apexbee.in/api/products?category=fashion' with your actual endpoint
                const res = await fetch(`http://localhost:5000/api/products?category=${categoryName}`); 
                const data = await res.json();

                if (res.ok) {
                    // Assuming the API returns an array of products
                    setFashionProducts(data.products || data);
                } else {
                    console.error("Failed to fetch fashion products:", data.error);
                    // Use a fallback if fetching fails
                    setFashionProducts([placeholderProduct, {...placeholderProduct, _id: "p2"}, {...placeholderProduct, _id: "p3"}]);
                }
            } catch (error) {
                console.error("Network error while fetching fashion products:", error);
                // Use a fallback if fetching fails
                setFashionProducts([placeholderProduct, {...placeholderProduct, _id: "p2"}, {...placeholderProduct, _id: "p3"}]);
            } finally {
                setLoading(false);
            }
        };

        fetchFashionProducts();
    }, []);
    // -----------------------------


    return (
        <div className="min-h-screen bg-background">
            <Navbar />

                                 <img src={fasion} alt="Fashion" />


            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm text-muted-foreground">
                    <Link to="/" className="hover:underline">Home</Link> / Fashion / Womens Wear
                </div>
            </div>

            {/* Categories */}
            <section className="container mx-auto px-4 py-8">
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {categories.map((category) => (
                        <CategoryIcon key={category.label} {...category} />
                    ))}
                </div>
            </section>

            {/* Cashback Banner */}
            <div className="container mx-auto px-4 mb-8">
                <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold">
                    Earn 10% Cashback on Every App Order
                </div>
            </div>

            {/* Products Grid (Now Dynamic) */}
            <section className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-navy mb-6">Featured Fashion Products</h2>

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading the latest fashion products...</div>
                ) : fashionProducts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No fashion products are currently available.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {/* Map over the fetched fashionProducts */}
                        {fashionProducts.map((product) => (
                            <Link to={`/product/${product._id}`} key={product._id} className="block">
                                <div className="bg-blue-light rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
                                    <div className="aspect-square bg-white/50">
                                        {/* Use product image here */}
                                        <img src={`${product.image}` || placeholderProduct.image} alt={product.name} className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        {/* Use product name */}
                                        <h3 className="font-semibold text-navy mb-2">{product.name || "Product Name"}</h3>
                                        <div className="flex items-baseline gap-2">
                                            {/* Use product price */}
                                            <span className="text-lg font-bold text-navy">Rs. {product.price || 499}</span>
                                            <span className="text-sm text-muted-foreground line-through">Rs. {product.originalPrice || 999}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="bg-accent text-white text-xs px-2 py-1 rounded">
                                                ⭐ {product.rating || 4.0}
                                            </div>
                                            <span className="text-xs text-muted-foreground">({product.reviews || 0})</span>
                                            <div className="ml-auto bg-yellow-banner text-navy text-xs px-2 py-1 rounded font-semibold">
                                                {product.tag || "New"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Promotional Banners (Unchanged) */}
            <section className="container mx-auto px-4 py-8">
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

            {/* Near By Stores (Unchanged) */}
            <section className="container mx-auto px-4 py-12 mb-8">
                <h2 className="text-2xl font-bold text-navy text-center mb-8">Near By Stores</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                    {nearbyStores.map((store) => (
                        <BrandCard key={store.name} {...store} />
                    ))}
                </div>
            </section>

            {/* Winter Season Special (Unchanged) */}
            <section className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-navy text-center mb-8">
                    Winter Season Special Edition
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {winterProducts.map((product) => (
                        <div key={product.id} className="bg-blue-light rounded-lg overflow-hidden">
                            <div className="aspect-square bg-white/50"></div>
                            <div className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                                        {product.discount}% off
                                    </div>
                                    <span className="text-xs text-muted-foreground">{product.name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Fashion;