const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'USA'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  propertyType: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'other'],
    default: 'residential'
  },
  roofType: {
    type: String,
    enum: ['asphalt', 'metal', 'tile', 'slate', 'flat', 'other']
  },
  roofArea: {
    type: Number, // in square feet
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  budget: {
    type: Number
  },
  actualCost: {
    type: Number
  },
  materials: [{
    name: String,
    quantity: Number,
    unit: String,
    cost: Number,
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  laborCost: {
    type: Number
  },
  images: [{
    url: String,
    caption: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    url: String,
    name: String,
    type: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  weather: {
    forecast: [{
      date: Date,
      condition: String,
      temperature: Number,
      precipitation: Number,
      windSpeed: Number
    }],
    lastUpdated: Date
  },
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

// Index for geospatial queries
projectSchema.index({ 'address.coordinates': '2dsphere' });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
