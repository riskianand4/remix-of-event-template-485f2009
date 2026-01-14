const mongoose = require('mongoose');

const psbOrderSchema = new mongoose.Schema({
  no: {
    type: Number,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  cluster: {
    type: String,
    required: true
  },
  sto: {
    type: String,
    required: true
  },
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  package: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Accepted', 'Survey', 'Installation', 'Completed', 'Cancelled', 'Failed'],
    default: 'Pending'
  },
  technician: {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician'
    },
    name: String,
    assignedAt: Date,
    acceptedAt: Date,
    territory: String
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'Accepted', 'Survey', 'Installation', 'Completed', 'Cancelled', 'Failed'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number
    }
  }],
  assignedAt: {
    type: Date
  },
  fieldWork: {
    surveyCompleted: {
      type: Boolean,
      default: false
    },
    surveyDate: Date,
    surveyPhotos: [{
      filename: String,
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    installationStarted: {
      type: Boolean,
      default: false
    },
    installationDate: Date,
    installationPhotos: [{
      filename: String,
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    customerSignature: {
      filename: String,
      url: String,
      signedAt: Date
    }
  },
  fieldReadiness: {
    odpStatus: {
      type: String,
      enum: ['available', 'full', 'damaged', 'not_available'],
      default: 'available'
    },
    towerDistance: {
      type: Number // in meters
    },
    materialCheck: {
      type: String,
      enum: ['complete', 'partial', 'missing'],
      default: 'complete'
    },
    signalStrength: {
      type: Number // in dBm
    }
  },
  installationDetails: {
    installedAt: Date,
    ontSerialNumber: String,
    cableLength: Number,
    installationType: {
      type: String,
      enum: ['aerial', 'underground', 'indoor']
    },
    signalStrength: {
      type: Number // in dBm after installation
    },
    testResults: {
      pingTest: {
        type: Boolean,
        default: false
      },
      speedTest: {
        download: Number, // Mbps
        upload: Number,   // Mbps
        latency: Number   // ms
      },
      configurationTest: {
        type: Boolean,
        default: false
      }
    },
    qualityCheck: {
      cableManagement: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      signalQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      customerSatisfaction: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        feedback: String
      }
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: {
    type: String
  },
  technicianStatus: {
    type: String,
    enum: ['pending', 'failed', 'complete'],
    default: null
  },
  technicianStatusReason: {
    type: String,
    default: ''
  },
  technicianStatusUpdatedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
psbOrderSchema.index({ cluster: 1, sto: 1 });
psbOrderSchema.index({ status: 1 });
psbOrderSchema.index({ date: -1 });

module.exports = mongoose.model('PSBOrder', psbOrderSchema);