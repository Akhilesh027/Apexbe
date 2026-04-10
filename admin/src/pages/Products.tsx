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
  commission: number; // Apexbe commission (%)
  finalAmount: number;
  skuCode: string;
  priceType: string;
  openStock: number;
  vendorId: { name: string } | null;
  images: string[];
  status: "Pending" | "Approved" | "Rejected" | string;
  createdAt: string;
  deliveryFee?: number; // Delivery fee (add-on)

  referralCommissions?: Partial<
    Record<string, { percentage?: number; amount?: number }>
  >;

  [key: string]: any;
}

type ActionType = "approve" | "reject";

// Updated referral tiers with District and Mondal Franchiser
type ReferralTierKey =
  | "stateFranchiser"
  | "districtFranchiser"
  | "mondalFranchiser"
  | "franchiser"
  | "wish";

const REFERRAL_TIERS: { key: ReferralTierKey; label: string }[] = [
  { key: "stateFranchiser", label: "State Franchiser" },
  { key: "districtFranchiser", label: "District Franchiser" },
  { key: "mondalFranchiser", label: "Mondal Franchiser" },
  { key: "franchiser", label: "Franchiser" },
  { key: "wish", label: "Wish" },
];

type TierValue = { percentage: number | ""; amount: number | "" };
type ReferralState = Record<ReferralTierKey, TierValue>;

const emptyReferralState = (): ReferralState => ({
  stateFranchiser: { percentage: "", amount: "" },
  districtFranchiser: { percentage: "", amount: "" },
  mondalFranchiser: { percentage: "", amount: "" },
  franchiser: { percentage: "", amount: "" },
  wish: { percentage: "", amount: "" },
});

/** ---------------------------
 * Helpers
 * -------------------------- */
const round2 = (n: number) => Number((Number.isFinite(n) ? n : 0).toFixed(2));
const money = (n: number) => `₹${round2(n).toFixed(2)}`;
const pctFromAmt = (amt: number, base: number) => (base > 0 ? (amt / base) * 100 : 0);
const amtFromPct = (pct: number, base: number) => (base * pct) / 100;

/**
 * Computes Apexbe amount, delivery fee deduction, and net amount for referrals.
 */
const getNetAfterVendor = (
  product: Product,
  apexbePercent: number | string,
  deliveryFee: number | string
) => {
  const base = Number(product.afterDiscount || 0);
  const vp = Number(apexbePercent) || 0;
  const apexbeAmount = round2((base * vp) / 100);
  const delivery = round2(Number(deliveryFee) || 0);
  const afterApexbe = round2(base - apexbeAmount);
  const netAfterVendor = round2(afterApexbe - delivery);
  return { base, vp, apexbeAmount, afterApexbe, delivery, netAfterVendor };
};

