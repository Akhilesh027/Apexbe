import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
    enum: ['pending', 'confirmed', 'PROCESSING', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: String
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

  // Payment Information
  paymentDetails: {
    method: {
      type: String,
      enum: ['upi', 'card', 'wallet', 'scan', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: String,
    paymentDate: Date
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
    }
  },

  // Order Status & Tracking
  orderStatus: {
    currentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'PROCESSING', 'shipped', 'delivered', 'cancelled', 'refunded'],
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
    actualDeliveryDate: Date
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['cart', 'buy_now'],
      default: 'cart'
    },
    ipAddress: String,
    userAgent: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
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
    'refunded': 'Order has been refunded'
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
        const orderNumberParts = latestOrder.orderNumber.split('-');
        if (orderNumberParts.length === 3) {
          const lastSequence = parseInt(orderNumberParts[2]);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }
      
      this.orderNumber = `ORD-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
      console.log('Generated order number:', this.orderNumber);
    }
    
    this.updatedAt = Date.now();
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
    
    this.orderStatus.timeline.push({
      status: this.orderStatus.currentStatus,
      timestamp: new Date(),
      description: this.getStatusDescription(this.orderStatus.currentStatus)
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;