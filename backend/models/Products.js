import mongoose from "mongoose";

/** ✅ Reusable tier schema */
const referralTierSchema = new mongoose.Schema(
  {
    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const referralCommissionsSchema = new mongoose.Schema(
  {
    stateFranchiser: { type: referralTierSchema, default: () => ({}) },
    franchiser: { type: referralTierSchema, default: () => ({}) },
    level1: { type: referralTierSchema, default: () => ({}) },
    level2: { type: referralTierSchema, default: () => ({}) },
    level3: { type: referralTierSchema, default: () => ({}) },
  },
  { _id: false }
);

/** ✅ fulfillment schema */
const fulfillmentSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["delivery_only", "pickup_only", "both"],
      default: "delivery_only",
    },
    pickupEnabled: { type: Boolean, default: false },
    deliveryEnabled: { type: Boolean, default: true },
    pickupRules: {
      pincodeMatchOnly: { type: Boolean, default: true },
    },

    // ✅ store shop pincode snapshot (recommended)
    pickupShopPincode: { type: String, default: "" },
  },
  { _id: false }
);

/** ✅ preOrder schema */
const preOrderSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    availableFrom: { type: Date, default: null },
    expectedDispatchDays: { type: Number, default: 0 },
    maxQtyPerUser: { type: Number, default: 0 }, // 0 => no limit
    note: { type: String, default: "" },
  },
  { _id: false }
);

/** ✅ availability controls */
const availabilitySchema = new mongoose.Schema(
  {
    blockIfOutOfStock: { type: Boolean, default: true },
    allowPreOrderWhenOutOfStock: { type: Boolean, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },

    itemType: { type: String, enum: ["product", "service"], default: "product" },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    // ✅ FIX: store subcategory as ObjectId (not String)
    subcategory: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },

    itemName: { type: String, required: true, trim: true, index: true },

    description: { type: String, default: "" },

    images: { type: [String], default: [] },

    slug: { type: String, unique: true, sparse: true, index: true },

    skuCode: { type: String, required: true, unique: true, index: true, trim: true },

    measuringUnit: { type: String, default: "" },
    hsnCode: { type: String, default: "" },
    godown: { type: String, default: "" },

    openStock: { type: Number, default: 0 },
    asOnDate: { type: String, default: "" },

    // --- PRICE DETAILS ---
    priceType: { type: String, enum: ["product-wise", "order-wise"], default: "product-wise" },

    // ✅ NEW
    mrpType: { type: String, enum: ["with-gst", "without-gst"], default: "without-gst" },

    userPrice: { type: Number, default: 0 }, // MRP/base price
    gstRate: { type: Number, default: 0 },

    // ✅ NEW
    gstAmount: { type: Number, default: 0 },

    discount: { type: Number, default: 0 }, // %
    // ✅ NEW
    discountAmount: { type: Number, default: 0 }, // ₹

    afterDiscount: { type: Number, default: 0 }, // final price customer pays

    commission: { type: Number, default: 0 }, // admin set
    finalAmount: { type: Number, default: 0 }, // after commission

    // referral
    referralBase: { type: Number, default: 0 },
    referralCommissions: { type: referralCommissionsSchema, default: () => ({}) },
    totalReferralAmount: { type: Number, default: 0 },

    // pickup + preorder
    fulfillment: { type: fulfillmentSchema, default: () => ({}) },
    preOrder: { type: preOrderSchema, default: () => ({}) },
    availability: { type: availabilitySchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Vendor Confirmed", "Vendor Rejected", "Admin Approved", "Admin Rejected", "Rejected", "Draft"],
      default: "Pending",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * ✅ Auto-calc amounts
 */
productSchema.pre("save", function (next) {
  try {
    // ✅ skip for order-wise pricing
    if (this.priceType === "order-wise") return next();

    const after = Number(this.afterDiscount || 0);
    const comm = Number(this.commission || 0);

    const vendorCut = (after * comm) / 100;
    const finalAmount = Math.max(0, after - vendorCut);

    this.finalAmount = finalAmount;
    this.referralBase = finalAmount;

    const rc = this.referralCommissions || {};
    const sum =
      Number(rc?.stateFranchiser?.amount || 0) +
      Number(rc?.franchiser?.amount || 0) +
      Number(rc?.level1?.amount || 0) +
      Number(rc?.level2?.amount || 0) +
      Number(rc?.level3?.amount || 0);

    this.totalReferralAmount = sum;

    next();
  } catch (e) {
    next(e);
  }
});

export default mongoose.model("Products", productSchema);
