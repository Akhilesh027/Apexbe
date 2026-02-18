import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  color: {
    type: String,
    default: 'default'
  },
  size: {
    type: String,
    default: 'One Size'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  itemTotal: {
    type: Number,
    required: true
  }
});

const orderStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'payment_pending', 'payment_verified', 'payment_failed'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: String,
  updatedBy: {
    type: String,
    enum: ['system', 'admin', 'user', 'vendor'],
    default: 'system'
  }
});

const paymentProofSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['upi_screenshot', 'bank_transfer', 'other'],
    default: 'upi_screenshot'
  },
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  fileSize: Number,
  mimeType: String,
  transactionReference: {
    type: String,
    required: true
  },
  upiId: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
});

const upiPaymentSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true
  },
  paymentProof: paymentProofSchema,
  transactionId: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userDetails: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    phone: String
  },

  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },

  paymentDetails: {
    method: {
      type: String,
      enum: ['upi', 'card', 'wallet', 'scan', 'cod', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'pending_verification', 'verified', 'rejected', 'processing', 'partially_refunded', 'requires_verification'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: String,
    paymentDate: Date,
    
    upiDetails: upiPaymentSchema,
    
    gatewayResponse: Object,
    refundAmount: Number,
    refundReason: String,
    refundDate: Date,
    
    // Additional payment fields
    requiresVerification: {
      type: Boolean,
      default: false
    },
    verificationNotes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  },

  orderItems: [orderItemSchema],

  orderSummary: {
    itemsCount: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    },
    
    // Additional summary fields
    // add inside orderSchema (top-level)
coupon: {
  code: String,
  type: { type: String, enum: ["flat", "percent"] },
  value: Number,
  discount: { type: Number, default: 0 },
},

    couponCode: String,
    couponDiscount: {
      type: Number,
      default: 0
    },
    walletUsed: {
      type: Number,
      default: 0
    },
    pointsUsed: {
      type: Number,
      default: 0
    }
  },

  orderStatus: {
    currentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded', 'payment_pending', 'payment_verified', 'payment_failed'],
      default: 'pending'
    },
    timeline: [orderStatusSchema],
    history: [{
      status: String,
      changedAt: {
        type: Date,
        default: Date.now
      },
      notes: String,
      changedBy: {
        type: String,
        enum: ['system', 'admin', 'user', 'vendor', 'customer']
      }
    }]
  },

  deliveryDetails: {
    expectedDelivery: Date,
    shippingMethod: {
      type: String,
      default: 'Standard Delivery'
    },
    trackingNumber: String,
    carrier: String,
    actualDeliveryDate: Date,
    deliveryProof: String,
    deliveredBy: String,
    
    // Additional delivery fields
    shippingProvider: String,
    shippingCost: {
      type: Number,
      default: 0
    },
    shippingLabel: String,
    shippedAt: Date,
    outForDeliveryAt: Date
  },

  vendorOrders: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products'
      },
      quantity: Number,
      price: Number,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
      }
    }],
    totalAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    shippedAt: Date,
    deliveredAt: Date
  }],

  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    noteType: {
      type: String,
      enum: ['general', 'payment', 'shipping', 'customer', 'vendor', 'refund', 'fraud'],
      default: 'general'
    }
  }],
