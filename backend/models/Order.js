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
      enum: ['pending', 'completed', 'failed', 'refunded', 'pending_verification', 'verified', 'rejected','pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'requires_verification'],
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
    refundDate: Date
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
    }
  },

  orderStatus: {
    currentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'payment_pending', 'payment_verified','pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    timeline: [orderStatusSchema]
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
    deliveredBy: String
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
    totalAmount: Number
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
      enum: ['general', 'payment', 'shipping', 'customer', 'vendor'],
      default: 'general'
    }
  }],

  customerNotes: String,
  internalNotes: String,

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
      if (this.paymentDetails.method === 'wallet' || this.paymentDetails.method === 'card') {
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

const Order = mongoose.model('Order', orderSchema);

export default Order;