const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  claimId: {
    type: Schema.Types.ObjectId,
    ref: 'Claim'
  },
  issuerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issuer is required']
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
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
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unit: {
      type: String,
      default: 'unit'
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be non-negative']
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required']
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required']
  },
  tax: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'unpaid', 'payment_pending', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  notes: String,
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paidAt: Date,
  sentAt: Date,
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ projectId: 1 });
InvoiceSchema.index({ claimId: 1 });
InvoiceSchema.index({ issuerId: 1 });
InvoiceSchema.index({ recipientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdAt: 1 });

// Pre-save middleware to update timestamps
InvoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to calculate totals if not provided
InvoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    // Calculate item totals if not provided
    this.items.forEach(item => {
      if (!item.totalPrice) {
        item.totalPrice = item.quantity * item.unitPrice;
      }
      if (!item.taxAmount && item.taxRate) {
        item.taxAmount = item.totalPrice * (item.taxRate / 100);
      }
    });
    
    // Calculate subtotal if not provided
    if (!this.subtotal) {
      this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    
    // Calculate tax if not provided
    if (!this.tax) {
      this.tax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    }
    
    // Calculate total amount if not provided
    if (!this.amount) {
      this.amount = this.subtotal + this.tax;
    }
  }
  
  next();
});

// Virtual for days until due
InvoiceSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  return Math.ceil((this.dueDate - today) / (1000 * 60 * 60 * 24));
});

// Virtual for days overdue
InvoiceSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return 0;
  }
  
  const today = new Date();
  if (today > this.dueDate) {
    return Math.ceil((today - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
});

// Method to check if invoice is overdue
InvoiceSchema.methods.isOverdue = function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  
  const today = new Date();
  return today > this.dueDate;
};

// Method to check if invoice is paid
InvoiceSchema.methods.isPaid = function() {
  return this.status === 'paid';
};

const Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = Invoice;
