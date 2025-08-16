const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'pending_review'],
    default: 'pending'
  },
  assessedBy: {
    type: String,
    enum: ['ai', 'human', 'hybrid'],
    default: 'ai'
  },
  assessorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  detections: [{
    type: {
      type: String,
      enum: ['missing_shingle', 'crack', 'water_damage', 'hail_damage', 'debris', 'other'],
      required: true
    },
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: String
  }],
  metadata: {
    deviceInfo: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    captureDate: Date,
    weather: {
      condition: String,
      temperature: Number
    }
  },
  recommendations: [{
    type: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedCost: {
      min: Number,
      max: Number
    }
  }],
  reviewHistory: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'modified']
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
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

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
