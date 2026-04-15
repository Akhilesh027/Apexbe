import { useEffect, useMemo, useState } from "react";
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

/** ---------------------------
 * Types
 * -------------------------- */
interface Product {
  _id: string;
  itemName: string;
  category: { name: string } | null;
  subcategory: string;
  salesPrice: number;
  afterDiscount: number;
  commission: number; // Apex Bee Fee (%)
  finalAmount: number; // Vendor gets this (afterDiscount - fee)
  skuCode: string;
  priceType: string;
  openStock: number;
  vendorId: { name: string } | null;
  images: string[];
  status: "Pending" | "Approved" | "Rejected" | string;
  createdAt: string;
  deliveryFee?: number; // legacy, now replaced by shipping+packing
  shippingCharges?: number;
  packingCharges?: number;
  referralCommissions?: Partial<
    Record<string, { percentage?: number; amount?: number }>
  >;
  [key: string]: any;
}

type ActionType = "approve" | "reject";

// 8 referral tiers exactly as per the image
type ReferralTierKey =
  | "stateFranchiser"
  | "districtFranchiser"
  | "mondalFranchiser"
  | "wishLink"
  | "firstPurchase"
  | "level1"
  | "level2"
  | "level3";

const REFERRAL_TIERS: { key: ReferralTierKey; label: string; defaultPercent?: number }[] = [
  { key: "stateFranchiser", label: "State Franchiser", defaultPercent: 2.5 },
  { key: "districtFranchiser", label: "District Franchiser", defaultPercent: 5 },
  { key: "mondalFranchiser", label: "Mondal Franchiser", defaultPercent: 5 },
  { key: "wishLink", label: "Wish Link Incentive", defaultPercent: 5 },
  { key: "firstPurchase", label: "1st Purchase Incentive", defaultPercent: 25 },
  { key: "level1", label: "Level 1", defaultPercent: 10 },
  { key: "level2", label: "Level 2", defaultPercent: 5 },
  { key: "level3", label: "Level 3", defaultPercent: 2.5 },
];

type TierValue = { percentage: number | ""; amount: number | "" };
type ReferralState = Record<ReferralTierKey, TierValue>;

const emptyReferralState = (): ReferralState => ({
  stateFranchiser: { percentage: "", amount: "" },
  districtFranchiser: { percentage: "", amount: "" },
  mondalFranchiser: { percentage: "", amount: "" },
  wishLink: { percentage: "", amount: "" },
  firstPurchase: { percentage: "", amount: "" },
  level1: { percentage: "", amount: "" },
  level2: { percentage: "", amount: "" },
  level3: { percentage: "", amount: "" },
});

/** ---------------------------
 * Helpers
 * -------------------------- */
const round2 = (n: number) => Number((Number.isFinite(n) ? n : 0).toFixed(2));
const money = (n: number) => `₹${round2(n).toFixed(2)}`;
const pctFromAmt = (amt: number, base: number) => (base > 0 ? (amt / base) * 100 : 0);
const amtFromPct = (pct: number, base: number) => (base * pct) / 100;

/**
 * Correct financial model:
 * - Vendor gets: afterDiscount - Apex Bee Fee
 * - Apex Bee Fee pool is used to pay all referral commissions
 * - Shipping & Packing charges are add-ons for the customer, NOT deducted from vendor
 */
const getFinancials = (
  product: Product,
  apexBeePercent: number | string,
  shipping: number | string,
  packing: number | string
) => {
  const base = Number(product.afterDiscount || 0);
  const feePercent = Number(apexBeePercent) || 0;
  const apexBeeFee = round2((base * feePercent) / 100);
  const vendorAmount = round2(base - apexBeeFee);
  const shippingCost = round2(Number(shipping) || 0);
  const packingCost = round2(Number(packing) || 0);
  return { base, feePercent, apexBeeFee, vendorAmount, shippingCost, packingCost };
};

