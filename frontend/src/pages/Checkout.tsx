import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  QrCode,
  Copy,
  Check,
  Loader2,
  Upload,
  X,
  Eye,
  Ticket,
  MapPin,
  Store,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import upi from "../Web images/Web images/upi.jpg";

const API_BASE = "https://api.apexbee.in/api";

/** -----------------------------
 * Types
 * ---------------------------- */
type CartItem = any;

type Address = {
  _id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

type CouponRule = {
  code: string;
  title: string;
  description: string;
  type: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  minOrder?: number;
  firstOrderOnly?: boolean;
  allowedPayments?: Array<"upi" | "wallet">;
  expiresAt?: string;
};

type PickupSlot = { date: string; time: string };

type PickupLocation = {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  pincode?: string; // ✅ helpful for filtering
  slots?: PickupSlot[];
};

/** -----------------------------
 * Helpers
 * ---------------------------- */
const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const normPincode = (p: any) => onlyDigits(String(p || "")).slice(0, 6);

/**
 * ✅ unify "pickup/preorder" flags from product/cart
 * Supports your new schema:
 *  - item.fulfillment.pickupEnabled / mode
 *  - item.preOrder.enabled / availableFrom
 */
const readItemFlags = (item: any) => {
  const fulfillment = item?.fulfillment || {};
  const preOrder = item?.preOrder || {};

  const pickupEnabled =
    Boolean(fulfillment?.pickupEnabled) ||
    Boolean(item?.allowPickup) ||
    Boolean(item?.pickupAvailable);

  const mode = fulfillment?.mode || "delivery_only";
  const allowPickup =
    pickupEnabled && (mode === "both" || mode === "pickup_only" || mode === "delivery_only");

  const isPreOrder =
    Boolean(preOrder?.enabled) || Boolean(item?.isPreOrder) || Boolean(item?.preOrder);

  const availableOn = preOrder?.availableFrom || item?.availableOn || item?.preOrderDate || null;

  // ✅ shop pincode snapshot for match-only pickup rule
  const shopPincode =
    fulfillment?.pickupShopPincode || item?.pickupShopPincode || item?.shopPincode || null;

  const pincodeMatchOnly = fulfillment?.pickupRules?.pincodeMatchOnly ?? true;

  return { allowPickup, isPreOrder, availableOn, shopPincode, pincodeMatchOnly };
};

/** ✅ robust price picker */
const getItemPrice = (item: any) => {
  const p = item?.afterDiscount ?? item?.price ?? item?.finalPrice ?? 0;
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Cart data from Cart page
  const cartData: any = location.state || {};
  const initialItems = (cartData.cartItems || []) as CartItem[];

  // User addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
    isDefault: false,
  });
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  // Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLocationId, setPickupLocationId] = useState<string>("");
  const [pickupSlot, setPickupSlot] = useState<PickupSlot | null>(null);

  // Payment
  const [selectedPayment, setSelectedPayment] = useState<"upi" | "wallet">("upi");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // UPI
  const [showUPIDialog, setShowUPIDialog] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Proof
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Order details
  const [orderDetails, setOrderDetails] = useState({
    items: initialItems,
    subtotal: cartData.subtotal || 0,
    discount: cartData.discount || 0,
    shipping: cartData.shipping || 0,
    total: cartData.total || 0,
  });

  /** ✅ current user pincode (from selected address first, fallback to address form) */
  const userPincode = useMemo(() => {
    const p = selectedAddress?.pincode || addressForm.pincode || "";
    return normPincode(p);
  }, [selectedAddress?.pincode, addressForm.pincode]);

  /** ✅ compute if pickup is possible based on items + (optional) pincode match-only rule */
  const pickupPossible = useMemo(() => {
    if (!orderDetails.items?.length) return false;

    const flags = orderDetails.items.map((it: any) => readItemFlags(it));
    const allPickupEnabled = flags.every((f) => f.allowPickup);
    if (!allPickupEnabled) return false;

    const needsMatch = flags.some((f) => f.pincodeMatchOnly);
    if (!needsMatch) return true;

    if (!userPincode) return false;

    const allHaveShopPin = flags.every((f) => !f.pincodeMatchOnly || !!normPincode(f.shopPincode));
    if (!allHaveShopPin) return false;

    const allMatch = flags.every((f) => {
      if (!f.pincodeMatchOnly) return true;
      return normPincode(f.shopPincode) === userPincode;
    });

    return allMatch;
  }, [orderDetails.items, userPincode]);

  /** ✅ Pre-order compute max availableOn */
  const preOrderInfo = useMemo(() => {
    const preItems = orderDetails.items
      .map((it: any) => ({ ...it, ...readItemFlags(it) }))
      .filter((it: any) => it.isPreOrder && it.availableOn);

    if (preItems.length === 0) return { hasPreOrder: false, availableOnMax: null as string | null };

    const maxDate = preItems
      .map((it: any) => new Date(it.availableOn))
      .reduce((a: Date, b: Date) => (a > b ? a : b));

    return { hasPreOrder: true, availableOnMax: maxDate.toISOString() };
  }, [orderDetails.items]);

  // First order
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);
  const [checkingFirstOrder, setCheckingFirstOrder] = useState<boolean>(true);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRule | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const COUPONS: CouponRule[] = useMemo(
    () => [
      {
        code: "FIRST100",
        title: "₹100 off on First Order",
        description: "Valid only for first order. Min order ₹499.",
        type: "flat",
        value: 100,
        minOrder: 499,
        firstOrderOnly: true,
        allowedPayments: ["upi", "wallet"],
      },
      {
        code: "SAVE10",
        title: "10% off (up to ₹250)",
        description: "Min order ₹999. Max discount ₹250.",
        type: "percent",
        value: 10,
        maxDiscount: 250,
        minOrder: 999,
        allowedPayments: ["upi", "wallet"],
      },
    ],
    []
  );

  const upiConfig = useMemo(
    () => ({
      upiId: "9177176969-2@ybl",
      qrCodeUrl: upi,
      merchantName: "ApexBee Store",
      amount: orderDetails.total,
    }),
    [orderDetails.total]
  );

  const calcItemsSubtotal = (items: CartItem[]) =>
    items.reduce((acc: number, item: any) => {
      const price = getItemPrice(item);
      const quantity = Number(item.quantity || 1);
      return acc + price * quantity;
    }, 0);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const checkCouponValidity = (coupon: CouponRule, baseAmount: number, payment: "upi" | "wallet") => {
    const now = new Date();
    if (coupon.expiresAt) {
      const exp = new Date(coupon.expiresAt);
      if (now > exp) return { ok: false, msg: "Coupon expired" };
    }
    if (coupon.minOrder && baseAmount < coupon.minOrder)
      return { ok: false, msg: `Min order ₹${coupon.minOrder} required` };
    if (coupon.firstOrderOnly && !isFirstOrder)
      return { ok: false, msg: "This coupon is only for first order" };
    if (coupon.allowedPayments?.length && !coupon.allowedPayments.includes(payment))
      return { ok: false, msg: `Not valid for ${payment.toUpperCase()} payment` };
    return { ok: true, msg: "" };
  };

  const computeCouponDiscount = (coupon: CouponRule, baseAmount: number) => {
    if (baseAmount <= 0) return 0;
    if (coupon.type === "flat") return clamp(coupon.value, 0, baseAmount);
    const raw = (baseAmount * coupon.value) / 100;
    const limited = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    return clamp(limited, 0, baseAmount);
  };

  const applyCoupon = (codeRaw?: string) => {
    const code = (codeRaw ?? couponInput).trim().toUpperCase();
    if (!code) return toast({ title: "Enter coupon code", variant: "destructive" });

    const coupon = COUPONS.find((c) => c.code === code);
    if (!coupon)
      return toast({ title: "Invalid coupon", description: "Coupon not found", variant: "destructive" });

    const baseAmount = orderDetails.subtotal;
    const validity = checkCouponValidity(coupon, baseAmount, selectedPayment);
    if (!validity.ok)
      return toast({ title: "Cannot apply coupon", description: validity.msg, variant: "destructive" });

    const disc = computeCouponDiscount(coupon, baseAmount);
    setAppliedCoupon(coupon);
    setCouponDiscount(disc);
    toast({ title: "Coupon applied", description: `${coupon.code} applied. You saved ₹${disc.toFixed(2)}` });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    toast({ title: "Coupon removed" });
  };

  /** -----------------------------
   * Redirect if cart empty
   * ---------------------------- */
  useEffect(() => {
    if (!cartData.cartItems || cartData.cartItems.length === 0) {
      toast({ title: "Cart is empty", description: "Redirecting to cart...", variant: "destructive" });
      navigate("/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -----------------------------
   * Initial loads
   * ---------------------------- */
  useEffect(() => {
    loadAddresses();
    loadWalletBalance();
    checkFirstOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ pickup locations should depend on pincode + pickupPossible */
  useEffect(() => {
    if (fulfillmentType !== "pickup") return;
    if (!pickupPossible) return;
    loadPickupLocations(userPincode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillmentType, pickupPossible, userPincode]);

  /** ✅ If pickup isn’t possible, force delivery */
  useEffect(() => {
    if (!pickupPossible && fulfillmentType === "pickup") setFulfillmentType("delivery");
  }, [pickupPossible, fulfillmentType]);

  /**
   * ✅ SHIPPING RULE UPDATE:
   * If pickup OR any preorder exists => shipping = 0
   */
  useEffect(() => {
    const baseShipping = cartData.shipping ?? 50;

    setOrderDetails((prev) => ({
      ...prev,
      shipping: fulfillmentType === "pickup" || preOrderInfo.hasPreOrder ? 0 : baseShipping,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillmentType, preOrderInfo.hasPreOrder]);

  const loadPickupLocations = async (pincode?: string) => {
    try {
      const qs = pincode ? `?pincode=${encodeURIComponent(pincode)}` : "";
      const res = await fetch(`${API_BASE}/pickup-locations${qs}`);
      if (!res.ok) return;

      const data = await res.json();
      const locs: PickupLocation[] = data.locations || data.pickupLocations || [];
      setPickupLocations(locs);

      if (locs.length) {
        const initialId = pickupLocationId || locs[0]._id;
        setPickupLocationId(initialId);

        const loc = locs.find((l) => l._id === initialId) || locs[0];
        setPickupSlot(loc?.slots?.[0] || null);
      } else {
        setPickupLocationId("");
        setPickupSlot(null);
      }
    } catch (e) {
      console.error("pickup-locations:", e);
    }
  };

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(`${API_BASE}/user/address/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      setAddresses(data.addresses || []);
      const defaultAddr =
        data.addresses?.find((a: Address) => a.isDefault) || data.addresses?.[0] || null;
      setSelectedAddress(defaultAddr);
    } catch (err) {
      console.error("Load addresses error:", err);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(`${API_BASE}/user/wallet/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      setWalletBalance(data.walletBalance || 0);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    }
  };

  const checkFirstOrder = async () => {
    setCheckingFirstOrder(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) {
        setIsFirstOrder(false);
        return;
      }

      const res = await fetch(`${API_BASE}/orders/first-order/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFirstOrder(Boolean(data?.isFirstOrder));
        return;
      }

      const ls = localStorage.getItem("hasOrderedOnce");
      setIsFirstOrder(!ls);
    } catch {
      const ls = localStorage.getItem("hasOrderedOnce");
      setIsFirstOrder(!ls);
    } finally {
      setCheckingFirstOrder(false);
    }
  };

  /** -----------------------------
   * Address add/edit
   * ---------------------------- */
  const isAddressFormValid = () =>
    addressForm.name.trim() &&
    onlyDigits(addressForm.phone).length === 10 &&
    normPincode(addressForm.pincode).length === 6 &&
    addressForm.address.trim() &&
    addressForm.city.trim() &&
    addressForm.state.trim();

  const handleAddOrEditAddress = async () => {
    if (!isAddressFormValid()) return;

    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) {
        toast({ title: "Login required", description: "Please login", variant: "destructive" });
        navigate("/login");
        return;
      }

      const payload: any = {
        ...addressForm,
        phone: onlyDigits(addressForm.phone).slice(0, 10),
        pincode: normPincode(addressForm.pincode),
        id: (editingAddress as any)?.id,
        userId: user.id,
      };

      const res = await fetch(`${API_BASE}/user/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save address");

      await loadAddresses();
      if (!selectedAddress || addressForm.isDefault) setSelectedAddress(result.address);

      setShowAddressDialog(false);
      setAddressForm({ name: "", phone: "", pincode: "", address: "", city: "", state: "", isDefault: false });
      setEditingAddress(null);

      toast({ title: "Success", description: editingAddress ? "Address updated" : "Address added" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save address", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  /** -----------------------------
   * Proof upload
   * ---------------------------- */
  const validateFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Upload JPG/PNG/GIF/WEBP/PDF only", variant: "destructive" });
      return false;
    }
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Max file size is 5MB", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setPaymentProof(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPaymentProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPaymentProofPreview(null);
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    const fileInput = document.getElementById("payment-proof-upload") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const copyUPIId = async () => {
    try {
      await navigator.clipboard.writeText(upiConfig.upiId);
      setCopiedUPI(true);
      toast({ title: "Copied!", description: "UPI ID copied" });
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Copy manually", variant: "destructive" });
    }
  };

  const handlePaymentSelection = (method: "upi" | "wallet") => {
    setSelectedPayment(method);

    if (appliedCoupon) {
      const validity = checkCouponValidity(appliedCoupon, orderDetails.subtotal, method);
      if (!validity.ok) {
        toast({ title: "Coupon removed", description: validity.msg, variant: "destructive" });
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }

    if (method === "upi") setShowUPIDialog(true);
  };

  /** ✅ realtime totals */
  useEffect(() => {
    const calculatedSubtotal = calcItemsSubtotal(orderDetails.items);

    let disc = 0;
    if (appliedCoupon) {
      const validity = checkCouponValidity(appliedCoupon, calculatedSubtotal, selectedPayment);
      if (validity.ok) disc = computeCouponDiscount(appliedCoupon, calculatedSubtotal);
      else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }

    setCouponDiscount(disc);

    const calculatedTotal =
      calculatedSubtotal +
      (orderDetails.shipping || 0) -
      (orderDetails.discount || 0) -
      disc;

    setOrderDetails((prev) => ({
      ...prev,
      subtotal: calculatedSubtotal,
      total: Math.max(0, calculatedTotal),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDetails.items, orderDetails.shipping, orderDetails.discount, appliedCoupon, selectedPayment, isFirstOrder]);

  /** ✅ Reset UPI dialog */
  useEffect(() => {
    if (!showUPIDialog) {
      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
    }
  }, [showUPIDialog]);

  /** -----------------------------
   * Order
   * ---------------------------- */
  const handlePlaceOrder = async (paymentMethod: "upi" | "wallet" = selectedPayment) => {
    // Delivery requires address
    if (fulfillmentType === "delivery" && !selectedAddress) {
      toast({ title: "Address required", description: "Please select a delivery address", variant: "destructive" });
      return;
    }

    // Pickup requirements
    if (fulfillmentType === "pickup") {
      if (!pickupPossible) {
        toast({
          title: "Pickup not allowed",
          description: "Pickup is available only when your pincode matches the shop pincode for these items.",
          variant: "destructive",
        });
        return;
      }
      if (!pickupLocationId) {
        toast({ title: "Pickup location required", variant: "destructive" });
        return;
      }
      if (!pickupSlot?.date || !pickupSlot?.time) {
        toast({ title: "Pickup slot required", variant: "destructive" });
        return;
      }
    }

    const calculatedSubtotal = calcItemsSubtotal(orderDetails.items);
    const baseForCoupon = calculatedSubtotal;

    let finalCouponDiscount = 0;
    if (appliedCoupon) {
      const validity = checkCouponValidity(appliedCoupon, baseForCoupon, paymentMethod);
      if (!validity.ok) {
        toast({ title: "Coupon removed", description: validity.msg, variant: "destructive" });
        setAppliedCoupon(null);
        setCouponDiscount(0);
      } else {
        finalCouponDiscount = computeCouponDiscount(appliedCoupon, baseForCoupon);
      }
    }

    /**
     * ✅ IMPORTANT:
     * Recompute shipping here so backend total matches rule immediately
     * If pickup OR preorder => shipping 0
     */
    const baseShipping = cartData.shipping ?? 50;
    const finalShipping = fulfillmentType === "pickup" || preOrderInfo.hasPreOrder ? 0 : baseShipping;

    const finalTotal = Math.max(
      0,
      calculatedSubtotal +
        finalShipping -
        (orderDetails.discount || 0) -
        finalCouponDiscount
    );

    if (paymentMethod === "wallet" && walletBalance < finalTotal) {
      toast({
        title: "Insufficient Wallet",
        description: `Wallet balance ₹${walletBalance.toFixed(2)} is not enough`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");

      if (!user || !token) {
        toast({ title: "Login required", description: "Please login again", variant: "destructive" });
        navigate("/login");
        return;
      }

      const mappedItems = orderDetails.items.map((item: any) => {
        const price = getItemPrice(item);
        const quantity = Number(item.quantity || 1);

        return {
          productId: item.productId || item._id || item.id,
          name: item.itemName || item.name || "Unnamed Product",
          price,
          originalPrice: Number(item.originalPrice || item.userPrice || price),
          image: item.images?.[0] || item.image || "/placeholder.png",
          quantity,
          color: item.selectedColor || item.color || "default",
          size: item.size || "One Size",
          vendorId: item.vendorId || null,
          itemTotal: price * quantity,

          fulfillment: item.fulfillment || null,
          preOrder: item.preOrder || null,
        };
      });

      const finalSubtotal = mappedItems.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);

      let upiDetails: any = null;
      if (paymentMethod === "upi") {
        upiDetails = {
          upiId: upiConfig.upiId,
          transactionId: upiTransactionId || `UPI_${Date.now()}`,
          paymentProof: null,
        };
      }

      const fulfillment =
        fulfillmentType === "pickup"
          ? { type: "pickup", pickupLocationId, pickupSlot, userPincode }
          : { type: "delivery" };

      const orderData: any = {
        userId: user.id,

        userDetails: {
          userId: user.id,
          name: user.name || user.username || "Customer",
          email: user.email || "",
          phone: fulfillmentType === "delivery" ? selectedAddress?.phone : (user.phone || ""),
        },

        shippingAddress: fulfillmentType === "delivery" ? selectedAddress : null,
        fulfillment,

        preOrder: {
          isPreOrder: preOrderInfo.hasPreOrder,
          availableOn: preOrderInfo.availableOnMax,
        },

        paymentDetails: {
          method: paymentMethod,
          amount: finalTotal,
          status: paymentMethod === "upi" ? "pending_verification" : "completed",
          transactionId:
            paymentMethod === "wallet"
              ? `WALLET_${Date.now()}`
              : upiTransactionId || `TXN_${Date.now()}`,
          upiDetails,
        },

        orderItems: mappedItems,

        coupon: appliedCoupon
          ? { code: appliedCoupon.code, type: appliedCoupon.type, value: appliedCoupon.value, discount: finalCouponDiscount }
          : null,

        orderSummary: {
          itemsCount: mappedItems.reduce((acc: number, it: any) => acc + it.quantity, 0),
          subtotal: finalSubtotal,
          shipping: finalShipping, // ✅ RULE APPLIED HERE
          discount: (orderDetails.discount || 0) + finalCouponDiscount,
          total: finalTotal,
          tax: 0,
          grandTotal: finalTotal,
        },

        status: paymentMethod === "upi" ? "payment_pending" : "confirmed",
      };

      let response: Response;

      if (paymentMethod === "upi" && paymentProof) {
        const formData = new FormData();
        formData.append("orderData", JSON.stringify(orderData));
        formData.append("paymentProof", paymentProof);
        formData.append("transactionId", upiTransactionId);

        response = await fetch(`${API_BASE}/orders/with-proof`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(orderData),
        });
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Order failed");

      localStorage.removeItem("cart");
      localStorage.setItem("hasOrderedOnce", "true");

      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setShowUPIDialog(false);

      toast({
        title: "Success!",
        description:
          paymentMethod === "upi"
            ? "Order placed! Proof uploaded. We'll verify shortly."
            : "Order placed successfully!",
      });

      navigate("/order-success", {
        state: {
          orderId: result.order?._id || result.order?.orderNumber,
          paymentMethod,
          requiresVerification: paymentMethod === "upi",
          coupon: appliedCoupon ? appliedCoupon.code : null,
          fulfillmentType,
        },
      });
    } catch (err: any) {
      console.error("Order error:", err);
      toast({ title: "Order Failed", description: err?.message || "Failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleUPIPayment = async () => {
    if (!upiTransactionId.trim()) {
      toast({ title: "Transaction ID Required", description: "Enter UPI transaction ID", variant: "destructive" });
      return;
    }
    if (!paymentProof) {
      toast({ title: "Payment Proof Required", description: "Upload screenshot", variant: "destructive" });
      return;
    }
    setIsProcessingUPI(true);
    setIsUploading(true);
    try {
      await handlePlaceOrder("upi");
    } finally {
      setIsProcessingUPI(false);
      setIsUploading(false);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({ ...(addr as any) });
    setShowAddressDialog(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: "",
      phone: "",
      pincode: "",
      address: "",
      city: "",
      state: "",
      isDefault: addresses.length === 0,
    });
    setShowAddressDialog(true);
  };

  const formatAddress = (addr: Address | null) =>
    addr ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}` : "";

  const selectedPickupLocation = useMemo(
    () => pickupLocations.find((l) => l._id === pickupLocationId) || null,
    [pickupLocations, pickupLocationId]
  );

  /** ✅ show why pickup is disabled */
  const pickupDisabledReason = useMemo(() => {
    if (!orderDetails.items?.length) return "No items";
    const flags = orderDetails.items.map((it: any) => readItemFlags(it));

    if (!flags.every((f) => f.allowPickup)) return "Some items don’t support pickup";
    if (!userPincode) return "Add/select address pincode to enable pickup";
    const allHaveShopPin = flags.every((f) => !f.pincodeMatchOnly || !!normPincode(f.shopPincode));
    if (!allHaveShopPin) return "Shop pincode missing in cart items (backend will validate)";
    const allMatch = flags.every((f) => !f.pincodeMatchOnly || normPincode(f.shopPincode) === userPincode);
    if (!allMatch) return "Your pincode doesn’t match the shop pincode";
    return "";
  }, [orderDetails.items, userPincode]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          Checkout
        </h1>

        {/* ✅ Pre-order banner */}
        {preOrderInfo.hasPreOrder && preOrderInfo.availableOnMax && (
          <div className="mb-4 rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm">
            ⏳ Pre-order items included. Ready on / after:{" "}
            <strong>{new Date(preOrderInfo.availableOnMax).toDateString()}</strong>
            <span className="ml-2 text-green-700 font-medium">• Shipping Free ✅</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* ✅ Fulfillment */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Fulfillment</h2>

              <RadioGroup
                value={fulfillmentType}
                onValueChange={(v: any) => setFulfillmentType(v)}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer">
                    Home Delivery{" "}
                    {preOrderInfo.hasPreOrder ? (
                      <span className="text-xs text-green-700 font-medium">(Free for pre-order)</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">(Shipping applies)</span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="pickup" id="pickup" disabled={!pickupPossible} />
                  <Label htmlFor="pickup" className={`cursor-pointer ${!pickupPossible ? "text-muted-foreground" : ""}`}>
                    Self Pickup (Free)
                    {!pickupPossible && (
                      <span className="text-xs ml-2">({pickupDisabledReason || "Not available"})</span>
                    )}
                  </Label>
                </div>
              </RadioGroup>

              {/* Pickup options */}
              {fulfillmentType === "pickup" && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm flex gap-2">
                    <Store className="h-4 w-4 mt-0.5" />
                    Select pickup location + slot
                  </div>

                  {pickupLocations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No pickup locations available for pincode: <strong>{userPincode || "—"}</strong>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Pickup Location</Label>
                        <select
                          value={pickupLocationId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setPickupLocationId(id);
                            const loc = pickupLocations.find((l) => l._id === id);
                            setPickupSlot(loc?.slots?.[0] || null);
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        >
                          {pickupLocations.map((loc) => (
                            <option key={loc._id} value={loc._id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>

                        {selectedPickupLocation && (
                          <p className="text-xs text-muted-foreground flex items-start gap-2 mt-1">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            {selectedPickupLocation.address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Pickup Slot</Label>

                        <select
                          value={pickupSlot ? `${pickupSlot.date}__${pickupSlot.time}` : ""}
                          onChange={(e) => {
                            const [date, time] = e.target.value.split("__");
                            setPickupSlot({ date, time });
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        >
                          {(selectedPickupLocation?.slots || []).map((s, idx) => (
                            <option key={idx} value={`${s.date}__${s.time}`}>
                              {s.date} • {s.time}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" />
                          Pickup is free. Please arrive during your selected slot.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {fulfillmentType === "delivery" && (
              <div className="bg-white rounded-lg border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold">Delivery Address</h2>
                  <Button variant="outline" size="sm" onClick={handleAddNewAddress} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add New
                  </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No addresses saved yet</p>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`border p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?._id === addr._id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedAddress(addr)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">
                              {addr.name}{" "}
                              {addr.isDefault && (
                                <span className="text-xs bg-primary text-white px-2 py-1 rounded ml-2">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {formatAddress(addr)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{addr.phone}</p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(addr);
                            }}
                            className="flex-shrink-0"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

              <RadioGroup
                value={selectedPayment}
                onValueChange={(v: any) => handlePaymentSelection(v)}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem
                    value="wallet"
                    id="wallet"
                    disabled={walletBalance < orderDetails.total}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label htmlFor="wallet" className="cursor-pointer flex items-center gap-2 text-sm sm:text-base">
                    Wallet
                    {walletBalance < orderDetails.total ? (
                      <span className="text-red-500 text-xs">(₹{walletBalance.toFixed(2)} insufficient)</span>
                    ) : (
                      <span className="text-green-600 text-xs">(₹{walletBalance.toFixed(2)})</span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <RadioGroupItem value="upi" id="upi" className="h-4 w-4 sm:h-5 sm:w-5" />
                  <Label htmlFor="upi" className="cursor-pointer font-medium flex items-center gap-2 text-sm sm:text-base">
                    <QrCode className="h-4 w-4" />
                    UPI Payment
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Ticket className="h-5 w-5" /> Apply Coupon
                </h2>
                {checkingFirstOrder ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking offers…
                  </span>
                ) : isFirstOrder ? (
                  <span className="text-xs text-green-600 font-medium">First order eligible ✅</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not first order</span>
                )}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter coupon code (e.g., FIRST100)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                {!appliedCoupon ? (
                  <Button type="button" onClick={() => applyCoupon()} className="sm:w-36">
                    Apply
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={removeCoupon} className="sm:w-36">
                    Remove
                  </Button>
                )}
              </div>

              {appliedCoupon && (
                <div className="mt-3 rounded-lg border bg-green-50 border-green-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-700">{appliedCoupon.title}</p>
                      <p className="text-xs text-green-700 mt-1">
                        Saved: <strong>₹{couponDiscount.toFixed(2)}</strong>
                      </p>
                    </div>
                    <button className="text-green-800 hover:text-green-900" onClick={removeCoupon} title="Remove">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {COUPONS.map((c) => {
                  const ok = checkCouponValidity(c, orderDetails.subtotal, selectedPayment).ok;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => !appliedCoupon && applyCoupon(c.code)}
                      className={`text-left rounded-lg border p-3 transition ${
                        ok ? "hover:border-primary" : "opacity-60 cursor-not-allowed"
                      }`}
                      disabled={!ok || !!appliedCoupon}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{c.code}</p>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                          {c.type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Discount applies on subtotal (excluding shipping). Only one coupon can be applied.
              </p>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4 sm:p-6 sticky top-4">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg mb-3 sm:mb-4">Product Details</h3>

                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                  {orderDetails.items.map((item: any, index: number) => {
                    const price = getItemPrice(item);
                    const quantity = Number(item.quantity || 1);
                    const itemTotal = price * quantity;

                    const flags = readItemFlags(item);

                    return (
                      <div key={item._id || item.productId || index} className="bg-white rounded-lg border p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                            <img
                              src={item.images?.[0] || item.image || "/placeholder.png"}
                              alt={item.itemName || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">{item.itemName || item.name}</h4>

                            

                            {flags.isPreOrder && flags.availableOn && (
                              <p className="text-[11px] text-muted-foreground mb-1">
                                Available on: <strong>{new Date(flags.availableOn).toDateString()}</strong>
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 sm:gap-2 text-muted-foreground text-xs mb-1">
                              <span>Qty: {quantity}</span>
                              {item.selectedColor && <span>• Color: {item.selectedColor}</span>}
                              {item.size && <span>• Size: {item.size}</span>}
                            </div>

                            <p className="font-semibold text-sm">₹{itemTotal.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">₹{price.toFixed(2)} each</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Other Discount</span>
                    <span>-₹{orderDetails.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base">
                  <span>Shipping</span>
                  <span>
                    {fulfillmentType === "pickup" ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : preOrderInfo.hasPreOrder ? (
                      <span className="text-green-600 font-semibold">Free (Pre-order)</span>
                    ) : (
                      `₹${orderDetails.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-semibold text-base sm:text-lg border-t pt-2 sm:pt-3">
                  <span>Total</span>
                  <span>₹{orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 sm:mt-6 text-sm sm:text-base py-2.5 sm:py-3"
                onClick={() => {
                  if (selectedPayment === "upi") setShowUPIDialog(true);
                  else handlePlaceOrder();
                }}
                disabled={
                  isLoading ||
                  (fulfillmentType === "delivery" && !selectedAddress) ||
                  (fulfillmentType === "pickup" && (!pickupPossible || !pickupLocationId || !pickupSlot))
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              {fulfillmentType === "delivery" && !selectedAddress && (
                <p className="text-xs text-red-500 text-center mt-2">Please select a delivery address</p>
              )}

              {fulfillmentType === "pickup" && (!pickupPossible || !pickupLocationId || !pickupSlot) && (
                <p className="text-xs text-red-500 text-center mt-2">
                  {!pickupPossible ? pickupDisabledReason : "Please select pickup location + slot"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>Enter your address details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-4">
            <Input
              placeholder="Full Name"
              value={addressForm.name}
              onChange={(e) => setAddressForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Phone (10 digits)"
              value={addressForm.phone}
              onChange={(e) => setAddressForm((p) => ({ ...p, phone: onlyDigits(e.target.value).slice(0, 10) }))}
            />
            <Input
              placeholder="Pincode (6 digits)"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm((p) => ({ ...p, pincode: normPincode(e.target.value) }))}
            />
            <Textarea
              placeholder="Address"
              value={addressForm.address}
              onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
              className="min-h-[80px]"
            />
            <Input
              placeholder="City"
              value={addressForm.city}
              onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
            />
            <Input
              placeholder="State"
              value={addressForm.state}
              onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button disabled={!isAddressFormValid() || isLoading} onClick={handleAddOrEditAddress} className="w-full sm:w-auto">
              {isLoading ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Dialog */}
      <Dialog open={showUPIDialog} onOpenChange={setShowUPIDialog}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              UPI Payment
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Complete payment and upload screenshot for verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="bg-white p-3 sm:p-4 rounded-lg border inline-block max-w-full">
                  <img src={upiConfig.qrCodeUrl} alt="UPI QR Code" className="w-36 h-36 sm:w-44 sm:h-44 mx-auto" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">Scan QR code with any UPI app</p>
              </div>

              <div className="text-center">
                <Label className="text-sm sm:text-base font-medium mb-2 block">Or use UPI ID</Label>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border border-primary/20">
                  <p className="font-mono text-base sm:text-lg font-bold break-all">{upiConfig.upiId}</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm" onClick={copyUPIId}>
                    {copiedUPI ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    )}
                    {copiedUPI ? "Copied!" : "Copy UPI ID"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>
                    Merchant: <strong>{upiConfig.merchantName}</strong>
                  </p>
                  <p>
                    Amount: <strong>₹{orderDetails.total.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-id" className="text-sm sm:text-base font-medium">
                Enter Transaction ID *
              </Label>
              <Input
                id="transaction-id"
                placeholder="Enter UPI transaction reference number"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Upload Payment Screenshot *</Label>

              {paymentProof ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">File uploaded successfully</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePaymentProof}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    {paymentProofPreview ? (
                      <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-100 flex-shrink-0">
                        <span className="text-xs font-medium">PDF</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{paymentProof.name}</p>
                      <p className="text-xs text-gray-500">
                        {(paymentProof.size / 1024).toFixed(2)} KB • {paymentProof.type}
                      </p>
                      {paymentProofPreview && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => window.open(paymentProofPreview, "_blank")}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View full image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="payment-proof-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">Upload payment screenshot</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP or PDF (Max 5MB)</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowUPIDialog(false)}
                className="w-full sm:w-auto"
                disabled={isProcessingUPI || isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUPIPayment}
                disabled={!upiTransactionId.trim() || !paymentProof || isProcessingUPI || isUploading}
                className="w-full sm:w-auto"
              >
                {isProcessingUPI || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment & Place Order"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
