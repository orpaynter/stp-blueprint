const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClaimSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  homeownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Homeowner ID is required']
  },
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Contractor ID is required']
  },
  insuranceAgentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  policyNumber: {
    type: String,
    trim: true
  },
  damageType: {
    type: String,
    enum: ['hail', 'wind', 'water', 'fire', 'structural', 'other'],
    required: [true, 'Damage type is required']
  },
  damageExtent: {
    type: String,
    enum: ['minor', 'moderate', 'severe', 'critical'],
    required: [true, 'Damage extent is required']
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required']
  },
  approvedAmount: {
    type: Number
  },
  description: {
    type: String,
    trim: true
  },
  incidentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: [
      'pending', 
      'verified', 
      'approved', 
      'rejected', 
      'payment_initiated', 
      'payment_completed', 
      'cancelled'
    ],
    default: 'pending'
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  documents: [{
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['policy', 'damage_evidence', 'estimate', 'invoice', 'contract', 'other']
    },
    fileUrl: String,
    fileKey: String,
    fileType: String,
    fileSize: Number,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  fraudAnalysis: {
    riskScore: Number,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    anomalies: [{
      type: String,
      description: String,
      severity: String,
      confidence: Number
    }],
    recommendations: [String],
    analysisDate: Date,
    notes: String
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'pending', 
        'verified', 
        'approved', 
        'rejected', 
        'payment_initiated', 
        'payment_completed', 
        'cancelled'
      ]
    },
    date: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  notes: String,
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
  updatedAt: Date,
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Add index for faster queries
ClaimSchema.index({ projectId: 1 });
ClaimSchema.index({ assessmentId: 1 });
ClaimSchema.index({ homeownerId: 1 });
ClaimSchema.index({ contractorId: 1 });
ClaimSchema.index({ insuranceAgentId: 1 });
ClaimSchema.index({ status: 1 });
ClaimSchema.index({ submittedAt: 1 });

// Pre-save middleware to update timestamps
ClaimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for claim age in days
ClaimSchema.virtual('ageInDays').get(function() {
  return Math.ceil((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Method to check if claim is verified
ClaimSchema.methods.isVerified = function() {
  return this.status === 'verified' || this.status === 'approved' || 
         this.status === 'payment_initiated' || this.status === 'payment_completed';
};

// Method to check if claim is approved
ClaimSchema.methods.isApproved = function() {
  return this.status === 'approved' || 
         this.status === 'payment_initiated' || 
         this.status === 'payment_completed';
};

// Method to check if claim has payment
ClaimSchema.methods.hasPayment = function() {
  return !!this.paymentId;
};

// Method to check if claim has fraud analysis
ClaimSchema.methods.hasFraudAnalysis = function() {
  return !!this.fraudAnalysis && !!this.fraudAnalysis.riskScore;
};

const Claim = mongoose.model('Claim', ClaimSchema);

module.exports = Claim;