const extractProductsArray = (payload: any): Product[] => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.products ?? payload?.data ?? [];
  return Array.isArray(list) ? list : [];
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: ActionType | null;
  }>({ open: false, action: null });

  // Apex Bee Fee (%)
  const [apexBeePercent, setApexBeePercent] = useState<number | string>("");
  const [apexBeeAmount, setApexBeeAmount] = useState<number | string>("");

  // Add-ons (for customer, not deducted from vendor)
  const [shippingCharges, setShippingCharges] = useState<number | string>("");
  const [packingCharges, setPackingCharges] = useState<number | string>("");

  // Referral commissions
  const [referral, setReferral] = useState<ReferralState>(emptyReferralState());

  /** ---------------------------
   * Fetch products
   * -------------------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://api.apexbee.in/api/products");
        const list = extractProductsArray(res.data);
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  /** ---------------------------
   * Reset / Prefill when selecting a product
   * -------------------------- */
  useEffect(() => {
    if (!selectedProduct) {
      setApexBeePercent("");
      setApexBeeAmount("");
      setShippingCharges("");
      setPackingCharges("");
      setReferral(emptyReferralState());
      return;
    }

    const base = selectedProduct.afterDiscount || 0;
    const comm = selectedProduct.commission || 0;
    setApexBeePercent(comm);
    setApexBeeAmount(round2(amtFromPct(comm, base)).toFixed(2));

    // Load existing add-ons
    setShippingCharges(selectedProduct.shippingCharges ?? 0);
    setPackingCharges(selectedProduct.packingCharges ?? 0);

    // Load existing referral commissions
    const next = emptyReferralState();
    const { apexBeeFee } = getFinancials(selectedProduct, comm, selectedProduct.shippingCharges ?? 0, selectedProduct.packingCharges ?? 0);
    const stored = selectedProduct.referralCommissions || {};

    for (const { key } of REFERRAL_TIERS) {
      const p = stored?.[key]?.percentage;
      const a = stored?.[key]?.amount;

      if (typeof p === "number" && !Number.isNaN(p)) {
        next[key].percentage = round2(p);
        next[key].amount = round2(amtFromPct(p, apexBeeFee));
      } else if (typeof a === "number" && !Number.isNaN(a)) {
        next[key].amount = round2(a);
        next[key].percentage = round2(pctFromAmt(a, apexBeeFee));
      } else {
        // Optionally pre-fill with default percentages from the image
        const defaultPct = REFERRAL_TIERS.find(t => t.key === key)?.defaultPercent;
        if (defaultPct) {
          next[key].percentage = defaultPct;
          next[key].amount = round2(amtFromPct(defaultPct, apexBeeFee));
        } else {
          next[key].percentage = "";
          next[key].amount = "";
        }
      }
    }
    setReferral(next);
  }, [selectedProduct]);

  /** ---------------------------
   * Status badge
   * -------------------------- */
  const getStatusBadge = (status: string) => {
    const lowerStatus = (status || "Pending").toLowerCase();
    return (
      <Badge
        variant={
          lowerStatus === "approved"
            ? "default"
            : lowerStatus === "pending"
            ? "secondary"
            : "destructive"
        }
        className={
          lowerStatus === "approved"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : lowerStatus === "pending"
            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }
      >
        {status || "Pending"}
      </Badge>
    );
  };

  /** ---------------------------
   * Apex Bee Fee Handlers (mutually exclusive % ↔ amount)
   * -------------------------- */
  const handleApexBeePercentChange = (value: string) => {
    const percent = value === "" ? "" : Number(value);
    setApexBeePercent(percent);

    if (selectedProduct && percent !== "" && !isNaN(Number(percent))) {
      const base = selectedProduct.afterDiscount || 0;
      const newAmount = round2(amtFromPct(Number(percent), base));
      setApexBeeAmount(newAmount.toFixed(2));

      // Recalculate all referral amounts based on new apexBeeFee
      const { apexBeeFee } = getFinancials(selectedProduct, percent, shippingCharges, packingCharges);
      setReferral(prev => {
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, apexBeeFee));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, apexBeeFee));
          }
        }
        return next;
      });
    } else if (value === "") {
      setApexBeeAmount("");
    }
  };

  const handleApexBeeAmountChange = (value: string) => {
    const amount = value === "" ? "" : Number(value);
    setApexBeeAmount(amount);

    if (selectedProduct && amount !== "" && !isNaN(Number(amount))) {
      const base = selectedProduct.afterDiscount || 0;
      const newPercent = pctFromAmt(Number(amount), base);
      setApexBeePercent(round2(newPercent).toFixed(2));

      const { apexBeeFee } = getFinancials(selectedProduct, round2(newPercent), shippingCharges, packingCharges);
      setReferral(prev => {
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, apexBeeFee));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, apexBeeFee));
          }
        }
        return next;
      });
    } else if (value === "") {
      setApexBeePercent("");
    }
  };

  /** Add‑on handlers (shipping & packing) – they only affect referral pool if needed,
   * but per image they are just add-ons, not deducted from vendor.
   * We still need to recalc referral amounts because referral pool is apexBeeFee only,
   * which is independent of shipping/packing. So no change needed – but we keep them for completeness. */
  const handleShippingChange = (value: string) => {
    const val = value === "" ? "" : Number(value);
    setShippingCharges(val);
    // Shipping/packing do NOT affect apexBeeFee, so no referral recalculation needed.
    // But if you want to store them, that's it.
  };

  const handlePackingChange = (value: string) => {
    const val = value === "" ? "" : Number(value);
    setPackingCharges(val);
  };

  /** ---------------------------
   * Referral Handlers (based on apexBeeFee)
   * -------------------------- */
  const handleReferralPercentageChange = (tier: ReferralTierKey, value: string) => {
    setReferral((prev) => {
      if (!selectedProduct) return prev;
      const { apexBeeFee } = getFinancials(selectedProduct, apexBeePercent, shippingCharges, packingCharges);
      const percentage = value === "" ? "" : Number(value);
      const next = { ...prev, [tier]: { ...prev[tier], percentage } };
      if (percentage === "") {
        next[tier].amount = "";
        return next;
      }
      if (!isNaN(Number(percentage))) {
        next[tier].amount = round2(amtFromPct(Number(percentage), apexBeeFee));
      }
      return next;
    });
  };

  const handleReferralAmountChange = (tier: ReferralTierKey, value: string) => {
    setReferral((prev) => {
      if (!selectedProduct) return prev;
      const { apexBeeFee } = getFinancials(selectedProduct, apexBeePercent, shippingCharges, packingCharges);
      const amount = value === "" ? "" : Number(value);
      const next = { ...prev, [tier]: { ...prev[tier], amount } };
      if (amount === "") {
        next[tier].percentage = "";
        return next;
      }
      if (!isNaN(Number(amount))) {
        next[tier].percentage = round2(pctFromAmt(Number(amount), apexBeeFee));
      }
      return next;
    });
  };

  /** ---------------------------
   * Totals: total referral sum and net Apex Bee Commission
   * -------------------------- */
  const totals = useMemo(() => {
    if (!selectedProduct) return { apexBeeFee: 0, totalReferral: 0, netApexBeeCommission: 0 };
    const { apexBeeFee } = getFinancials(selectedProduct, apexBeePercent, shippingCharges, packingCharges);
    const totalReferral = round2(
      REFERRAL_TIERS.reduce((sum, t) => sum + (Number(referral[t.key].amount) || 0), 0)
    );
    const netApexBeeCommission = round2(apexBeeFee - totalReferral);
    return { apexBeeFee, totalReferral, netApexBeeCommission };
  }, [selectedProduct, apexBeePercent, shippingCharges, packingCharges, referral]);

  /** Comprehensive summary for display */
  const summary = useMemo(() => {
    if (!selectedProduct) return null;
    const { base, feePercent, apexBeeFee, vendorAmount, shippingCost, packingCost } =
      getFinancials(selectedProduct, apexBeePercent, shippingCharges, packingCharges);
    const totalReferral = totals.totalReferral;
    const netApexBeeCommission = totals.netApexBeeCommission;
    return {
      base,
      feePercent,
      apexBeeFee,
      vendorAmount,
      shippingCost,
      packingCost,
      totalReferral,
      netApexBeeCommission,
    };
  }, [selectedProduct, apexBeePercent, shippingCharges, packingCharges, totals]);

  /** ---------------------------
   * Approve / Reject
   * -------------------------- */
  const handleAction = (product: Product, action: ActionType) => {
    setSelectedProduct(product);
    setActionDialog({ open: true, action });
  };

  const confirmAction = async () => {
    if (!selectedProduct || !actionDialog.action) return;

    const action = actionDialog.action;
    const apexBeePercentValue = action === "approve" ? Number(apexBeePercent) : 0;
    const shippingValue = action === "approve" ? Number(shippingCharges) || 0 : 0;
    const packingValue = action === "approve" ? Number(packingCharges) || 0 : 0;

    if (action === "approve" && (isNaN(apexBeePercentValue) || apexBeePercentValue < 0)) {
      toast.error("Please enter a valid non‑negative Apex Bee Fee percentage.");
      return;
    }

    const { apexBeeFee } = getFinancials(selectedProduct, apexBeePercentValue, shippingValue, packingValue);

    // Build referral payload (always percentages and amounts)
    const referralPayload = REFERRAL_TIERS.reduce((acc, t) => {
      const p = referral[t.key].percentage;
      const a = referral[t.key].amount;
      let percentage = 0;
      let amount = 0;
      if (p !== "" && Number.isFinite(Number(p))) {
        percentage = round2(Number(p));
        amount = round2(amtFromPct(percentage, apexBeeFee));
      } else if (a !== "" && Number.isFinite(Number(a))) {
        amount = round2(Number(a));
        percentage = round2(pctFromAmt(amount, apexBeeFee));
      }
      acc[t.key] = { percentage, amount };
      return acc;
    }, {} as Record<ReferralTierKey, { percentage: number; amount: number }>);

    const totalReferral = Object.values(referralPayload).reduce((s, x) => s + (x.amount || 0), 0);

    if (action === "approve" && totalReferral > apexBeeFee) {
      toast.error("Total referrals cannot exceed the Apex Bee Fee pool.");
      return;
    }

    try {
      const endpoint = `https://api.apexbee.in/api/products/${selectedProduct._id}/${action}`;
      await axios.post(endpoint, {
        commission: action === "approve" ? apexBeePercentValue : 0,
        shippingCharges: action === "approve" ? shippingValue : 0,
        packingCharges: action === "approve" ? packingValue : 0,
        referralBase: action === "approve" ? apexBeeFee : 0,
        referralCommissions: action === "approve" ? referralPayload : {},
      });

      const newStatus = action === "approve" ? "Approved" : "Rejected";

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? {
                ...p,
                status: newStatus,
                commission: action === "approve" ? apexBeePercentValue : 0,
                shippingCharges: action === "approve" ? shippingValue : 0,
                packingCharges: action === "approve" ? packingValue : 0,
                referralCommissions: action === "approve" ? referralPayload : {},
              }
            : p
        )
      );

      toast.success(
        action === "approve"
          ? `Product approved. Apex Bee Fee: ${apexBeePercentValue}% (${money(apexBeeFee)}), Net Apex Bee Commission: ${money(totals.netApexBeeCommission)}`
          : "Product rejected."
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    } finally {
      setActionDialog({ open: false, action: null });
      setSelectedProduct(null);
      setApexBeePercent("");
      setApexBeeAmount("");
      setShippingCharges("");
      setPackingCharges("");
      setReferral(emptyReferralState());
    }
  };

  /** Helper to calculate total referral for a product (display in table) */
  const getTotalReferral = (product: Product): number => {
    if (!product.referralCommissions) return 0;
    return round2(
      Object.values(product.referralCommissions).reduce(
        (sum, tier) => sum + (tier?.amount || 0),
        0
      )
    );
  };

  /** ---------------------------
   * Columns
   * -------------------------- */
  const columns = [
    { header: "Product Name", accessor: (item: Product) => item.itemName },
    { header: "Category", accessor: (item: Product) => item.category?.name || "N/A" },
    { header: "Base Price", accessor: (item: Product) => `₹${(item.afterDiscount || 0).toFixed(2)}` },
    { header: "Apex Bee Fee (%)", accessor: (item: Product) => `${item.commission || 0}%` },
    {
      header: "Total Referral",
      accessor: (item: Product) =>
        item.status?.toLowerCase() === "approved" && item.referralCommissions
          ? money(getTotalReferral(item))
          : "—",
    },
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
              <Button
                size="sm"
                variant="outline"
                className="text-success hover:bg-success/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(item);
                  setActionDialog({ open: true, action: "approve" });
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

  /** ---------------------------
   * UI
   * -------------------------- */
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Product Submissions 📦</h1>
        <p className="text-muted-foreground">
          Review and approve vendor products. <strong>Apex Bee Fee</strong> is deducted from the vendor's base price.
          All referral commissions are paid from this fee. The remaining amount is <strong>Net Apex Bee Commission</strong>.
          Shipping & packing charges are customer add‑ons and do not affect vendor payout.
        </p>
      </div>

      <DataTable data={products} columns={columns} searchKey="itemName" />

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct && !actionDialog.open} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-5xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.itemName} Details</DialogTitle>
            <DialogDescription>Review product information and set Apex Bee Fee & referral commissions.</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto pr-2">
              {/* Left: Product info */}
              <div className="space-y-4 lg:border-r lg:pr-6">
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md min-h-[90px]">
                    {selectedProduct.description || "No description provided."}
                  </p>
                </div>

                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProduct.images?.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`product-${idx}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>

              {/* Right: Pricing & Commissions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-xl border-b pb-2 text-primary">Pricing & Approval</h3>

                {/* Summary Card */}
                {summary && (
                  <div className="p-4 rounded-xl border bg-muted/40 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Product Base Price (After Disc.)</span>
                      <span className="font-bold text-lg">{money(summary.base)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Apex Bee Fee ({summary.feePercent}%)</span>
                      <span className="font-semibold text-red-600">{money(summary.apexBeeFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vendor Final Amount</span>
                      <span className="font-semibold text-green-600">{money(summary.vendorAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping Charges (Add‑on)</span>
                      <span className="font-semibold">{money(summary.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Packing Charges (Add‑on)</span>
                      <span className="font-semibold">{money(summary.packingCost)}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Referrals (from Apex Bee Fee)</span>
                      <span className="font-semibold">{money(summary.totalReferral)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Net Apex Bee Commission</span>
                      <span className="text-blue-600 text-lg">{money(summary.netApexBeeCommission)}</span>
                    </div>
                    {summary.totalReferral > summary.apexBeeFee && (
                      <p className="text-xs text-destructive">
                        ⚠️ Referral total exceeds Apex Bee Fee pool. Reduce referrals.
                      </p>
                    )}
                  </div>
                )}

                {/* Editable inputs only for pending */}
                {selectedProduct.status?.toLowerCase() === "pending" ? (
                  <>
                    {/* Apex Bee Fee Card */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-primary">Apex Bee Fee</h4>
                        <span className="text-xs text-muted-foreground">
                          % of Base Price (deducted from vendor)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="apex-amount" className="font-medium text-sm">
                            Amount (₹)
                          </Label>
                          <Input
                            id="apex-amount"
                            type="number"
                            placeholder="0.00"
                            value={apexBeeAmount}
                            onChange={(e) => handleApexBeeAmountChange(e.target.value)}
                            className="h-9 text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="apex-percent" className="font-medium text-sm">
                            Percentage (%)
                          </Label>
                          <Input
                            id="apex-percent"
                            type="number"
                            placeholder="0.00"
                            value={apexBeePercent}
                            onChange={(e) => handleApexBeePercentChange(e.target.value)}
                            className="h-9 text-sm"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add‑ons Card */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
                      <h4 className="font-extrabold text-primary">Checkout Add‑ons (Customer)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="shipping" className="text-sm">Shipping Charges (₹)</Label>
                          <Input
                            id="shipping"
                            type="number"
                            min="0"
                            step="0.01"
                            value={shippingCharges}
                            onChange={(e) => handleShippingChange(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="packing" className="text-sm">Packing Charges (₹)</Label>
                          <Input
                            id="packing"
                            type="number"
                            min="0"
                            step="0.01"
                            value={packingCharges}
                            onChange={(e) => handlePackingChange(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These are added to the customer's final bill and do not affect vendor payout.
                      </p>
                    </div>

                    {/* Referral Commissions Card */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-extrabold text-primary">Referral Commissions</h4>
                        <span className="text-xs text-muted-foreground">
                          Paid from Apex Bee Fee pool
                        </span>
                      </div>

                      <div className="space-y-3">
                        {REFERRAL_TIERS.map((t) => (
                          <div key={t.key} className="rounded-xl border bg-muted/20 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{t.label}</span>
                              <span className="text-xs text-muted-foreground">
                                = {money(Number(referral[t.key].amount) || 0)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Amount (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={referral[t.key].amount}
                                  onChange={(e) => handleReferralAmountChange(t.key, e.target.value)}
                                  className="h-9 text-sm"
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs">Percentage (%) of Apex Bee Fee</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={referral[t.key].percentage}
                                  onChange={(e) => handleReferralPercentageChange(t.key, e.target.value)}
                                  className="h-9 text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Referrals</span>
                          <span className="font-bold">{money(totals.totalReferral)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Net Apex Bee Commission</span>
                          <span className="font-extrabold text-lg text-blue-600">
                            {money(totals.netApexBeeCommission)}
                          </span>
                        </div>
                        {totals.totalReferral > totals.apexBeeFee && (
                          <p className="text-xs text-destructive">
                            Total referrals exceed the Apex Bee Fee pool. Reduce some referral values.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(selectedProduct, "reject")}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>

                      <Button
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        onClick={() => setActionDialog({ open: true, action: "approve" })}
                        disabled={
                          isNaN(Number(apexBeePercent)) ||
                          Number(apexBeePercent) < 0 ||
                          totals.totalReferral > totals.apexBeeFee
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground border rounded-xl bg-muted/30">
                    This product has been <strong>{selectedProduct.status}</strong>. Commissions are locked.
                  </div>
                )}
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
              {actionDialog.action === "approve" ? "Confirm Approval & Commissions" : "Confirm Rejection"}
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to <strong>{actionDialog.action}</strong> this product?
              {actionDialog.action === "approve" && summary && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm">
                    Base Price (After Disc.): <span className="font-semibold">{money(summary.base)}</span>
                  </p>
                  <p className="text-sm">
                    Apex Bee Fee ({summary.feePercent}%): <span className="font-semibold">{money(summary.apexBeeFee)}</span>
                  </p>
                  <p className="text-sm">
                    Vendor Gets: <span className="font-semibold text-green-600">{money(summary.vendorAmount)}</span>
                  </p>
                  <p className="text-sm">
                    Total Referrals: <span className="font-semibold">{money(summary.totalReferral)}</span>
                  </p>
                  <p className="text-sm">
                    Net Apex Bee Commission: <span className="font-bold text-blue-600">{money(summary.netApexBeeCommission)}</span>
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant={actionDialog.action === "reject" ? "destructive" : "default"}
              disabled={actionDialog.action === "approve" && totals.totalReferral > totals.apexBeeFee}
            >
              {actionDialog.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;