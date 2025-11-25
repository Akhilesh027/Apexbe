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

// UPI Payment Details Schema
const upiPaymentSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true
  },
  screenshot: {
    type: String, // URL or base64 string
    required: true
  },
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
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verificationNotes: String
});

// Payment Proof Schema
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
  transactionReference: {
    type: String,
    required: true
  },
  upiId: String,
  fileName: String,
  fileSize: Number,
  mimeType: String
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true
  },
  
  // User Information
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

  // Shipping Information
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

  // Enhanced Payment Information
  paymentDetails: {
    method: {
      type: String,
      enum: ['upi', 'card', 'wallet', 'scan', 'cod', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'pending_verification', 'verified', 'rejected'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: String,
    paymentDate: Date,
    
    // UPI Specific Details
    upiDetails: upiPaymentSchema,
    
    // Payment Proof (for UPI, bank transfer, etc.)
    paymentProof: paymentProofSchema,
    
    // Additional Payment Metadata
    gatewayResponse: Object,
    refundAmount: Number,
    refundReason: String,
    refundDate: Date
  },

  // Order Items
  orderItems: [orderItemSchema],

  // Order Summary
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
    }
  },

  // Order Status & Tracking
  orderStatus: {
    currentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'payment_pending', 'payment_verified'],
      default: 'pending'
    },
    timeline: [orderStatusSchema]
  },

  // Delivery Information
  deliveryDetails: {
    expectedDelivery: Date,
    shippingMethod: {
      type: String,
      default: 'Standard Delivery'
    },
    trackingNumber: String,
    carrier: String,
    actualDeliveryDate: Date,
    deliveryProof: String, // Image URL for delivery proof
    deliveredBy: String // Delivery person name/id
  },

  // Vendor Information
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
    totalAmount: Number
  }],

  // Admin Notes
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
      enum: ['general', 'payment', 'shipping', 'customer', 'vendor'],
      default: 'general'
    }
  }],

  // Customer Communication
  customerNotes: String,
  internalNotes: String,

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['cart', 'buy_now', 'subscription'],
      default: 'cart'
    },
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    appVersion: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: Date,
  deliveredAt: Date
});

// Helper method for status descriptions
orderSchema.methods.getStatusDescription = function(status) {
  const descriptions = {
    'pending': 'Order received and being processed',
    'confirmed': 'Order confirmed and payment verified',
    'processing': 'Order is being prepared for shipment',
    'shipped': 'Order has been shipped',
    'delivered': 'Order has been delivered',
    'cancelled': 'Order has been cancelled',
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
      
      // Find the latest order to increment the sequence
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
    
    // Auto-set payment status based on method
    if (this.isNew) {
      if (this.paymentDetails.method === 'cod') {
        this.paymentDetails.status = 'completed';
        this.orderStatus.currentStatus = 'confirmed';
      } else if (this.paymentDetails.method === 'upi') {
        this.paymentDetails.status = 'pending_verification';
        this.orderStatus.currentStatus = 'payment_pending';
      }
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
    // Ensure timeline exists
    if (!this.orderStatus.timeline) {
      this.orderStatus.timeline = [];
    }
    
    // Only add if the status is different from the last one
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
      'rejected': 'payment_failed'
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

// Virtual for formatted order date
orderSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
});

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'paymentDetails.status': 1 });
orderSchema.index({ 'orderStatus.currentStatus': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'vendorOrders.vendorId': 1 });

// Static method to find orders by payment status
orderSchema.statics.findByPaymentStatus = function(status) {
  return this.find({ 'paymentDetails.status': status });
};

// Static method to find orders requiring payment verification
orderSchema.statics.findPendingVerification = function() {
  return this.find({ 
    'paymentDetails.method': 'upi',
    'paymentDetails.status': 'pending_verification'
  });
};

// Instance method to verify UPI payment
orderSchema.methods.verifyUPIPayment = function(adminId, notes = '') {
  if (this.paymentDetails.method !== 'upi') {
    throw new Error('This order does not have UPI payment');
  }
  
  if (!this.paymentDetails.upiDetails) {
    throw new Error('No UPI details found for this order');
  }
  
  this.paymentDetails.status = 'verified';
  this.paymentDetails.upiDetails.verified = true;
  this.paymentDetails.upiDetails.verifiedBy = adminId;
  this.paymentDetails.upiDetails.verifiedAt = new Date();
  this.paymentDetails.upiDetails.verificationNotes = notes;
  this.paymentDetails.paymentDate = new Date();
  
  return this.save();
};

// Instance method to reject UPI payment
orderSchema.methods.rejectUPIPayment = function(adminId, notes = '') {
  if (this.paymentDetails.method !== 'upi') {
    throw new Error('This order does not have UPI payment');
  }
  
  this.paymentDetails.status = 'rejected';
  this.paymentDetails.upiDetails.verificationNotes = notes;
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;