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
  // Multi-level commission tracking - UPDATED FOR 3 LEVELS
  level: {
    type: Number,
    enum: [1, 2, 3], // UPDATED: Added level 3
    default: 1,
    description: "1 = direct referral, 2 = indirect referral, 3 = sub-indirect referral"
  },
  levelName: {
    type: String,
    enum: ['direct', 'indirect', 'sub-indirect'], // UPDATED: Added sub-indirect
    default: 'direct'
  },
  // Track commission types separately
  commissionType: {
    type: String,
    enum: ['signup-bonus', 'purchase-commission', 'recurring'],
    default: 'signup-bonus'
  },
  // UPDATED COMMISSIONS FOR 3 LEVELS
  commissions: {
    level1: { type: Number, default: 0 },
    level2: { type: Number, default: 0 },
    level3: { type: Number, default: 0 }, // NEW: Added level 3 commission
    adminCommission: { type: Number, default: 0 }
  },
  // UPDATED COMMISSION RECIPIENTS FOR 3 LEVELS
  commissionRecipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    level: {
      type: Number,
      enum: [1, 2, 3] // UPDATED: Added level 3
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

// UPDATED VIRTUAL FOR TOTAL COMMISSION (INCLUDING LEVEL 3)
referralSchema.virtual('totalCommission').get(function() {
  return (
    (this.commissions.level1 || 0) +
    (this.commissions.level2 || 0) +
    (this.commissions.level3 || 0) // ADDED: Level 3 commission
  );
});

// UPDATED VIRTUAL FOR COMMISSION BREAKDOWN WITH 3 LEVELS
referralSchema.virtual('commissionBreakdown').get(function() {
  return {
    level1: this.commissions.level1 || 0,
    level2: this.commissions.level2 || 0,
    level3: this.commissions.level3 || 0, // NEW: Added level 3 breakdown
    total: this.totalCommission
  };
});

// NEW: Virtual for commission distribution summary
referralSchema.virtual('commissionSummary').get(function() {
  const summary = {
    direct: 0,
    indirect: 0,
    byLevel: {}
  };
  
  if (this.commissionRecipients && this.commissionRecipients.length > 0) {
    this.commissionRecipients.forEach(recipient => {
      if (recipient.level === 1) {
        summary.direct += recipient.amount || 0;
        summary.byLevel.level1 = recipient.amount || 0;
      } else if (recipient.level === 2) {
        summary.indirect += recipient.amount || 0;
        summary.byLevel.level2 = recipient.amount || 0;
      } else if (recipient.level === 3) {
        summary.indirect += recipient.amount || 0; // Level 3 is also indirect
        summary.byLevel.level3 = recipient.amount || 0;
      }
    });
  }
  
  summary.total = summary.direct + summary.indirect;
  return summary;
});

// NEW: Virtual for commission recipients by level
referralSchema.virtual('recipientsByLevel').get(function() {
  const byLevel = {
    level1: [],
    level2: [],
    level3: []
  };
  
  if (this.commissionRecipients && this.commissionRecipients.length > 0) {
    this.commissionRecipients.forEach(recipient => {
      if (recipient.level === 1) {
        byLevel.level1.push({
          userId: recipient.userId,
          amount: recipient.amount,
          commissionType: recipient.commissionType,
          status: recipient.status
        });
      } else if (recipient.level === 2) {
        byLevel.level2.push({
          userId: recipient.userId,
          amount: recipient.amount,
          commissionType: recipient.commissionType,
          status: recipient.status
        });
      } else if (recipient.level === 3) {
        byLevel.level3.push({
          userId: recipient.userId,
          amount: recipient.amount,
          commissionType: recipient.commissionType,
          status: recipient.status
        });
      }
    });
  }
  
  return byLevel;
});

// NEW: Check if level 3 commission is available
referralSchema.virtual('hasLevel3Commission').get(function() {
  return (this.commissions.level3 || 0) > 0;
});

// NEW: Get total commission by type
referralSchema.methods.getCommissionByType = function(type) {
  let total = 0;
  if (this.commissionRecipients && this.commissionRecipients.length > 0) {
    this.commissionRecipients.forEach(recipient => {
      if (recipient.commissionType === type) {
        total += recipient.amount || 0;
      }
    });
  }
  return total;
};

// NEW: Add commission recipient with proper level validation
referralSchema.methods.addCommissionRecipient = function(recipientData) {
  if (!this.commissionRecipients) {
    this.commissionRecipients = [];
  }
  
  // Validate level
  if (recipientData.level < 1 || recipientData.level > 3) {
    throw new Error('Level must be between 1 and 3');
  }
  
  this.commissionRecipients.push(recipientData);
  return this;
};

// NEW: Calculate commission distribution for 3 levels
referralSchema.statics.calculateCommissions = function(orderAmount, type = 'purchase-commission') {
  let commissions = {
    level1: 0,
    level2: 0,
    level3: 0,
    total: 0
  };
  
  if (type === 'signup-bonus') {
    commissions.level1 = 50;
    commissions.level2 = 25;
    commissions.level3 = 25;
  } else if (type === 'purchase-commission') {
    // Example: 10% for level 1, 5% for level 2, 5% for level 3
    commissions.level1 = orderAmount * 0.10;
    commissions.level2 = orderAmount * 0.05;
    commissions.level3 = orderAmount * 0.05;
  }
  
  commissions.total = commissions.level1 + commissions.level2 + commissions.level3;
  return commissions;
};

// Indexes for better query performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referredUser: 1 });
referralSchema.index({ createdAt: -1 });
referralSchema.index({ 'commissionRecipients.userId': 1 });
referralSchema.index({ level: 1 }); // NEW: Index for level queries
referralSchema.index({ 'commissionRecipients.level': 1 }); // NEW: Index for commission level queries

export default mongoose.model('Referral', referralSchema);