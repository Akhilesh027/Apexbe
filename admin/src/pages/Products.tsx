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
    
    const [commissionPercentage, setCommissionPercentage] = useState<number | string>("");
    const [commissionAmount, setCommissionAmount] = useState<number | string>("");

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

    // Effect to reset commission inputs when a new product is selected
    useEffect(() => {
        if (selectedProduct) {
            setCommissionPercentage(selectedProduct.commission || 0);
            // Calculate commission amount based on percentage
            const afterDiscount = selectedProduct.afterDiscount || 0;
            const commission = selectedProduct.commission || 0;
            const calculatedAmount = (afterDiscount * commission) / 100;
            setCommissionAmount(calculatedAmount.toFixed(2));
        } else {
            setCommissionPercentage("");
            setCommissionAmount("");
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

    // Calculate commission percentage from amount
    const calculatePercentageFromAmount = (amount: number, basePrice: number): number => {
        if (!basePrice || basePrice === 0) return 0;
        return (amount / basePrice) * 100;
    };

    // Calculate commission amount from percentage
    const calculateAmountFromPercentage = (percentage: number, basePrice: number): number => {
        return (basePrice * percentage) / 100;
    };

    // Handle commission percentage change
    const handleCommissionPercentageChange = (value: string) => {
        const percentage = value === "" ? "" : Number(value);
        setCommissionPercentage(percentage);
        
        if (selectedProduct && percentage !== "" && !isNaN(Number(percentage))) {
            const afterDiscount = selectedProduct.afterDiscount || 0;
            const calculatedAmount = calculateAmountFromPercentage(Number(percentage), afterDiscount);
            setCommissionAmount(calculatedAmount.toFixed(2));
        } else if (value === "") {
            setCommissionAmount("");
        }
    };

    // Handle commission amount change
    const handleCommissionAmountChange = (value: string) => {
        const amount = value === "" ? "" : Number(value);
        setCommissionAmount(amount);
        
        if (selectedProduct && amount !== "" && !isNaN(Number(amount))) {
            const afterDiscount = selectedProduct.afterDiscount || 0;
            const calculatedPercentage = calculatePercentageFromAmount(Number(amount), afterDiscount);
            setCommissionPercentage(calculatedPercentage.toFixed(2));
        } else if (value === "") {
            setCommissionPercentage("");
        }
    };

    // Handles both 'Approve with Commission' and 'Reject'
    const confirmAction = async () => {
        if (!selectedProduct || !actionDialog.action) return;

        const action = actionDialog.action;
        const commissionValue = action === "approve" ? Number(commissionPercentage) : 0;
        
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
            setCommissionPercentage("");
            setCommissionAmount("");
        }
    };

    // Calculate final vendor amount dynamically for the Details Dialog
    const calculateFinalVendorAmount = (product: Product, commissionPercent: number | string) => {
        const finalDiscountedPrice = product.afterDiscount || 0;
        const commissionRate = Number(commissionPercent) || 0;

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
            className: "text-right w-[150px]",
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
                                    <div className="p-4 border rounded-lg bg-card shadow-lg space-y-4">
                                        <Label className="font-extrabold text-base block text-primary">Set Commission</Label>
                                        
                                        {/* Commission Inputs in One Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Commission Amount Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="commission-amount" className="font-medium text-sm">
                                                    Amount (₹)
                                                </Label>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        id="commission-amount"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={commissionAmount}
                                                        onChange={(e) => handleCommissionAmountChange(e.target.value)}
                                                        className="h-9 text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>

                                            {/* Commission Percentage Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="commission-percentage" className="font-medium text-sm">
                                                    Percentage (%)
                                                </Label>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        id="commission-percentage"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={commissionPercentage}
                                                        onChange={(e) => handleCommissionPercentageChange(e.target.value)}
                                                        className="h-9 text-sm"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Dynamic Commission Calculation Preview */}
                                        <div className="pt-3 border-t space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Commission:</span>
                                                <span className="font-bold">{Number(commissionPercentage) || 0}% (₹{Number(commissionAmount)?.toFixed(2) || "0.00"})</span>
                                            </div>
                                            <div className="pt-2 border-t">
                                                <Label className="font-semibold block mb-1 text-sm">Final Vendor Payout:</Label>
                                                <p className="text-green-600 font-extrabold text-xl">
                                                    ₹{calculateFinalVendorAmount(selectedProduct, commissionPercentage)}
                                                </p>
                                            </div>
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
                                                    setActionDialog({ open: true, action: "approve" });
                                                }}
                                                disabled={isNaN(Number(commissionPercentage)) || Number(commissionPercentage) < 0}
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
                                <div className="mt-2 space-y-1">
                                    <p className="font-semibold text-yellow-600">
                                        Commission will be finalized at: <strong>{Number(commissionPercentage) || 0}%</strong>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Commission Amount: <strong>₹{Number(commissionAmount)?.toFixed(2) || "0.00"}</strong>
                                    </p>
                                </div>
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