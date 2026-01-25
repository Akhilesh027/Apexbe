import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "credited"],
      default: "pending",
      index: true,
    },

    signupBonus: { type: Number, default: 50 },

    rewardAmount: { type: Number, default: 0 },

    level: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
      index: true,
    },

    levelName: {
      type: String,
      enum: ["direct", "indirect", "sub-indirect"],
      default: "direct",
    },

    commissionType: {
      type: String,
      enum: ["signup-bonus", "purchase-commission", "recurring"],
      default: "signup-bonus",
      index: true,
    },

    // ✅ NEW: differentiate incentive
    source: {
      type: String,
      enum: ["order-commission", "product-commission", "signup-bonus"],
      default: "signup-bonus",
      index: true,
    },

    // ✅ NEW: enforce FIRST purchase commission logic
    isFirstPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },

    commissions: {
      level1: { type: Number, default: 0 },
      level2: { type: Number, default: 0 },
      level3: { type: Number, default: 0 },
      adminCommission: { type: Number, default: 0 },
    },

    totalCommissionsPaid: { type: Number, default: 0 },

    // Order info
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    orderAmount: { type: Number, default: 0 },
    orderNumber: { type: String },

    isDirect: { type: Boolean, default: true },

    parentReferrer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ✅ NEW: for wish link / debugging
    notes: { type: String, default: "" },

    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * ✅ IMPORTANT
 * - Signup bonus: unique per (referrer, referredUser, level, commissionType)
 * - Purchase commission: unique per (referrer, referredUser, level, commissionType, orderId)
 *   (because orderId makes each purchase unique)
 */
referralSchema.index(
  { referrer: 1, referredUser: 1, level: 1, commissionType: 1, orderId: 1 },
  { unique: true, partialFilterExpression: { commissionType: "purchase-commission" } }
);

referralSchema.index(
  { referrer: 1, referredUser: 1, level: 1, commissionType: 1 },
  { unique: true, partialFilterExpression: { commissionType: "signup-bonus" } }
);

referralSchema.index({ createdAt: -1 });

export default mongoose.model("Referral", referralSchema);
