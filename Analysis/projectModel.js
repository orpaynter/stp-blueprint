const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  homeownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Homeowner is required']
  },
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Contractor is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  projectType: {
    type: String,
    enum: ['roof_replacement', 'roof_repair', 'new_construction', 'inspection', 'maintenance', 'other'],
    required: [true, 'Project type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedStartDate: {
    type: Date,
    required: [true, 'Estimated start date is required']
  },
  estimatedEndDate: {
    type: Date,
    required: [true, 'Estimated end date is required']
  },
  actualStartDate: Date,
  actualEndDate: Date,
  budget: {
    amount: {
      type: Number,
      required: [true, 'Budget amount is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    breakdown: [{
      category: String,
      amount: Number,
      description: String
    }]
  },
  timeline: [{
    event: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  team: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['project_manager', 'foreman', 'worker', 'inspector', 'consultant', 'other']
    },
    permissions: [String]
  }],
  materials: [{
    name: String,
    description: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    totalPrice: Number,
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'ordered', 'shipped', 'delivered', 'returned', 'cancelled'],
      default: 'pending'
    },
    deliveryDate: Date,
    notes: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: Date,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: Date
  }],
  documents: [{
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['contract', 'permit', 'invoice', 'assessment', 'insurance', 'photo', 'other']
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
  schedule: [{
    task: String,
    description: String,
    startDate: Date,
    endDate: Date,
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'],
      default: 'pending'
    },
    dependencies: [String], // IDs of tasks that must be completed before this one
    weatherSensitive: {
      type: Boolean,
      default: false
    }
  }],
  communications: [{
    message: String,
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentAt: Date,
    readBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  issues: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: Date,
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolution: String
  }],
  assessments: [{
    type: Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  claims: [{
    type: Schema.Types.ObjectId,
    ref: 'Claim'
  }],
  invoices: [{
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  statusReports: [{
    date: Date,
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: Number, // Percentage complete
    status: String,
    daysElapsed: Number,
    daysRemaining: Number,
    totalDays: Number,
    completedTasks: Number,
    totalTasks: Number,
    notes: String,
    issues: [{
      title: String,
      description: String,
      priority: String,
      status: String
    }],
    upcomingTasks: [{
      task: String,
      startDate: Date,
      endDate: Date
    }]
  }],
  scope: {
    roofArea: Number, // Square feet
    roofPitch: String,
    roofType: String,
    numberOfStories: Number,
    existingMaterial: String,
    newMaterial: String,
    additionalFeatures: [String],
    specialRequirements: String
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
ProjectSchema.index({ homeownerId: 1 });
ProjectSchema.index({ contractorId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ 'address.zipCode': 1 });
ProjectSchema.index({ estimatedStartDate: 1, estimatedEndDate: 1 });

// Pre-save middleware to update timestamps
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for project duration in days
ProjectSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.estimatedEndDate - this.estimatedStartDate) / (1000 * 60 * 60 * 24));
});

// Virtual for project progress percentage
ProjectSchema.virtual('progressPercentage').get(function() {
  if (!this.schedule || this.schedule.length === 0) return 0;
  
  const completedTasks = this.schedule.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / this.schedule.length) * 100);
});

// Virtual for days remaining
ProjectSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const endDate = new Date(this.estimatedEndDate);
  return Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
});

// Method to check if project is overdue
ProjectSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  
  const today = new Date();
  return today > this.estimatedEndDate;
};

// Method to check if user is part of project team
ProjectSchema.methods.isTeamMember = function(userId) {
  if (this.contractorId.toString() === userId.toString()) return true;
  if (this.homeownerId.toString() === userId.toString()) return true;
  
  return this.team.some(member => member.userId.toString() === userId.toString());
};

// Method to get team member by ID
ProjectSchema.methods.getTeamMember = function(userId) {
  return this.team.find(member => member.userId.toString() === userId.toString());
};

// Method to check if user has specific permission
ProjectSchema.methods.hasPermission = function(userId, permission) {
  const member = this.getTeamMember(userId);
  if (!member) return false;
  
  return member.permissions.includes(permission);
};

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
