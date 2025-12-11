import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'credited'],
    default: 'pending'
  },
  // Keep this for sign-up bonus
  signupBonus: {
    type: Number,
    default: 50
  },
  // Track the actual reward amount credited
  rewardAmount: {
    type: Number,
    default: 0
  },
  // Multi-level commission tracking
  level: {
    type: Number,
    enum: [1, 2],
    default: 1,
    description: "1 = direct referral, 2 = indirect referral"
  },
  levelName: {
    type: String,
    enum: ['direct', 'indirect'],
    default: 'direct'
  },
  // Track commission types separately
  commissionType: {
    type: String,
    enum: ['signup-bonus', 'purchase-commission', 'recurring'],
    default: 'signup-bonus'
  },
  commissions: {
    level1: { type: Number, default: 0 },
    level2: { type: Number, default: 0 },
    adminCommission: { type: Number, default: 0 }
  },
  // Track which users received commissions at each level
  commissionRecipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    level: {
      type: Number,
      enum: [1, 2]
    },
    amount: {
      type: Number,
      default: 0
    },
    commissionType: {
      type: String,
      enum: ['signup-bonus', 'purchase-commission', 'recurring'],
      default: 'signup-bonus'
    },
    creditedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'credited'],
      default: 'pending'
    }
  }],
  // Track the referral chain hierarchy
  referralChain: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referralCode: String,
    level: Number,
    earnedCommission: {
      type: Number,
      default: 0
    },
    commissionType: String
  }],
  // Performance tracking
  totalCommissionsPaid: {
    type: Number,
    default: 0
  },
  // Order information (for purchase-based commissions)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderAmount: {
    type: Number,
    default: 0
  },
  orderNumber: {
    type: String
  },
  // Track if this is a direct or indirect referral
  isDirect: {
    type: Boolean,
    default: true
  },
  // Parent referrer for indirect referrals
  parentReferrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total commission
referralSchema.virtual('totalCommission').get(function() {
  return (
    (this.commissions.level1 || 0) +
    (this.commissions.level2 || 0)
  );
});

// Virtual for commission breakdown
referralSchema.virtual('commissionBreakdown').get(function() {
  return {
    direct: this.commissions.level1 || 0,
    indirect: this.commissions.level2 || 0,
    total: (this.commissions.level1 || 0) + (this.commissions.level2 || 0)
  };
});

// Indexes for better query performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referredUser: 1 });
referralSchema.index({ createdAt: -1 });
referralSchema.index({ 'commissionRecipients.userId': 1 });

export default mongoose.model('Referral', referralSchema);