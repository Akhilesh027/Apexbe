import {
  Plus,
  Trash2,
  Eye,
  Edit3,
  Package,
  Tag,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

/* ===============================
   Helpers
=================================*/

// Safe vendor getter
const getVendor = () => {
  const raw = localStorage.getItem("vendor");
  return raw ? JSON.parse(raw) : null;
};

// Currency formatter
const formatCurrency = (amount: number) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Vendor earnings calculation
const calcVendorEarning = (price: number, commission: number) => {
  const p = Number(price) || 0;
  const c = Number(commission) || 0;
  return Math.round(p - (p * c) / 100);
};

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /* ===============================
     Fetch Products
  =================================*/
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const vendor = getVendor();
        if (!vendor?.id) {
          console.error("Vendor not logged in.");
          setProducts([]);
          return;
        }

        const res = await fetch(
          `https://api.apexbee.in/api/products/vendor/${vendor.id}`
        );
        const data = await res.json();

        setProducts(res.ok ? data || [] : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /* ===============================
     Delete Product
  =================================*/
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      const vendor = getVendor();
      if (!vendor?.id) return alert("Vendor not logged in.");

      const res = await fetch(
        `https://api.apexbee.in/api/products/${productId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId: vendor.id }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        alert("Product deleted successfully.");
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Delete failed.");
    }
  };

  /* ===============================
     Confirm / Reject
  =================================*/
  const openConfirmPopup = (product: any) => {
    setSelectedProduct(product);
    setShowConfirmModal(true);
  };

  const handleVendorConfirm = async () => {
    try {
      const vendor = getVendor();
      if (!vendor?.id) return alert("Vendor not logged in.");

      const res = await fetch(
        `https://api.apexbee.in/api/products/vendor/confirm/${selectedProduct._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId: vendor.id }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct._id
              ? { ...p, status: "Vendor Confirmed" }
              : p
          )
        );
        alert("Product confirmed successfully.");
      } else alert(data.message || "Confirm failed");
    } catch {
      alert("Server error");
    }

    setShowConfirmModal(false);
  };

  const handleVendorReject = async () => {
    try {
      const vendor = getVendor();
      if (!vendor?.id) return alert("Vendor not logged in.");

      const res = await fetch(
        `https://api.apexbee.in/api/products/vendor/reject/${selectedProduct._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId: vendor.id }),
        }
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
        alert("Product rejected.");
      } else alert(data.message || "Reject failed");
    } catch {
      alert("Server error");
    }

    setShowConfirmModal(false);
  };

  /* ===============================
     Status Colors
  =================================*/
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Admin Approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Vendor Confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Vendor Rejected":
      case "Admin Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  /* ===============================
     Stats
  =================================*/
  const stats = {
    total: products.length,
    approved: products.filter(
      (p) => p.status === "Vendor Confirmed"
    ).length,
    pending: products.filter(
      (p) => p.status === "Pending" || p.status === "Admin Approved"
    ).length,
    rejected: products.filter(
      (p) =>
        p.status === "Vendor Rejected" ||
        p.status === "Admin Rejected"
    ).length,
  };

  /* ===============================
     Render
  =================================*/
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-gray-600">
              Manage your product catalog and inventory
            </p>
          </div>

          <Link to="/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              ADD NEW PRODUCT
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>{stats.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved</CardTitle>
            </CardHeader>
            <CardContent>{stats.approved}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardContent>{stats.pending}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rejected</CardTitle>
            </CardHeader>
            <CardContent>{stats.rejected}</CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              Manage products and approval status
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4">No products found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.itemName}</TableCell>

                      <TableCell>
                        {formatCurrency(product.finalAmount)}
                      </TableCell>

                      <TableCell>
                        {product.openStock ?? 0}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={getStatusColor(product.status)}
                        >
                          {product.status}
                        </Badge>

                        {product.status === "Admin Approved" && (
                          <Button
                            size="sm"
                            className="ml-3"
                            onClick={() =>
                              openConfirmPopup(product)
                            }
                          >
                            Confirm
                          </Button>
                        )}
                      </TableCell>

                      <TableCell className="flex gap-2 justify-end">
                        <Link to={`/products/${product._id}`}>
                          <Button size="icon" variant="ghost">
                            <Eye size={16} />
                          </Button>
                        </Link>

                        <Link to={`/products/edit/${product._id}`}>
                          <Button size="icon" variant="ghost">
                            <Edit3 size={16} />
                          </Button>
                        </Link>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteProduct(product._id)
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-bold mb-4">
              Confirm Approval
            </h2>

            <p className="mb-2">
              Commission: {selectedProduct.commission}%
            </p>

            <p className="mb-4 text-green-600 font-semibold">
              Your Earnings:{" "}
              {formatCurrency(
                calcVendorEarning(
                  selectedProduct.finalAmount,
                  selectedProduct.commission
                )
              )}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleVendorReject}
              >
                Reject
              </Button>
              <Button onClick={handleVendorConfirm}>
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
