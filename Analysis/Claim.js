const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  homeownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  insuranceAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  insuranceCompany: {
    name: String,
    policyNumber: String,
    contactInfo: {
      phone: String,
      email: String,
      address: String
    }
  },
  claimNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'denied', 'closed'],
    default: 'draft'
  },
  damageType: {
    type: String,
    enum: ['hail', 'wind', 'water', 'fire', 'other'],
    required: true
  },
  damageDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedDamage: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  approvedAmount: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  deductible: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['assessment_report', 'estimate', 'invoice', 'policy', 'photo', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'denied', 'closed'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  fraudDetectionResult: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    flags: [{
      type: String,
      reason: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    lastChecked: Date
  },
  notes: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
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

// Generate a unique claim number before saving
claimSchema.pre('save', async function(next) {
  if (!this.claimNumber) {
    // Generate a unique claim number (e.g., CLM-YYYY-XXXXXXX)
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    this.claimNumber = `CLM-${year}-${random}`;
    
    // Add initial timeline entry
    if (this.isNew) {
      this.timeline.push({
        status: this.status,
        date: new Date(),
        updatedBy: this.homeownerId,
        notes: 'Claim created'
      });
    }
  }
  next();
});

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
