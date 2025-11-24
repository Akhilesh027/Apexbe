import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import BrandCard from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react"; // Added useMemo for filtering
import axios from "axios";

// Define a type for a product object to improve type safety
interface Product {
    _id: string;
    itemName?: string;
    name?: string;
    finalAmount?: number;
    userPrice?: number; // MRP
    images: string[];
    subcategory: string; // Ensure subcategory ID is available for filtering
    [key: string]: any;
}

// Interface for Subcategory structure
interface Subcategory {
    _id: string;
    name: string;
}

const Category = () => {
    const { categoryName } = useParams();
    const [category, setCategory] = useState<any>(null);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 🌟 NEW STATE: Tracks the currently selected subcategory ID for filtering
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

    // Category icon mapping (Kept as is)
    const getCategoryIcon = (name: string | undefined) => {
        const iconMap: { [key: string]: string } = {
            fashion: "👕",
            electronics: "📱",
            home: "🏠",
            beauty: "💄",
            sports: "⚽",
            books: "📚",
            toys: "🧸",
            food: "🍕",
        };
        return iconMap[name?.toLowerCase() || ''] || "📦";
    };

    useEffect(() => {
        const fetchCategoryData = async () => {
            if (!categoryName) return;

            setLoading(true);
            setError(null);

            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    // 1. Fetch ALL APPROVED products for this category
                    axios.get(`https://api.apexbee.in/api/products/${encodeURIComponent(categoryName)}`),
                    // 2. Fetch ALL categories to find the matching one and get embedded subcategories
                    axios.get("https://api.apexbee.in/api/categories")
                ]);
                
                // --- Process Category Data (Extraction) ---
                const categoriesData = categoriesRes.data;
                const foundCategory = categoriesData.categories.find(
                    (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (!foundCategory) {
                    setError("Category not found");
                    setLoading(false);
                    return;
                }
                
                setCategory(foundCategory);
                // Extract embedded subcategories
                setSubcategories(foundCategory.subcategories || []);

                // --- Process Product Data ---
                const productsData = productsRes.data;

                if (!productsData.success) {
                     throw new Error(productsData.error || "Failed to fetch products.");
                }

                setAllProducts(productsData.products || []);
                

            } catch (err: any) {
                console.error("Error fetching category data:", err);
                setError(err.response?.data?.error || err.message || "Network error");
                setCategory(null);
                setAllProducts([]);
                setSubcategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [categoryName]);


    // 🌟 MEMOIZED FILTERING LOGIC 🌟
    // Filters allProducts based on the selectedSubcategoryId state
    const filteredProducts = useMemo(() => {
        if (!selectedSubcategoryId) {
            return allProducts; // Show all if 'All' is selected or nothing is selected
        }
        return allProducts.filter(product => product.subcategory === selectedSubcategoryId);
    }, [allProducts, selectedSubcategoryId]);


    // --- Static data kept as is ---
    const nearbyStores = [
        { name: "Max Fashion", logo: "/placeholder.svg" },
        { name: "Central", logo: "/placeholder.svg" },
        { name: "Pantaloons", logo: "/placeholder.svg" },
        { name: "Westside", logo: "/placeholder-product.png" },
        { name: "Lifestyle", logo: "/placeholder.svg" },
        { name: "D-Mart", logo: "/placeholder.svg" },
        { name: "Ratnadeep", logo: "/placeholder.svg" },
    ];

    const promotionalProducts = [
        { id: 1, name: "Limited time deal", discount: 85 },
        { id: 2, name: "Limited time deal", discount: 85 },
        { id: 3, name: "Limited time deal", discount: 85 },
        { id: 4, name: "Limited time deal", discount: 85 },
    ];
    // --- End Static data ---


    // --- Loading and Error States ---
    if (loading)
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="text-xl text-muted-foreground">Loading category...</div>
                </div>
            </div>
        );

    if (error || !category)
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="text-xl text-red-600 mb-4">{error || "Category not found"}</div>
                    <Link to="/" className="text-blue-600 hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    // --- End Loading and Error States ---


    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Category Banner */}
            {category.image && (
                <div className="w-full h-64 md:h-80 overflow-hidden">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm text-muted-foreground">
                    <Link to="/" className="hover:underline">
                        Home
                    </Link>{" "}
                    / {category.name}
                </div>
            </div>

            {/* 🌟 UPDATED: Subcategories as Filter Tabs 🌟 */}
            <section className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-navy mb-6">{category.name} Categories</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    
                    {/* All Products Tab */}
                    <div
                        onClick={() => setSelectedSubcategoryId(null)}
                        className={`flex-shrink-0 cursor-pointer ${
                            !selectedSubcategoryId ? 'border-b-4 border-primary' : 'border-b-4 border-transparent'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2 w-20 text-center opacity-100 hover:opacity-80 transition-opacity">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                                !selectedSubcategoryId ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                📦
                            </div>
                            <span className="text-sm font-medium text-navy">All</span>
                        </div>
                    </div>

                    {/* Dynamic Subcategory Tabs */}
                    {subcategories.map((subcategory) => (
                        <div
                            key={subcategory._id}
                            onClick={() => setSelectedSubcategoryId(subcategory._id)}
                            className={`flex-shrink-0 cursor-pointer ${
                                selectedSubcategoryId === subcategory._id ? 'border-b-4 border-primary' : 'border-b-4 border-transparent'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-2 w-20 text-center opacity-100 hover:opacity-80 transition-opacity">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                                    selectedSubcategoryId === subcategory._id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {getCategoryIcon(subcategory.name)}
                                </div>
                                <span className="text-sm font-medium text-navy">{subcategory.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cashback Banner */}
            <div className="container mx-auto px-4 mb-8">
                <div className="bg-yellow-banner text-navy text-center py-3 rounded-lg font-semibold">
                    Earn 10% Cashback on Every App Order
                </div>
            </div>

            {/* 🌟 UPDATED: Products Grid showing FILTERED PRODUCTS 🌟 */}
            <section className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-navy mb-6">
                    {selectedSubcategoryId ? subcategories.find(s => s._id === selectedSubcategoryId)?.name : "Featured"} Products
                </h2>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No products available in this {selectedSubcategoryId ? 'subcategory' : 'category'} yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {filteredProducts.map((product) => (
                            <Link to={`/product/${product._id}`} key={product._id} className="block">
                                <div className="bg-blue-light rounded-lg overflow-hidden h-[400px] flex flex-col hover:shadow-lg transition-shadow">

                                    {/* Fixed Image Height */}
                                    <div className="h-[250px] bg-white/50 flex items-center justify-center">
                                        <img
                                            src={product.images?.[0] || "/placeholder-product.png"}
                                            alt={product.itemName || product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-4 flex flex-col h-full">
                                        <h3 className="font-semibold text-navy mb-2 line-clamp-2">
                                            {product.itemName || product.name}
                                        </h3>

                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                {/* Final Amount is the price after commission */}
                                                <span className="text-lg font-bold text-navy">
                                                    Rs. {product.finalAmount?.toFixed(2) || 'N/A'} 
                                                </span>
                                                {product.userPrice && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        Rs. {product.userPrice.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 mt-2">
                                                <div className="bg-accent text-white text-xs px-2 py-1 rounded">
                                                    ⭐ {product.rating || 4.0}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    ({product.reviews || 0})
                                                </span>

                                                {product.tag && (
                                                    <div className="ml-auto bg-yellow-banner text-navy text-xs px-2 py-1 rounded font-semibold">
                                                        {product.tag}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>


            {/* Near By Stores */}
            <section className="container mx-auto px-4 py-12 mb-8">
                <h2 className="text-2xl font-bold text-navy text-center mb-8">Near By Stores</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                    {nearbyStores.map((store) => (
                        <BrandCard key={store.name} {...store} />
                    ))}
                </div>
            </section>

            {/* Special Edition / Promotional Products */}
            <section className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-navy text-center mb-8">Special Edition Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {promotionalProducts.map((product) => (
                        <div key={product.id} className="bg-blue-light rounded-lg overflow-hidden">
                            <div className="aspect-square bg-white/50 flex items-center justify-center">
                                <span className="text-muted-foreground">Product Image</span>
                            </div>
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

export default Category;