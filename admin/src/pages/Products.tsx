import { useState } from "react";
import { mockProducts, Product } from "@/data/mockData";
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

const Products = () => {
  const [products, setProducts] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
  }>({ open: false, action: null });

  const getStatusBadge = (status: string) => {
    return (
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
  };

  const handleAction = (product: Product, action: "approve" | "reject") => {
    setSelectedProduct(product);
    setActionDialog({ open: true, action });
  };

  const confirmAction = () => {
    if (!selectedProduct || !actionDialog.action) return;

    const newStatus = actionDialog.action === "approve" ? "approved" : "rejected";

    setProducts((prev) =>
      prev.map((p) => (p.id === selectedProduct.id ? { ...p, status: newStatus as any } : p))
    );

    toast.success(`Product ${actionDialog.action}ed successfully`);
    setActionDialog({ open: false, action: null });
    setSelectedProduct(null);
  };

  const columns = [
    { header: "Product Name", accessor: (item: Product) => item.name },
    { header: "Category", accessor: (item: Product) => item.category },
    { header: "Sub-Category", accessor: (item: Product) => item.subCategory },
    { header: "Price", accessor: (item: Product) => `$${item.price.toFixed(2)}` },
    { header: "Stock", accessor: (item: Product) => item.stock },
    { header: "Vendor", accessor: (item: Product) => item.vendorName },
    { header: "Status", accessor: (item: Product) => getStatusBadge(item.status) },
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

      <DataTable data={products} columns={columns} searchKey="name" />

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
                  <p className="text-sm text-muted-foreground">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sub-Category</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.subCategory}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-sm text-muted-foreground">${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Stock</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.stock}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vendor</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(selectedProduct.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.createdAt}</p>
                </div>
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
