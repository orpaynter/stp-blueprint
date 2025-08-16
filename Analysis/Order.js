const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  orderType: {
    type: String,
    enum: ['product', 'service', 'mixed'],
    required: true
  },
  items: [{
    type: {
      type: String,
      enum: ['product', 'service'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'items.type'
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  trackingNumber: String,
  carrier: String,
  estimatedDelivery: Date,
  notes: String,
  timeline: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate a unique order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Generate a unique order number (e.g., ORD-YYYY-XXXXXXX)
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    this.orderNumber = `ORD-${year}-${random}`;
    
    // Add initial timeline entry
    if (this.isNew) {
      this.timeline.push({
        status: this.status,
        date: new Date(),
        note: 'Order created'
      });
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
