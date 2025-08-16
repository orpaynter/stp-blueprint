const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssessmentSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assessmentType: {
    type: String,
    enum: ['initial', 'damage', 'insurance', 'follow_up', 'final'],
    required: [true, 'Assessment type is required']
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'analyzed', 'estimated', 'claimed', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  insuranceAgentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [{
    url: String,
    key: String,
    description: String,
    category: {
      type: String,
      enum: ['exterior', 'interior', 'roof', 'damage', 'repair', 'other']
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date,
    metadata: {
      width: Number,
      height: Number,
      size: Number,
      format: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    }
  }],
  damageAnalysis: {
    damageType: {
      type: String,
      enum: ['hail', 'wind', 'water', 'fire', 'structural', 'other']
    },
    damageExtent: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'critical']
    },
    affectedAreas: [String],
    detectedDamage: [{
      type: String,
      location: String,
      severity: String,
      description: String,
      imageIndex: Number,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      confidence: Number
    }],
    totalDamageArea: Number, // Square feet
    analysisDate: Date,
    analyzedBy: {
      type: String,
      enum: ['ai', 'human', 'hybrid']
    },
    confidenceScore: Number,
    notes: String
  },
  costEstimate: {
    totalCost: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    laborCost: Number,
    materialCost: Number,
    otherCosts: Number,
    lineItems: [{
      description: String,
      quantity: Number,
      unit: String,
      unitPrice: Number,
      totalPrice: Number,
      category: String
    }],
    regionalAdjustment: Number,
    estimateDate: Date,
    validUntil: Date,
    notes: String
  },
  notes: String,
  claimId: {
    type: Schema.Types.ObjectId,
    ref: 'Claim'
  },
  report: {
    url: String,
    format: String,
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    generatedAt: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Add index for faster queries
AssessmentSchema.index({ projectId: 1 });
AssessmentSchema.index({ status: 1 });
AssessmentSchema.index({ assessmentDate: 1 });
AssessmentSchema.index({ 'damageAnalysis.damageType': 1 });

// Pre-save middleware to update timestamps
AssessmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for assessment age in days
AssessmentSchema.virtual('ageInDays').get(function() {
  return Math.ceil((Date.now() - this.assessmentDate) / (1000 * 60 * 60 * 24));
});

// Method to check if assessment has damage analysis
AssessmentSchema.methods.hasDamageAnalysis = function() {
  return !!this.damageAnalysis && !!this.damageAnalysis.damageType;
};

// Method to check if assessment has cost estimate
AssessmentSchema.methods.hasCostEstimate = function() {
  return !!this.costEstimate && !!this.costEstimate.totalCost;
};

// Method to check if assessment has claim
AssessmentSchema.methods.hasClaim = function() {
  return !!this.claimId;
};

// Method to check if assessment has report
AssessmentSchema.methods.hasReport = function() {
  return !!this.report && !!this.report.url;
};

const Assessment = mongoose.model('Assessment', AssessmentSchema);

module.exports = Assessment;
