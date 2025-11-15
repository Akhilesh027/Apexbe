import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

// Helper function for currency formatting
const formatCurrency = (amount) => {
  // Use 0 if amount is missing or invalid to prevent crash
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const vendor = JSON.parse(localStorage.getItem("vendor"));
        
        if (!vendor || !vendor.id) {
          console.error("Vendor ID not found in localStorage.");
          setLoading(false);
          return;
        }

        const res = await fetch(`https://website-backend-57f9.onrender.com/api/products/${vendor.id}`);
        const data = await res.json();

        if (res.ok) {
          // Ensure data.products is an array, defaulting to empty array if not
          setProducts(data.products || data || []); 
        } else {
          console.error(data.error || "Failed to fetch products.");
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handler for the status switch (uses optimistic UI update)
  const handleToggleActive = (productId, currentActive) => {
    // 1. Optimistic UI update: Change state immediately
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p._id === productId ? { ...p, active: !currentActive } : p
      )
    );

    // 2. **TODO:** Implement API call to update product active status
    /*
    try {
      await fetch(`https://website-backend-57f9.onrender.com/api/products/${productId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      // Optional: Revert UI change if API fails
    }
    */
  };

  // --- Rendering Logic ---
  let content;

  if (loading) {
    content = (
      <div className="text-center py-10 text-lg font-medium text-primary">
        Loading products...
      </div>
    );
  } else if (products.length === 0) {
    content = (
      <div className="text-center py-10 text-muted-foreground">
        <p className="text-xl font-semibold mb-2">No products found.</p>
        <p>Click the "ADD NEW PRODUCTS" button to list your first item.</p>
      </div>
    );
  } else {
    content = (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Product Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                // Safely define properties, using defaults for missing ones
                const productId = product.id || product._id;
                const activeStatus = product.active === undefined ? true : product.active;
                const originalPrice = product.originalPrice || product.price;
                const discount = product.discount || "0% Off";
                const statusTags = product.status || [];

                return (
                  <tr key={productId} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <img
                        src={`${product.image}`}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/products/${productId}`} className="hover:underline text-primary font-medium">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{formatCurrency(product.price)}</span>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                        <span className="text-xs text-green-600">{discount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={product.stock <= 5 ? "destructive" : "default"} className="rounded-full">
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {/* Using the safely defined activeStatus */}
                      <Switch
                        checked={activeStatus}
                        onCheckedChange={() => handleToggleActive(productId, activeStatus)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Using the safely defined statusTags */}
                        {statusTags.map((status, i) => (
                          <Badge
                            key={i}
                            variant={status === "Top" ? "default" : "outline"}
                            className={status === "Deal" ? "bg-green-500 text-white hover:bg-green-600" : ""}
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>{`1-${products.length} of ${products.length}`}</span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <Link to="/products/add">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              ADD NEW PRODUCTS
            </Button>
          </Link>
        </div>
        {content}
      </div>
    </AppLayout>
  );
};

export default Products;