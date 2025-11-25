import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

// Currency formatter
const formatCurrency = (amount) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const vendor = JSON.parse(localStorage.getItem("vendor"));
        if (!vendor?.id) {
          console.error("Vendor ID missing.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.apexbee.in/api/products/vendor/${vendor.id}`
        );
        const data = await res.json();

        if (res.ok) setProducts(data || []);
        else setProducts([]);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Delete product
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
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        alert("Product deleted successfully.");
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Delete failed.");
    }
  };

  // Open vendor confirmation popup
  const openConfirmPopup = (product) => {
    setSelectedProduct(product);
    setShowConfirmModal(true);
  };

  // Vendor Confirm (UPDATED API)
  const handleVendorConfirm = async () => {
    try {
      const res = await fetch(
        `https://api.apexbee.in/api/products/vendor/confirm/${selectedProduct._id}`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct._id
              ? { ...p, status: "Approved" }
              : p
          )
        );
        alert("Product confirmed successfully.");
      } else alert(data.message);
    } catch {
      alert("Server error");
    }

    setShowConfirmModal(false);
  };

  // Vendor Reject (UPDATED API)
  const handleVendorReject = async () => {
    try {
      const res = await fetch(
        `https://api.apexbee.in/api/products/vendor/reject/${selectedProduct._id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct._id
              ? { ...p, status: "Vendor Rejected" }
              : p
          )
        );
        alert("You rejected the product.");
      } else alert(data.message);
    } catch {
      alert("Server error");
    }

    setShowConfirmModal(false);
  };

  // STATUS BADGE COLORS
  const getStatusColor = (status) => {
    switch (status) {
      case "Admin Approved":
        return "bg-blue-600 text-white";
      case "Vendor Confirmed":
      case "Approved":
        return "bg-green-600 text-white";
      case "Vendor Rejected":
      case "Admin Rejected":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
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
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const productId = product._id;
                const mainImage = product.images?.[0] || "";
                const stock = product.openStock ?? 0;

                return (
                  <tr key={productId} className="hover:bg-muted/50">
                    {/* IMAGE */}
                    <td className="px-6 py-4">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.itemName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>

                    {/* NAME */}
                    <td className="px-6 py-4">
                      <Link
                        to={`/products/${productId}`}
                        className="hover:underline text-primary font-medium"
                      >
                        {product.itemName}
                      </Link>
                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-4">{product.categoryName}</td>

                    {/* PRICE */}
                    <td className="px-6 py-4">
                      <span className="font-semibold">
                        {formatCurrency(product.finalAmount)}
                      </span>
                    </td>

                    {/* STOCK */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={stock <= 5 ? "destructive" : "default"}
                        className="rounded-full"
                      >
                        {stock}
                      </Badge>
                    </td>

                    {/* STATUS + VENDOR CONFIRM */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Badge
                        className={`px-3 py-1 rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </Badge>

                      {/* Vendor can confirm ONLY when Admin approves */}
                      {product.status === "Admin Approved" && (
                        <Button
                          className="bg-green-600 text-white"
                          size="sm"
                          onClick={() => openConfirmPopup(product)}
                        >
                          Confirm
                        </Button>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 flex gap-2">
                      <Link to={`/products/edit/${productId}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(productId)}
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

        <div className="px-6 py-4 border-t text-sm text-muted-foreground">
          {`1-${products.length} of ${products.length}`}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Product Management</h1>

          <Link to="/products/add">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              ADD NEW PRODUCTS
            </Button>
          </Link>
        </div>

        {content}
      </div>

      {/* CONFIRMATION POPUP */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-3">Confirm Admin Approval</h2>

            <p className="font-medium text-gray-700">{selectedProduct.itemName}</p>

            <div className="mt-4 bg-gray-100 p-4 rounded">
              <p>
                Commission: <strong>{selectedProduct.commission}%</strong>
              </p>
              <p>
                Your Earnings:{" "}
                <strong>{formatCurrency(selectedProduct.finalAmount)}</strong>
              </p>
            </div>

            <p className="mt-4 font-semibold">Do you accept this approval?</p>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="destructive" onClick={handleVendorReject}>
                Reject
              </Button>

              <Button className="bg-green-600" onClick={handleVendorConfirm}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Products;
