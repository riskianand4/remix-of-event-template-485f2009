const mongoose = require('mongoose');

const psbActivationSchema = new mongoose.Schema({
  psbOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PSBOrder',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  serviceNumber: {
    type: String,
    required: true,
    unique: true
  },
  pppoeUsername: {
    type: String,
    required: true,
    unique: true
  },
  pppoePassword: {
    type: String,
    required: true
  },
  oltName: {
    type: String,
    required: true
  },
  ponPort: {
    type: String,
    required: true
  },
  onuNumber: {
    type: String,
    required: true
  },
  signalLevel: {
    type: Number,
    required: true,
    min: -50,
    max: 0
  },
  activationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  ontStatus: {
    type: String,
    enum: ['configured', 'pending', 'failed'],
    default: 'pending'
  },
  cluster: {
    type: String,
    required: true
  },
  technician: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  installationReport: {
    speedTest: {
      download: Number,
      upload: Number,
      ping: Number
    },
    device: {
      ontType: String,
      ontSerial: String,
      routerType: String,
      routerSerial: String,
      stbId: String
    },
    datek: {
      area: String,
      odc: String,
      odp: String,
      port: String,
      dc: String,
      soc: String
    },
    serviceType: {
      type: String,
      enum: ['pasang_baru', 'cabut', 'upgrade', 'downgrade', 'pda']
    },
    packageSpeed: {
      type: Number,
      enum: [20, 30, 40, 50, 100]
    },
    fastelNumber: String,
    contactPerson: String,
    signatures: {
      technician: String, // base64 image
      customer: String,   // base64 image
      signedAt: Date
    },
    reportGenerated: {
      type: Boolean,
      default: false
    },
    reportGeneratedAt: Date
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

psbActivationSchema.index({ psbOrderId: 1 });
psbActivationSchema.index({ cluster: 1 });
psbActivationSchema.index({ oltName: 1 });
psbActivationSchema.index({ ontStatus: 1 });
psbActivationSchema.index({ activationDate: -1 });
psbActivationSchema.index({ serviceNumber: 1 });

module.exports = mongoose.model('PSBActivation', psbActivationSchema);