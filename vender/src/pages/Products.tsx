import { Plus, Trash2, Eye, Edit3, Package, IndianRupee, Tag, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Vendor Confirm
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

  // Vendor Reject
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Vendor Confirmed":
      case "Approved":
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

  // Loading Skeleton
  const ProductSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  // Stats Cards
  const stats = {
    total: products.length,
    approved: products.filter(p => p.status === "Approved" || p.status === "Vendor Confirmed").length,
    pending: products.filter(p => p.status === "Pending" || p.status === "Admin Approved").length,
    rejected: products.filter(p => p.status === "Vendor Rejected" || p.status === "Admin Rejected").length,
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog and inventory</p>
          </div>
          
          <Link to="/products/add">
            <Button className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              ADD NEW PRODUCT
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <p className="text-xs text-blue-600">All products in catalog</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
              <p className="text-xs text-green-600">Live and active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
              <Tag className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <p className="text-xs text-yellow-600">Awaiting action</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
              <p className="text-xs text-red-600">Not approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Product Catalog</CardTitle>
            <CardDescription>
              Manage your products, inventory, and approval status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <ProductSkeleton />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-6">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't added any products yet. Start by adding your first product to your catalog.
                </p>
                <Link to="/products/add">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead className="min-w-48">Product</TableHead>
                      <TableHead className="min-w-32">Category</TableHead>
                      <TableHead className="min-w-32">Price</TableHead>
                      <TableHead className="min-w-24">Stock</TableHead>
                      <TableHead className="min-w-40">Status</TableHead>
                      <TableHead className="min-w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const productId = product._id;
                      const mainImage = product.images?.[0] || "";
                      const stock = product.openStock ?? 0;

                      return (
                        <TableRow key={productId} className="group hover:bg-gray-50/50 transition-colors">
                          {/* IMAGE */}
                          <TableCell>
                            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border">
                              {mainImage ? (
                                <img
                                  src={mainImage}
                                  alt={product.itemName}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          </TableCell>

                          {/* PRODUCT INFO */}
                          <TableCell>
                            <div>
                              <Link
                                to={`/products/${productId}`}
                                className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2"
                              >
                                {product.itemName}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {product.description || "No description"}
                              </p>
                            </div>
                          </TableCell>

                          {/* CATEGORY */}
                          <TableCell>
                            <span className="text-sm text-gray-700">
                              {product.categoryName || "Uncategorized"}
                            </span>
                          </TableCell>

                          {/* PRICE */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4 text-gray-600" />
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(product.finalAmount)}
                              </span>
                            </div>
                            {product.mrp && product.mrp > product.finalAmount && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>MRP: </span>
                                <span className="line-through">{formatCurrency(product.mrp)}</span>
                              </div>
                            )}
                          </TableCell>

                          {/* STOCK */}
                          <TableCell>
                            <Badge
                              variant={
                                stock === 0
                                  ? "destructive"
                                  : stock <= 5
                                  ? "secondary"
                                  : "outline"
                              }
                              className={`rounded-full font-medium ${
                                stock === 0
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : stock <= 5
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-green-100 text-green-800 border-green-200"
                              }`}
                            >
                              {stock} {stock === 1 ? "unit" : "units"}
                            </Badge>
                          </TableCell>

                          {/* STATUS */}
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Badge
                                variant="outline"
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  product.status
                                )}`}
                              >
                                {product.status}
                              </Badge>

                              {/* Vendor can confirm ONLY when Admin approves */}
                              {product.status === "Admin Approved" && (
                                <Button
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                  size="sm"
                                  onClick={() => openConfirmPopup(product)}
                                >
                                  Confirm Approval
                                </Button>
                              )}
                            </div>
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/products/${productId}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              
                              <Link to={`/products/edit/${productId}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDeleteProduct(productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Table Footer */}
                <div className="px-6 py-4 border-t bg-gray-50/50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Showing {products.length} of {products.length} products
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Last updated: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl animate-in fade-in-90 zoom-in-90">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Admin Approval</h2>
                  <p className="text-gray-600 text-sm">Review and confirm product approval</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedProduct.itemName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-semibold">{selectedProduct.commission}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Earnings:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedProduct.finalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 text-center font-medium">
                    Do you accept this approval and commission terms?
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleVendorReject}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={handleVendorConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Products;