// universal extractor
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

  /** Apexbe commission inputs */
  const [commissionPercentage, setCommissionPercentage] = useState<number | string>("");
  const [commissionAmount, setCommissionAmount] = useState<number | string>("");

  /** Delivery fee */
  const [deliveryFee, setDeliveryFee] = useState<number | string>("");

  /** Referral commissions */
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
      setCommissionPercentage("");
      setCommissionAmount("");
      setDeliveryFee("");
      setReferral(emptyReferralState());
      return;
    }

    const base = selectedProduct.afterDiscount || 0;
    const comm = selectedProduct.commission || 0;
    setCommissionPercentage(comm);
    setCommissionAmount(round2(amtFromPct(comm, base)).toFixed(2));

    const existingDelivery = selectedProduct.deliveryFee ?? 0;
    setDeliveryFee(existingDelivery);

    const next = emptyReferralState();
    const { netAfterVendor } = getNetAfterVendor(selectedProduct, comm, existingDelivery);

    const stored = selectedProduct.referralCommissions || {};
    for (const { key } of REFERRAL_TIERS) {
      const p = stored?.[key]?.percentage;
      const a = stored?.[key]?.amount;

      if (typeof p === "number" && !Number.isNaN(p)) {
        next[key].percentage = round2(p);
        next[key].amount = round2(amtFromPct(p, netAfterVendor));
      } else if (typeof a === "number" && !Number.isNaN(a)) {
        next[key].amount = round2(a);
        next[key].percentage = round2(pctFromAmt(a, netAfterVendor));
      } else {
        next[key].percentage = "";
        next[key].amount = "";
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
   * Apexbe Commission Handlers
   * -------------------------- */
  const handleCommissionPercentageChange = (value: string) => {
    const percentage = value === "" ? "" : Number(value);
    setCommissionPercentage(percentage);

    if (selectedProduct && percentage !== "" && !isNaN(Number(percentage))) {
      const base = selectedProduct.afterDiscount || 0;
      setCommissionAmount(round2(amtFromPct(Number(percentage), base)).toFixed(2));

      setReferral((prev) => {
        const { netAfterVendor } = getNetAfterVendor(selectedProduct, percentage, deliveryFee);
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, netAfterVendor));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, netAfterVendor));
          }
        }
        return next;
      });
    } else if (value === "") {
      setCommissionAmount("");
    }
  };

  const handleCommissionAmountChange = (value: string) => {
    const amount = value === "" ? "" : Number(value);
    setCommissionAmount(amount);

    if (selectedProduct && amount !== "" && !isNaN(Number(amount))) {
      const base = selectedProduct.afterDiscount || 0;
      const pct = pctFromAmt(Number(amount), base);
      setCommissionPercentage(round2(pct).toFixed(2));

      setReferral((prev) => {
        const { netAfterVendor } = getNetAfterVendor(selectedProduct, round2(pct), deliveryFee);
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, netAfterVendor));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, netAfterVendor));
          }
        }
        return next;
      });
    } else if (value === "") {
      setCommissionPercentage("");
    }
  };

  /** Delivery fee handler */
  const handleDeliveryFeeChange = (value: string) => {
    const fee = value === "" ? "" : Number(value);
    setDeliveryFee(fee);

    if (selectedProduct && fee !== "" && !isNaN(Number(fee))) {
      setReferral((prev) => {
        const { netAfterVendor } = getNetAfterVendor(selectedProduct, commissionPercentage, fee);
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, netAfterVendor));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, netAfterVendor));
          }
        }
        return next;
      });
    } else if (value === "") {
      setReferral((prev) => {
        const { netAfterVendor } = getNetAfterVendor(selectedProduct, commissionPercentage, 0);
        const next = { ...prev } as ReferralState;
        for (const { key } of REFERRAL_TIERS) {
          const p = Number(next[key].percentage);
          const a = Number(next[key].amount);
          if (next[key].percentage !== "" && Number.isFinite(p)) {
            next[key].amount = round2(amtFromPct(p, netAfterVendor));
          } else if (next[key].amount !== "" && Number.isFinite(a)) {
            next[key].percentage = round2(pctFromAmt(a, netAfterVendor));
          }
        }
        return next;
      });
    }
  };

  /** ---------------------------
   * Referral Handlers
   * -------------------------- */
  const handleReferralPercentageChange = (tier: ReferralTierKey, value: string) => {
    setReferral((prev) => {
      if (!selectedProduct) return prev;
      const { netAfterVendor } = getNetAfterVendor(selectedProduct, commissionPercentage, deliveryFee);
      const percentage = value === "" ? "" : Number(value);
      const next = { ...prev, [tier]: { ...prev[tier], percentage } };
      if (percentage === "") {
        next[tier].amount = "";
        return next;
      }
      if (!isNaN(Number(percentage))) {
        next[tier].amount = round2(amtFromPct(Number(percentage), netAfterVendor));
      }
      return next;
    });
  };

  const handleReferralAmountChange = (tier: ReferralTierKey, value: string) => {
    setReferral((prev) => {
      if (!selectedProduct) return prev;
      const { netAfterVendor } = getNetAfterVendor(selectedProduct, commissionPercentage, deliveryFee);
      const amount = value === "" ? "" : Number(value);
      const next = { ...prev, [tier]: { ...prev[tier], amount } };
      if (amount === "") {
        next[tier].percentage = "";
        return next;
      }
      if (!isNaN(Number(amount))) {
        next[tier].percentage = round2(pctFromAmt(Number(amount), netAfterVendor));
      }
      return next;
    });
  };

  /** ---------------------------
   * Totals for Referral + Remaining
   * -------------------------- */
  const referralTotals = useMemo(() => {
    if (!selectedProduct) return { netAfterVendor: 0, totalReferral: 0, remaining: 0 };

    const { netAfterVendor } = getNetAfterVendor(selectedProduct, commissionPercentage, deliveryFee);

    const totalReferral = round2(
      REFERRAL_TIERS.reduce((sum, t) => sum + (Number(referral[t.key].amount) || 0), 0)
    );

    const remaining = round2(netAfterVendor - totalReferral);

    return { netAfterVendor, totalReferral, remaining };
  }, [selectedProduct, commissionPercentage, deliveryFee, referral]);

  /** Comprehensive summary for display */
  const summary = useMemo(() => {
    if (!selectedProduct) return null;
    const base = selectedProduct.afterDiscount || 0;
    const commPercent = Number(commissionPercentage) || 0;
    const apexbeAmount = round2((base * commPercent) / 100);
    const delivery = round2(Number(deliveryFee) || 0);
    const afterApexbe = round2(base - apexbeAmount);
    const netAfterVendor = round2(afterApexbe - delivery);

    const totalReferral = REFERRAL_TIERS.reduce(
      (sum, t) => sum + (Number(referral[t.key].amount) || 0),
      0
    );
    const remaining = round2(netAfterVendor - totalReferral);

    return {
      base,
      commPercent,
      apexbeAmount,
      delivery,
      afterApexbe,
      netAfterVendor,
      totalReferral,
      remaining,
    };
  }, [selectedProduct, commissionPercentage, deliveryFee, referral]);

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
    const apexbeCommissionValue = action === "approve" ? Number(commissionPercentage) : 0;
    const deliveryFeeValue = action === "approve" ? Number(deliveryFee) || 0 : 0;

    if (action === "approve" && (isNaN(apexbeCommissionValue) || apexbeCommissionValue < 0)) {
      toast.error("Please enter a valid non-negative Apexbe commission value.");
      return;
    }

    const { netAfterVendor } = getNetAfterVendor(selectedProduct, apexbeCommissionValue, deliveryFeeValue);

    const referralPayload = REFERRAL_TIERS.reduce((acc, t) => {
      const p = referral[t.key].percentage;
      const a = referral[t.key].amount;
      let percentage = 0;
      let amount = 0;
      if (p !== "" && Number.isFinite(Number(p))) {
        percentage = round2(Number(p));
        amount = round2(amtFromPct(percentage, netAfterVendor));
      } else if (a !== "" && Number.isFinite(Number(a))) {
        amount = round2(Number(a));
        percentage = round2(pctFromAmt(amount, netAfterVendor));
      }
      acc[t.key] = { percentage, amount };
      return acc;
    }, {} as Record<ReferralTierKey, { percentage: number; amount: number }>);

    const totalReferral = Object.values(referralPayload).reduce((s, x) => s + (x.amount || 0), 0);

    if (action === "approve" && totalReferral > netAfterVendor) {
      toast.error("Referral total cannot exceed Amount After Apexbe & Delivery.");
      return;
    }

    try {
      const endpoint = `https://api.apexbee.in/api/products/${selectedProduct._id}/${action}`;
      await axios.post(endpoint, {
        commission: action === "approve" ? apexbeCommissionValue : 0,
        deliveryFee: action === "approve" ? deliveryFeeValue : 0,
        referralBase: action === "approve" ? netAfterVendor : 0,
        referralCommissions: action === "approve" ? referralPayload : {},
      });

      const newStatus = action === "approve" ? "Approved" : "Rejected";

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? {
                ...p,
                status: newStatus,
                commission: action === "approve" ? apexbeCommissionValue : 0,
                deliveryFee: action === "approve" ? deliveryFeeValue : 0,
                referralCommissions: action === "approve" ? referralPayload : {},
              }
            : p
        )
      );

      toast.success(
        action === "approve"
          ? `Product approved. Apexbe commission: ${apexbeCommissionValue}%, Delivery fee: ${money(deliveryFeeValue)}`
          : "Product rejected."
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    } finally {
      setActionDialog({ open: false, action: null });
      setSelectedProduct(null);
      setCommissionPercentage("");
      setCommissionAmount("");
      setDeliveryFee("");
      setReferral(emptyReferralState());
    }
  };

  /** ---------------------------
   * Helper to calculate total referral for a product (display in table)
   * -------------------------- */
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
    { header: "Apexbe Comm. (%)", accessor: (item: Product) => `${item.commission || 0}%` },
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
          Review and approve vendor products. Apexbe commission and delivery fee are deducted first, then referral
          commissions are calculated on the net amount.
        </p>
      </div>

      <DataTable data={products} columns={columns} searchKey="itemName" />

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct && !actionDialog.open} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-5xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.itemName} Details</DialogTitle>
            <DialogDescription>Review product information and set commissions.</DialogDescription>
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
                      <span className="text-muted-foreground">Product Base Price</span>
                      <span className="font-bold text-lg">{money(summary.base)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Apexbe Commission</span>
                      <span className="font-semibold">
                        {money(summary.apexbeAmount)} ({summary.commPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee (Add‑on)</span>
                      <span className="font-semibold">{money(summary.delivery)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Referrals</span>
                      <span className="font-semibold">{money(summary.totalReferral)}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Final Approval Amount</span>
                      <span className="text-green-600 text-lg">
                        {money(summary.remaining)}
                      </span>
                    </div>
                    {summary.remaining < 0 && (
                      <p className="text-xs text-destructive">
                        ⚠️ Referral total exceeds net amount.
                      </p>
                    )}
                  </div>
                )}

                {/* Editable inputs only for pending */}
                {selectedProduct.status?.toLowerCase() === "pending" ? (
                  <>
                    {/* Apexbe Commission Card */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-primary">Apexbe Commission</h4>
                        <span className="text-xs text-muted-foreground">
                          Applied on Base Price
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="commission-amount" className="font-medium text-sm">
                            Amount (₹)
                          </Label>
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

                        <div className="space-y-2">
                          <Label htmlFor="commission-percentage" className="font-medium text-sm">
                            Percentage (%)
                          </Label>
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

                      {summary && (
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Commission Value</span>
                            <span className="font-bold">
                              {money(summary.apexbeAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">After Commission</span>
                            <span className="font-semibold">{money(summary.afterApexbe)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Fee Card */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-primary">Delivery Fee</h4>
                        <span className="text-xs text-muted-foreground">
                          Deducted before referrals
                        </span>
                      </div>
                      <Input
                        type="number"
                        placeholder="Delivery fee (₹)"
                        value={deliveryFee}
                        onChange={(e) => handleDeliveryFeeChange(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      {summary && (
                        <div className="pt-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>After Commission</span>
                            <span>{money(summary.afterApexbe)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery Fee</span>
                            <span>{money(summary.delivery)}</span>
                          </div>
                          <div className="flex justify-between font-bold mt-2">
                            <span>Net for Referrals</span>
                            <span className="text-green-600">{money(summary.netAfterVendor)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Referral Commissions */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-extrabold text-primary">Referral Commissions</h4>
                        <span className="text-xs text-muted-foreground">
                          Base: Net Amount (After Apexbe & Delivery)
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
                                <Label className="text-xs">Percentage (%)</Label>
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
                          <span className="text-muted-foreground">Total Referral</span>
                          <span className="font-bold">
                            {money(referralTotals.totalReferral)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Remaining After Referrals</span>
                          <span className="font-extrabold text-lg">
                            {money(referralTotals.remaining)}
                          </span>
                        </div>

                        {referralTotals.remaining < 0 && (
                          <p className="text-xs text-destructive">
                            Total referral exceeds net amount. Reduce referral values.
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
                          isNaN(Number(commissionPercentage)) ||
                          Number(commissionPercentage) < 0 ||
                          referralTotals.remaining < 0
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
                    Product Base Price:{" "}
                    <span className="font-semibold">{money(summary.base)}</span>
                  </p>
                  <p className="text-sm">
                    Apexbe Commission:{" "}
                    <span className="font-semibold">
                      {summary.commPercent}% ({money(summary.apexbeAmount)})
                    </span>
                  </p>
                  <p className="text-sm">
                    Delivery Fee (Add‑on):{" "}
                    <span className="font-semibold">{money(summary.delivery)}</span>
                  </p>
                  <p className="text-sm">
                    Total Referrals:{" "}
                    <span className="font-semibold">{money(summary.totalReferral)}</span>
                  </p>
                  <p className="text-sm">
                    Final Approval Amount:{" "}
                    <span className="font-bold text-green-600">{money(summary.remaining)}</span>
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
              disabled={actionDialog.action === "approve" && summary && summary.remaining < 0}
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