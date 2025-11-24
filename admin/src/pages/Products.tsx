import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    commission: number;
    finalAmount: number;
    skuCode: string;
    priceType: string;
    openStock: number;
    vendorId: { name: string } | null;
    images: string[];
    status: "Pending" | "Approved" | "Rejected" | string;
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
    
    const [newCommission, setNewCommission] = useState<number | string>("");

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get("https://api.apexbee.in/api/products");
                setProducts(res.data.products || []);
            } catch (error) {
                console.error("Error fetching products:", error);
                toast.error("Failed to load products");
            }
        };
        fetchProducts();
    }, []);

    // Effect to reset commission input when a new product is selected
    useEffect(() => {
        if (selectedProduct) {
            setNewCommission(selectedProduct.commission || 0);
        } else {
            setNewCommission("");
        }
    }, [selectedProduct]);

    const getStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        return (
            <Badge
                variant={lowerStatus === "approved" ? "default" : lowerStatus === "pending" ? "secondary" : "destructive"}
                className={
                    lowerStatus === "approved"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : lowerStatus === "pending"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                }
            >
                {status}
            </Badge>
        );
    };

    // Handler for Approve/Reject button clicks (opens the confirmation dialog for Reject)
    const handleAction = (product: Product, action: "approve" | "reject") => {
        setSelectedProduct(product);
        setActionDialog({ open: true, action });
    };

    // Handles both 'Approve with Commission' and 'Reject'
    const confirmAction = async () => {
        if (!selectedProduct || !actionDialog.action) return;

        const action = actionDialog.action;
        const commissionValue = action === "approve" ? Number(newCommission) : 0;
        
        if (action === "approve" && (isNaN(commissionValue) || commissionValue < 0)) {
            toast.error("Please enter a valid non-negative commission value.");
            return;
        }

        try {
            const endpoint = `https://api.apexbee.in/api/products/${selectedProduct._id}/${action}`;
            
            await axios.post(endpoint, {
                commission: commissionValue,
            });

            // Calculate the final amount the vendor receives (for display purposes)
            // Final = AfterDiscount * (1 - Commission/100)
            const finalVendorAmount = (selectedProduct.afterDiscount || 0) * (1 - (commissionValue / 100));

            // Update locally
            const newStatus = action === "approve" ? "Approved" : "Rejected";
            setProducts((prev) =>
                prev.map((p) =>
                    p._id === selectedProduct._id
                        ? { 
                            ...p, 
                            status: newStatus,
                            commission: commissionValue,
                            finalAmount: parseFloat(finalVendorAmount.toFixed(2)) 
                        }
                        : p
                )
            );

            toast.success(`Product ${action}d successfully. Commission set to ${commissionValue}%`);
        } catch (error) {
            console.error("Error updating product status:", error);
            toast.error("Failed to update product status");
        } finally {
            setActionDialog({ open: false, action: null });
            setSelectedProduct(null);
            setNewCommission("");
        }
    };

    // Calculate final vendor amount dynamically for the Details Dialog
    const calculateFinalVendorAmount = (product: Product, commission: number | string) => {
        const finalDiscountedPrice = product.afterDiscount || 0;
        const commissionRate = Number(commission) || 0;

        if (finalDiscountedPrice === 0) {
            return "0.00";
        }
        
        // Calculate the commission amount in currency
        const commissionAmount = (finalDiscountedPrice * commissionRate) / 100;
        const finalAmount = finalDiscountedPrice - commissionAmount;
        
        return finalAmount.toFixed(2);
    };


    const columns = [
        { header: "Product Name", accessor: (item: Product) => item.itemName },
        { header: "Category", accessor: (item: Product) => item.category?.name || "N/A" },
        { header: "Final Price", accessor: (item: Product) => `₹${item.afterDiscount?.toFixed(2) || "0.00"}` },
        { header: "Comm. (%)", accessor: (item: Product) => `${item.commission || 0}%` },
        { header: "Vendor Receipt", accessor: (item: Product) => `₹${(item.afterDiscount * (1 - (item.commission || 0) / 100))?.toFixed(2) || "0.00"}` },
        { header: "SKU Code", accessor: (item: Product) => item.skuCode },
        { header: "Vendor", accessor: (item: Product) => item.vendorId?.name || "N/A" },
        { header: "Status", accessor: (item: Product) => getStatusBadge(item.status || "Pending") },
        {
            header: "Actions",
            accessor: (item: Product) => (
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelectedProduct(item)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {item.status?.toLowerCase() === "pending" && (
                        <>
                            {/* Approve button opens the details dialog to set commission */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-success hover:bg-success/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProduct(item);
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
            className: "text-right w-[150px]", // Set a fixed width for the action column
        },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Product Submissions 📦</h1>
                <p className="text-muted-foreground">Review and approve vendor products. Set the commission rate before final approval.</p>
            </div>

            {/* Data Table remains responsive by nature */}
            <DataTable data={products} columns={columns} searchKey="itemName" />

            {/* Product Details Dialog (Responsive) */}
            <Dialog open={!!selectedProduct && !actionDialog.open} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent className="max-w-4xl w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle>{selectedProduct?.itemName} Details</DialogTitle>
                        <DialogDescription>Review product information and set commission.</DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                            
                            {/* Left Column: Product Info & Description */}
                            <div className="space-y-4 md:border-r md:pr-4">
                                <h3 className="font-semibold text-xl border-b pb-2 text-primary">Product Info</h3>
                                
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <Label className="font-medium">Vendor:</Label>
                                    <p className="text-muted-foreground break-words">{selectedProduct.vendorId?.name || "N/A"}</p>
                                    
                                    <Label className="font-medium">Category:</Label>
                                    <p className="text-muted-foreground break-words">{selectedProduct.category?.name || "N/A"}</p>

                                    <Label className="font-medium">SKU Code:</Label>
                                    <p className="text-muted-foreground">{selectedProduct.skuCode}</p>

                                    <Label className="font-medium">Price Type:</Label>
                                    <p className="text-muted-foreground">{selectedProduct.priceType}</p>
                                    
                                    <Label className="font-medium">Current Stock:</Label>
                                    <p className="text-muted-foreground">{selectedProduct.openStock}</p>

                                    <Label className="font-medium">Status:</Label>
                                    {getStatusBadge(selectedProduct.status || "Pending")}
                                </div>

                                <div className="pt-2 border-t mt-4">
                                    <Label className="font-semibold text-base block mb-1">Description:</Label>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md min-h-[80px]">
                                        {selectedProduct.description || "No description provided."}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Pricing, Commission & Images */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-xl border-b pb-2 text-primary">Pricing & Approval</h3>
                                
                                {/* Pricing Review */}
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                    <div className="flex justify-between font-medium text-base">
                                        <span>Vendor's MRP:</span>
                                        <span>₹{selectedProduct.afterDiscount?.toFixed(2) || "0.00"}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-3">
                                        <span className="font-semibold">Customer's Final Sale Price:</span>
                                        <span className="font-extrabold text-2xl text-green-600">₹{selectedProduct.finalAmount?.toFixed(2) || "0.00"}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 text-sm text-muted-foreground">
                                        <span>Vendor's Expected Receipt (Pre-Admin Commission):</span>
                                        <span className="font-medium">₹{selectedProduct.finalAmount?.toFixed(2) || "0.00"}</span>
                                    </div>
                                </div>
                                
                                {/* COMMISSION INPUT AND APPROVAL */}
                                {selectedProduct.status?.toLowerCase() === 'pending' && (
                                    <div className="p-4 border rounded-lg bg-card shadow-lg space-y-3">
                                        <Label htmlFor="commission-rate" className="font-extrabold text-base block text-primary">Set Commission Rate (%)</Label>
                                        
                                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                                            <Input
                                                id="commission-rate"
                                                type="number"
                                                placeholder="Enter %"
                                                value={newCommission}
                                                onChange={(e) => setNewCommission(e.target.value)}
                                                className="h-10 text-lg flex-1"
                                                min="0"
                                            />
                                            <span className="text-xl font-bold hidden sm:block">%</span>
                                        </div>
                                        
                                        {/* Dynamic Commission Calculation Preview */}
                                        <div className="pt-2 border-t">
                                            <Label className="font-semibold block mb-1">Final Vendor Payout (After {Number(newCommission) || 0}% Commission):</Label>
                                            <p className="text-green-600 font-extrabold text-2xl">
                                                ₹{calculateFinalVendorAmount(selectedProduct, newCommission)}
                                            </p>
                                        </div>

                                        <div className="flex justify-between gap-2 pt-3 border-t">
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleAction(selectedProduct, "reject")}
                                                className="flex-1"
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                            <Button 
                                                className="bg-green-600 hover:bg-green-700 flex-1"
                                                onClick={() => {
                                                    // Immediately trigger the confirmAction logic for approval
                                                    setActionDialog({ open: true, action: "approve" });
                                                }}
                                                disabled={isNaN(Number(newCommission)) || Number(newCommission) < 0}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Image Previews */}
                                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Images</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedProduct.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`product-${idx}`}
                                            className="w-full h-20 sm:h-24 object-cover rounded border"
                                        />
                                    ))}
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
                        <DialogTitle>
                            {actionDialog.action === "approve" ? "Confirm Approval & Commission" : "Confirm Rejection"}
                        </DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to **{actionDialog.action}** this product?
                            {actionDialog.action === "approve" && selectedProduct && (
                                <p className="mt-2 font-semibold text-yellow-600">
                                    Commission will be finalized at: **{Number(newCommission) || 0}%**
                                </p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setActionDialog({ open: false, action: null })}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmAction} variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}>
                            {actionDialog.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Products;