fulfillment: {
  type: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  pickupLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "PickupLocation", default: null },
  pickupSlot: {
    date: String,   // "2026-02-20"
    time: String,   // "10:00-11:00"
  },
},
preOrder: {
  isPreOrder: { type: Boolean, default: false },
  availableOn: { type: Date, default: null }, // max of items availability
},
  customerNotes: String,
  internalNotes: String,

  metadata: {
    source: {
      type: String,
      enum: ['cart', 'buy_now', 'subscription', 'guest', 'reorder'],
      default: 'cart'
    },
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    appVersion: String,
    
    // Commission recipients for referral program
    commissionRecipients: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      level: {
        type: Number,
        required: true
      },
      commissionAmount: {
        type: Number,
        required: true
      },
      commissionType: {
        type: String,
        enum: ['purchase', 'signup', 'bonus']
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
      },
      processedAt: Date,
      notes: String
    }],
    
    // Additional metadata
    sessionId: String,
    campaignId: String,
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String
  },

  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: Date,
  deliveredAt: Date,
  
  // Additional dates
  confirmedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  paidAt: Date,
  
  // Return and refund
  returnRequestedAt: Date,
  returnApprovedAt: Date,
  returnCompletedAt: Date,
  refundRequestedAt: Date,
  refundProcessedAt: Date,
  
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) // 7 days from creation
  }
});

// Status descriptions
orderSchema.methods.getStatusDescription = function(status) {
  const descriptions = {
    'pending': 'Order received and being processed',
    'confirmed': 'Order confirmed and payment verified',
    'processing': 'Order is being prepared for shipment',
    'shipped': 'Order has been shipped',
    'out_for_delivery': 'Order is out for delivery',
    'delivered': 'Order has been delivered',
    'cancelled': 'Order has been cancelled',
    'returned': 'Order has been returned',
    'refunded': 'Order has been refunded',
    'payment_pending': 'Payment is pending verification',
    'payment_verified': 'Payment has been verified successfully',
    'payment_failed': 'Payment verification failed'
  };
  return descriptions[status] || 'Order status updated';
};

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const latestOrder = await this.constructor.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      
      let sequence = 1;
      if (latestOrder && latestOrder.orderNumber) {
        const lastSequence = parseInt(latestOrder.orderNumber.split('-').pop());
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      this.orderNumber = `APX-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
      console.log('Generated order number:', this.orderNumber);
    }
    
    this.updatedAt = Date.now();
    
    // Auto-set dates based on status
    if (this.isModified('orderStatus.currentStatus')) {
      const now = new Date();
      switch(this.orderStatus.currentStatus) {
        case 'confirmed':
          this.confirmedAt = now;
          break;
        case 'processing':
          this.processedAt = now;
          break;
        case 'shipped':
          this.shippedAt = now;
          this.deliveryDetails.shippedAt = now;
          break;
        case 'out_for_delivery':
          this.deliveryDetails.outForDeliveryAt = now;
          break;
        case 'delivered':
          this.deliveredAt = now;
          this.deliveryDetails.actualDeliveryDate = now;
          break;
        case 'cancelled':
          this.cancelledAt = now;
          break;
      }
    }
    
    // Auto-set payment status based on method
    if (this.isNew) {
      if (this.paymentDetails.method === 'wallet' || this.paymentDetails.method === 'card') {
        this.paymentDetails.status = 'completed';
        this.orderStatus.currentStatus = 'confirmed';
        this.paymentDetails.paymentDate = new Date();
        this.paidAt = new Date();
      } else if (this.paymentDetails.method === 'upi') {
        this.paymentDetails.status = 'pending_verification';
        this.orderStatus.currentStatus = 'payment_pending';
      } else if (this.paymentDetails.method === 'cod') {
        this.paymentDetails.status = 'pending';
        this.orderStatus.currentStatus = 'confirmed';
      }
    }
    
    // Update payment date when payment is completed
    if (this.isModified('paymentDetails.status') && this.paymentDetails.status === 'completed') {
      this.paymentDetails.paymentDate = new Date();
      this.paidAt = new Date();
    }
    
    next();
  } catch (error) {
    console.error('Error generating order number:', error);
    next(error);
  }
});

// Update timeline when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus.currentStatus') && this.orderStatus) {
    if (!this.orderStatus.timeline) {
      this.orderStatus.timeline = [];
    }
    
    const lastStatus = this.orderStatus.timeline.length > 0 
      ? this.orderStatus.timeline[this.orderStatus.timeline.length - 1].status 
      : null;
    
    if (lastStatus !== this.orderStatus.currentStatus) {
      this.orderStatus.timeline.push({
        status: this.orderStatus.currentStatus,
        timestamp: new Date(),
        description: this.getStatusDescription(this.orderStatus.currentStatus),
        updatedBy: 'system'
      });
    }
  }
  
  // Update payment status timeline
  if (this.isModified('paymentDetails.status') && this.paymentDetails) {
    if (!this.orderStatus.timeline) {
      this.orderStatus.timeline = [];
    }
    
    const paymentStatusMap = {
      'pending_verification': 'payment_pending',
      'verified': 'payment_verified',
      'rejected': 'payment_failed',
      'requires_verification': 'payment_pending'
    };
    
    const correspondingStatus = paymentStatusMap[this.paymentDetails.status];
    if (correspondingStatus && this.orderStatus.currentStatus !== correspondingStatus) {
      this.orderStatus.currentStatus = correspondingStatus;
      this.orderStatus.timeline.push({
        status: correspondingStatus,
        timestamp: new Date(),
        description: this.getStatusDescription(correspondingStatus),
        updatedBy: 'system'
      });
    }
  }
  
  next();
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ 'orderStatus.currentStatus': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.status': 1 });
orderSchema.index({ 'shippingAddress.pincode': 1 });
orderSchema.index({ 'metadata.commissionRecipients.userId': 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for isPaid
orderSchema.virtual('isPaid').get(function() {
  return this.paymentDetails.status === 'completed';
});

// Virtual for isDelivered
orderSchema.virtual('isDelivered').get(function() {
  return this.orderStatus.currentStatus === 'delivered';
});

// Virtual for isCancelled
orderSchema.virtual('isCancelled').get(function() {
  return this.orderStatus.currentStatus === 'cancelled';
});

// Virtual for formatted address
orderSchema.virtual('formattedAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.address}, ${addr.city}, ${addr.state} ${addr.pincode}, ${addr.country}`;
});

