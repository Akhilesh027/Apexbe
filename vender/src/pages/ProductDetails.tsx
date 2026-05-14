import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { toast } from "sonner";

// Extended product interface (backward compatible)
interface Product {
  _id: string;
  vendorName: string;
  itemType: string;
  categoryName: string;
  subcategoryName?: string;
  itemName: string;
  salesPrice: number;
  gstRate: number;
  description: string;
  images: string[];
  skuCode: string;
  measuringUnit: string;
  hsnCode: string;
  godown: string;
  openStock: number;
  asOnDate: string;
  userPrice: number;
  discount: number;
  afterDiscount: number;
  commission: number;          // Apex Bee Fee (%)
  finalAmount: number;         // Vendor gets this
  priceType: string;

  // Optional new fields (may be missing from old API)
  shippingCharges?: number;
  packingCharges?: number;
  referralCommissions?: {
    stateFranchiser?: { percentage: number; amount: number };
    districtFranchiser?: { percentage: number; amount: number };
    mondalFranchiser?: { percentage: number; amount: number };
    wishLink?: { percentage: number; amount: number };
    firstPurchase?: { percentage: number; amount: number };
    level1?: { percentage: number; amount: number };
    level2?: { percentage: number; amount: number };
    level3?: { percentage: number; amount: number };
  };
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://api.apexbee.in/api/product/${id}`);
        const data = await res.json();

        // Debug: log what we got from backend (remove in production)
        console.log("🔍 Product API response:", data);

        if (res.ok) {
          // Ensure we have default values for optional fields
          const enrichedProduct = {
            ...data,
            shippingCharges: data.shippingCharges ?? 0,
            packingCharges: data.packingCharges ?? 0,
            referralCommissions: data.referralCommissions || {},
          };
          setProduct(enrichedProduct);
          setSelectedImage(enrichedProduct.images?.[0] || "");
        } else {
          toast.error(data.message || "Failed to fetch product details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while fetching product");
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center text-lg font-medium text-muted-foreground">
          Loading product details...
        </div>
      </AppLayout>
    );
  }

  // Apex Bee Fee calculations
  const apexBeeFeeAmount = product.afterDiscount - product.finalAmount;
  const apexBeeFeePercent = product.commission;

  // Total referrals (safe)
  const totalReferrals = product.referralCommissions
    ? Object.values(product.referralCommissions).reduce(
        (sum, tier) => sum + (tier?.amount || 0),
        0
      )
    : 0;

  const netApexBeeCommission = apexBeeFeeAmount - totalReferrals;

  // Helper to check if any referral exists
  const hasReferrals = product.referralCommissions &&
    Object.values(product.referralCommissions).some(tier => tier && tier.amount > 0);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Product Details</h1>
          <Button onClick={() => navigate(`/products/edit/${product._id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <Card className="p-6">
            <div className="mb-4">
              <img
                src={selectedImage}
                alt={product.itemName}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images?.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.itemName} ${index + 1}`}
                  className={`w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 ${
                    selectedImage === img ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">{product.itemName}</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-medium">{product.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Type:</span>
                  <span className="font-medium">{product.itemType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.categoryName}</span>
                </div>
                {product.subcategoryName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subcategory:</span>
                    <span className="font-medium">{product.subcategoryName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Price:</span>
                  <span className="font-medium">₹{product.salesPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST Rate:</span>
                  <span className="font-medium">{product.gstRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU Code:</span>
                  <span className="font-medium">{product.skuCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Measuring Unit:</span>
                  <span className="font-medium">{product.measuringUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HSN Code:</span>
                  <span className="font-medium">{product.hsnCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Godown:</span>
                  <span className="font-medium">{product.godown}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open Stock:</span>
                  <Badge variant={product.openStock > 0 ? "default" : "destructive"}>
                    {product.openStock} units
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">As On Date:</span>
                  <span className="font-medium">{product.asOnDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRP:</span>
                  <span className="font-medium">₹{product.userPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">{product.discount}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Discount (Base Price):</span>
                  <span className="font-medium">₹{product.afterDiscount.toFixed(2)}</span>
                </div>

                {/* Apex Bee Fee Section */}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Apex Bee Fee:</span>
                    <span className="text-red-600">{apexBeeFeePercent}% (₹{apexBeeFeeAmount.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor Final Amount:</span>
                    <span className="font-bold text-green-600">₹{product.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Add‑ons Section - Always visible */}
                <div className="border-t pt-2 mt-2">
                  <div className="font-semibold mb-1">Checkout Add‑ons (Customer)</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping Charges:</span>
                    <span className="font-medium">₹{(product.shippingCharges ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packing Charges:</span>
                    <span className="font-medium">₹{(product.packingCharges ?? 0).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These are added to customer's bill and do not affect vendor payout.
                  </p>
                </div>

                {/* Referral Commissions Section - Always visible, shows message if empty */}
                <div className="border-t pt-2 mt-2">
                  <div className="font-semibold mb-2">Referral Commissions (paid from Apex Bee Fee)</div>
                  {hasReferrals ? (
                    <>
                      {Object.entries(product.referralCommissions!).map(([key, value]) => {
                        if (!value || value.amount === 0) return null;
                        const labelMap: Record<string, string> = {
                          stateFranchiser: "State Franchiser",
                          districtFranchiser: "District Franchiser",
                          mondalFranchiser: "Mondal Franchiser",
                          wishLink: "Wish Link Incentive",
                          firstPurchase: "1st Purchase Incentive",
                          level1: "Level 1",
                          level2: "Level 2",
                          level3: "Level 3",
                        };
                        const label = labelMap[key] || key;
                        return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{label}:</span>
                            <span>
                              {value.percentage}% (₹{value.amount.toFixed(2)})
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between font-semibold mt-2">
                        <span className="text-muted-foreground">Total Referrals:</span>
                        <span>₹{totalReferrals.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-muted-foreground">Net Apex Bee Commission:</span>
                        <span className="text-blue-600">₹{netApexBeeCommission.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No referral commissions set for this product.
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Type:</span>
                  <span className="font-medium">{product.priceType}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetails;