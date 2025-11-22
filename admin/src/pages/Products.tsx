import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  itemName: string;
  category: { name: string } | null;
  subcategory: string;
  salesPrice: number;
  afterDiscount: number;
  skuCode: string;
  priceType: string;
  openStock: number;
  vendorId: { name: string } | null;
  images: string[];
  status?: "pending" | "approved" | "rejected";
  createdAt: string;
  [key: string]: any;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
  }>({ open: false, action: null });

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://api.apexbee.in/api/products");
        const productsWithStatus = res.data.products.map((p: any) => ({
          ...p,
          status: "pending", // default, backend may also provide actual status
        }));
        setProducts(productsWithStatus);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const getStatusBadge = (status: string) => (
    <Badge
      variant={status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive"}
      className={
        status === "approved"
          ? "bg-success text-success-foreground"
          : status === "pending"
          ? "bg-warning text-warning-foreground"
          : "bg-destructive text-destructive-foreground"
      }
    >
      {status}
    </Badge>
  );

  const handleAction = (product: Product, action: "approve" | "reject") => {
    setSelectedProduct(product);
    setActionDialog({ open: true, action });
  };

  const confirmAction = async () => {
    if (!selectedProduct || !actionDialog.action) return;

    try {
      // Call backend API
      const endpoint = `https://api.apexbee.in/api/products/${selectedProduct._id}/${actionDialog.action}`;
      await axios.post(endpoint);

      // Update locally
      const newStatus = actionDialog.action === "approve" ? "approved" : "rejected";
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, status: newStatus } : p))
      );

      toast.success(`Product ${actionDialog.action}ed successfully`);
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    } finally {
      setActionDialog({ open: false, action: null });
      setSelectedProduct(null);
    }
  };

  const columns = [
    { header: "Product Name", accessor: (item: Product) => item.itemName },
    { header: "Category", accessor: (item: Product) => item.category?.name || "N/A" },
    { header: "Sub-Category", accessor: (item: Product) => item.subcategory || "N/A" },
    { header: "Price", accessor: (item: Product) => `₹${item.salesPrice}` },
    { header: "After Discount", accessor: (item: Product) => `₹${item.afterDiscount}` },
    { header: "SKU Code", accessor: (item: Product) => item.skuCode },
    { header: "Price Type", accessor: (item: Product) => item.priceType },
    { header: "Stock", accessor: (item: Product) => item.openStock },
    { header: "Vendor", accessor: (item: Product) => item.vendorId?.name || "N/A" },
    { header: "Status", accessor: (item: Product) => getStatusBadge(item.status || "pending") },
    {
      header: "Actions",
      accessor: (item: Product) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelectedProduct(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-success hover:bg-success/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item, "approve");
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item, "reject");
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Products</h1>
        <p className="text-muted-foreground">Manage product listings and approvals</p>
      </div>

      <DataTable data={products} columns={columns} searchKey="itemName" />

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct && !actionDialog.open} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Complete information about the product</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Product Name</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.itemName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.category?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sub-Category</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.subcategory || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-sm text-muted-foreground">₹{selectedProduct.salesPrice}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">After Discount</p>
                  <p className="text-sm text-muted-foreground">₹{selectedProduct.afterDiscount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">SKU Code</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.skuCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Price Type</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.priceType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Stock</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.openStock}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vendor</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.vendorId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(selectedProduct.status || "pending")}
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedProduct.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {selectedProduct.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`product-${idx}`}
                    className="w-full h-32 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={() => setActionDialog({ open: false, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action} this product?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
