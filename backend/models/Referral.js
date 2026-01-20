import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    // The upline user who earns from this referral record
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The downline user who joined / purchased
    // ✅ NOT UNIQUE (because same referred user can create L1/L2/L3 records for different referrers)
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

    // Keep this for sign-up bonus base
    signupBonus: {
      type: Number,
      default: 50,
    },

    // What you actually credited (for signup bonus or any credited reward)
    rewardAmount: {
      type: Number,
      default: 0,
    },

    // ✅ Level of this record relative to referrer
    // 1 = direct, 2 = indirect, 3 = level3
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

    // ✅ Keep commission types consistent everywhere
    commissionType: {
      type: String,
      enum: ["signup-bonus", "purchase-commission", "recurring"],
      default: "signup-bonus",
      index: true,
    },

    // Optional: store breakdown amounts (if you want)
    commissions: {
      level1: { type: Number, default: 0 },
      level2: { type: Number, default: 0 },
      level3: { type: Number, default: 0 },
      adminCommission: { type: Number, default: 0 },
    },

    commissionRecipients: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        level: { type: Number, enum: [1, 2, 3] },
        amount: { type: Number, default: 0 },
        commissionType: {
          type: String,
          enum: ["signup-bonus", "purchase-commission", "recurring"],
          default: "signup-bonus",
        },
        creditedAt: Date,
        status: { type: String, enum: ["pending", "credited"], default: "pending" },
      },
    ],

    referralChain: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        referralCode: String,
        level: Number,
        earnedCommission: { type: Number, default: 0 },
        commissionType: String,
      },
    ],

    totalCommissionsPaid: { type: Number, default: 0 },

    // Order info (for purchase commissions)
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderAmount: { type: Number, default: 0 },
    orderNumber: { type: String },

    // Helpful flags (optional)
    isDirect: { type: Boolean, default: true },

    // Parent referrer useful for tracing
    parentReferrer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ IMPORTANT: prevent duplicates for same upline/referral/level/type
referralSchema.index(
  { referrer: 1, referredUser: 1, level: 1, commissionType: 1 },
  { unique: true }
);

// Other useful indexes
referralSchema.index({ createdAt: -1 });
referralSchema.index({ "commissionRecipients.userId": 1 });
referralSchema.index({ "commissionRecipients.level": 1 });

// Virtuals
referralSchema.virtual("totalCommission").get(function () {
  return (
    (this.commissions?.level1 || 0) +
    (this.commissions?.level2 || 0) +
    (this.commissions?.level3 || 0)
  );
});

referralSchema.virtual("commissionBreakdown").get(function () {
  return {
    level1: this.commissions?.level1 || 0,
    level2: this.commissions?.level2 || 0,
    level3: this.commissions?.level3 || 0,
    total: this.totalCommission,
  };
});

// Static helper: commission calc
referralSchema.statics.calculateCommissions = function (orderAmount, type = "purchase-commission") {
  const commissions = { level1: 0, level2: 0, level3: 0, total: 0 };

  if (type === "signup-bonus") {
    commissions.level1 = 50;
  } else if (type === "purchase-commission") {
    commissions.level1 = orderAmount * 0.1;
    commissions.level2 = orderAmount * 0.05;
    commissions.level3 = orderAmount * 0.05;
  }

  commissions.total = commissions.level1 + commissions.level2 + commissions.level3;
  return commissions;
};

export default mongoose.model("Referral", referralSchema);
