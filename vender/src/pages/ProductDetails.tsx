import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface ReferralTier {
  percentage: number;
  amount: number;
}

interface ReferralCommissions {
  stateFranchiser?: ReferralTier;
  districtFranchiser?: ReferralTier;
  mondalFranchiser?: ReferralTier;
  wishLink?: ReferralTier;
  firstPurchase?: ReferralTier;
  level1?: ReferralTier;
  level2?: ReferralTier;
  level3?: ReferralTier;
}

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
  userPrice: number;        // MRP
  discount: number;
  afterDiscount: number;    // Base price after discount
  commission: number;       // Apex Bee fee (%)
  finalAmount: number;      // Vendor gets this
  priceType: string;
  shippingCharges?: number;
  packingCharges?: number;
  referralCommissions?: ReferralCommissions;
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

        if (res.ok) {
          // Ensure defaults for optional fields
          const enriched: Product = {
            ...data,
            shippingCharges: data.shippingCharges ?? 0,
            packingCharges: data.packingCharges ?? 0,
            referralCommissions: data.referralCommissions || {},
          };
          setProduct(enriched);
          setSelectedImage(enriched.images?.[0] || "");
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

  // Calculations
  const apexBeeFeeAmount = product.afterDiscount - product.finalAmount;
  const apexBeeFeePercent = product.commission;

  const totalReferrals = product.referralCommissions
    ? Object.values(product.referralCommissions).reduce(
        (sum, tier) => sum + (tier?.amount || 0),
        0
      )
    : 0;

  const netApexBeeCommission = apexBeeFeeAmount - totalReferrals;

  const hasReferrals = product.referralCommissions &&
    Object.values(product.referralCommissions).some(tier => tier && tier.amount > 0);

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
              <h2 className="text-2xl font-bold mb-4">{product.itemName}</h2>

              <div className="space-y-2">
                <DetailRow label="Vendor" value={product.vendorName} />
                <DetailRow label="Item Type" value={product.itemType} />
                <DetailRow label="Category" value={product.categoryName} />
                {product.subcategoryName && (
                  <DetailRow label="Subcategory" value={product.subcategoryName} />
                )}
                <DetailRow label="MRP" value={`₹${product.userPrice.toFixed(2)}`} />
                <DetailRow label="Discount" value={`${product.discount}%`} />
                <DetailRow label="After Discount (Base Price)" value={`₹${product.afterDiscount.toFixed(2)}`} />
                
                <div className="border-t pt-2 mt-2">
                  <DetailRow 
                    label="Apex Bee Fee" 
                    value={`${apexBeeFeePercent}% (₹${apexBeeFeeAmount.toFixed(2)})`}
                    valueClassName="text-red-600 font-semibold"
                  />
                  <DetailRow 
                    label="Vendor Final Amount (per unit)" 
                    value={`₹${product.finalAmount.toFixed(2)}`}
                    valueClassName="text-green-600 font-bold text-lg"
                  />
                </div>

                <DetailRow label="GST Rate" value={`${product.gstRate}%`} />
                <DetailRow label="SKU Code" value={product.skuCode} />
                <DetailRow label="Measuring Unit" value={product.measuringUnit} />
                <DetailRow label="HSN Code" value={product.hsnCode} />
                <DetailRow label="Godown" value={product.godown} />
                <DetailRow 
                  label="Open Stock" 
                  value={`${product.openStock} units`}
                  badge={product.openStock > 0 ? "default" : "destructive"}
                />
                <DetailRow label="As On Date" value={product.asOnDate} />
                <DetailRow label="Price Type" value={product.priceType} />

                {/* Add-ons (customer side) */}
                <div className="border-t pt-2 mt-2">
                  <div className="font-semibold mb-1">Checkout Add‑ons (Customer)</div>
                  <DetailRow label="Shipping Charges" value={`₹${(product.shippingCharges ?? 0).toFixed(2)}`} />
                  <DetailRow label="Packing Charges" value={`₹${(product.packingCharges ?? 0).toFixed(2)}`} />
                  <p className="text-xs text-muted-foreground mt-1">
                    These are added to customer's bill and do not affect vendor payout.
                  </p>
                </div>

                {/* Referral Commissions */}
                <div className="border-t pt-2 mt-2">
                  <div className="font-semibold mb-2">Referral Commissions (paid from Apex Bee Fee)</div>
                  {hasReferrals ? (
                    <>
                      {Object.entries(product.referralCommissions!).map(([key, value]) => {
                        if (!value || value.amount === 0) return null;
                        const label = labelMap[key] || key;
                        return (
                          <DetailRow 
                            key={key} 
                            label={label} 
                            value={`${value.percentage}% (₹${value.amount.toFixed(2)})`}
                          />
                        );
                      })}
                      <DetailRow 
                        label="Total Referrals" 
                        value={`₹${totalReferrals.toFixed(2)}`}
                        labelClassName="font-semibold"
                        valueClassName="font-semibold"
                      />
                      <DetailRow 
                        label="Net Apex Bee Commission (after referrals)" 
                        value={`₹${netApexBeeCommission.toFixed(2)}`}
                        labelClassName="font-bold"
                        valueClassName="font-bold text-blue-600"
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No referral commissions set for this product.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Helper component for consistent row rendering
const DetailRow = ({ 
  label, 
  value, 
  badge, 
  labelClassName = "", 
  valueClassName = "" 
}: { 
  label: string; 
  value: string; 
  badge?: "default" | "destructive";
  labelClassName?: string;
  valueClassName?: string;
}) => (
  <div className="flex justify-between py-1">
    <span className={`text-muted-foreground ${labelClassName}`}>{label}:</span>
    {badge ? (
      <Badge variant={badge}>{value}</Badge>
    ) : (
      <span className={`font-medium ${valueClassName}`}>{value}</span>
    )}
  </div>
);

export default ProductDetails;