const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
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
    enum: ['roof_installation', 'roof_repair', 'inspection', 'maintenance', 'consultation', 'other'],
    required: true
  },
  providerId: {
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
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'square_foot', 'quote_based'],
      default: 'fixed'
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
  duration: {
    estimated: {
      type: Number, // in hours
      required: true
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  availability: {
    schedule: [{
      dayOfWeek: {
        type: Number, // 0 = Sunday, 6 = Saturday
        required: true
      },
      startTime: String, // HH:MM format
      endTime: String // HH:MM format
    }],
    exceptions: [{
      date: Date,
      available: Boolean,
      startTime: String,
      endTime: String
    }]
  },
  serviceArea: {
    radius: Number, // in miles
    zipCodes: [String],
    states: [String]
  },
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
  requirements: [String],
  inclusions: [String],
  exclusions: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'booked'],
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
serviceSchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text'
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