// Method to update status with audit trail
orderSchema.methods.updateStatus = function(newStatus, changedBy = 'system', notes = '') {
  const oldStatus = this.orderStatus.currentStatus;
  
  this.orderStatus.currentStatus = newStatus;
  this.updatedAt = new Date();
  
  // Add to timeline
  this.orderStatus.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    description: this.getStatusDescription(newStatus),
    updatedBy: changedBy
  });
  
  // Add to history
  if (!this.orderStatus.history) {
    this.orderStatus.history = [];
  }
  
  this.orderStatus.history.push({
    status: newStatus,
    changedAt: new Date(),
    notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    changedBy: changedBy
  });
  
  return this.save();
};

// Method to add admin note
orderSchema.methods.addAdminNote = function(note, addedBy, noteType = 'general') {
  if (!this.adminNotes) {
    this.adminNotes = [];
  }
  
  this.adminNotes.push({
    note,
    addedBy,
    addedAt: new Date(),
    noteType
  });
  
  return this.save();
};

// Method to add commission recipient
orderSchema.methods.addCommissionRecipient = function(userId, level, commissionAmount, commissionType = 'purchase', notes = '') {
  if (!this.metadata.commissionRecipients) {
    this.metadata.commissionRecipients = [];
  }
  
  this.metadata.commissionRecipients.push({
    userId,
    level,
    commissionAmount,
    commissionType,
    status: 'pending',
    processedAt: null,
    notes
  });
  
  return this.save();
};

// Method to mark commission as completed
orderSchema.methods.completeCommission = function(userId, notes = '') {
  if (!this.metadata.commissionRecipients) {
    return false;
  }
  
  const recipient = this.metadata.commissionRecipients.find(
    r => r.userId.toString() === userId.toString() && r.status === 'pending'
  );
  
  if (recipient) {
    recipient.status = 'completed';
    recipient.processedAt = new Date();
    recipient.notes = recipient.notes ? `${recipient.notes}; ${notes}` : notes;
    return true;
  }
  
  return false;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;