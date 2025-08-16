const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  claimId: {
    type: Schema.Types.ObjectId,
    ref: 'Claim'
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  payerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer is required']
  },
  payeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payee is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'CAD', 'EUR', 'GBP']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'check', 'cash', 'insurance', 'manual', 'other'],
    default: 'bank_transfer'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  notes: String,
  externalReference: String, // Reference to external payment system (e.g., Stripe payment ID)
  processingFee: Number,
  receiptUrl: String,
  processedAt: Date,
  failureReason: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: Date
});

// Add index for faster queries
PaymentSchema.index({ projectId: 1 });
PaymentSchema.index({ claimId: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ payerId: 1 });
PaymentSchema.index({ payeeId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: 1 });

// Pre-save middleware to update timestamps
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for payment age in days
PaymentSchema.virtual('ageInDays').get(function() {
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if payment is completed
PaymentSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

// Method to check if payment is pending
PaymentSchema.methods.isPending = function() {
  return this.status === 'pending' || this.status === 'processing';
};

// Method to check if payment has failed
PaymentSchema.methods.hasFailed = function() {
  return this.status === 'failed';
};

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
