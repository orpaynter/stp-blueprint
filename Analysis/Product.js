const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['roofing_materials', 'tools', 'safety_equipment', 'accessories', 'other'],
    required: true
  },
  subcategory: String,
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  discountPrice: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    validUntil: Date
  },
  unit: {
    type: String,
    enum: ['each', 'bundle', 'square', 'roll', 'box', 'pallet', 'lb', 'kg', 'ft', 'm'],
    default: 'each'
  },
  inventory: {
    quantity: {
      type: Number,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    unlimited: {
      type: Boolean,
      default: false
    }
  },
  specifications: [{
    name: String,
    value: String
  }],
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
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

// Index for text search
productSchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text'
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
