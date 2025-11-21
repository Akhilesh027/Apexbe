import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

// Helper function for currency formatting
const formatCurrency = (amount) => {
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
        if (!vendor?.id) {
          console.error("Vendor ID not found in localStorage.");
          setLoading(false);
          return;
        }

        const res = await fetch(`https://api.apexbee.in/api/products/vendor/${vendor.id}`);
        const data = await res.json();

        if (res.ok) {
          setProducts(data || []); 
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

  const handleToggleActive = (productId, currentActive) => {
    setProducts(prev =>
      prev.map(p => p._id === productId ? { ...p, active: !currentActive } : p)
    );
    // TODO: Update backend API for active status
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const vendor = JSON.parse(localStorage.getItem("vendor"));
      const res = await fetch(`https://api.apexbee.in/api/products/${productId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ vendorId: vendor.id }),
});


      const data = await res.json();

      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== productId));
        alert("Product deleted successfully.");
      } else {
        alert(data.error || "Failed to delete product.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

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
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const productId = product._id;
                const activeStatus = product.active === undefined ? true : product.active;
                const mainImage = product.images?.[0] || "";
                const stock = product.openStock ?? 0;
                const discountText = product.discount ? `${product.discount}% Off` : "";

                return (
                  <tr key={productId} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.itemName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">No Image</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/products/${productId}`} className="hover:underline text-primary font-medium">
                        {product.itemName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{product.categoryName}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{formatCurrency(product.afterDiscount)}</span>
                        {product.userPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.userPrice)}
                          </span>
                        )}
                        <span className="text-xs text-green-600">{discountText}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={stock <= 5 ? "destructive" : "default"} className="rounded-full">
                        {stock}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Switch
                        checked={activeStatus}
                        onCheckedChange={() => handleToggleActive(productId, activeStatus)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(productId)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
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
