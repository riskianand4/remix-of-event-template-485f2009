const mongoose = require('mongoose');

const interruptionReportSchema = new mongoose.Schema({
  // Auto-increment number
  no: {
    type: Number,
    unique: true
  },
  
  // Data dari PSB Activation (auto-fill)
  serviceNumber: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  
  // Data gangguan (user input)
  interruptionType: {
    type: String,
    required: true
  },
  
  ticketStatus: {
    type: String,
    default: 'Open',
    required: true,
    index: true,
    // REMOVED enum restriction - allow any string value for hybrid input
    validate: {
      validator: function(v) {
        return v && typeof v === 'string' && v.trim().length > 0;
      },
      message: 'Ticket status cannot be empty'
    }
  },
  
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Penyebab dan tindakan
  interruptionCause: {
    type: String
  },
  
  interruptionAction: {
    type: String
  },
  
  // Time tracking
  openTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  closeTime: {
    type: Date
  },
  
  // Calculated fields
  handlingDuration: {
    type: Number, // in hours
    default: 0
  },
  
  ttr: {
    type: Number, // Target time (jam) - default 8 jam
    default: 8
  },
  
  // Performance indicator - manual input allowed
  performance: {
    type: String
    // No default value - user must input manually
    // No enum - allow any string including custom values like "-22323.%"
  },
  
  // Audit fields
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

// Auto-increment no
interruptionReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastReport = await this.constructor.findOne().sort({ no: -1 });
      this.no = lastReport ? lastReport.no + 1 : 1;
    } catch (error) {
      console.error('Error generating auto-increment no:', error);
    }
  }
  next();
});

// Calculate handling duration when closeTime is set
// Only auto-calculate performance if not manually provided
interruptionReportSchema.pre('save', function(next) {
  // Validate closeTime must be after openTime
  if (this.closeTime && this.openTime && this.closeTime <= this.openTime) {
    return next(new Error('Close time must be after open time'));
  }
  
  if (this.closeTime && this.openTime) {
    const diff = this.closeTime - this.openTime;
    this.handlingDuration = parseFloat((diff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
    
    // Only auto-calculate performance if field is empty (user hasn't provided manual input)
    if (!this.performance || this.performance.trim() === '') {
      if (this.handlingDuration <= this.ttr * 0.5) {
        this.performance = 'Baik';
      } else if (this.handlingDuration <= this.ttr) {
        this.performance = 'Cukup';
      } else {
        this.performance = 'Buruk';
      }
    }
  }
  next();
});

// Indexes
interruptionReportSchema.index({ createdAt: -1 });
interruptionReportSchema.index({ serviceNumber: 1 });
interruptionReportSchema.index({ ticketStatus: 1 });
interruptionReportSchema.index({ technician: 1 });
interruptionReportSchema.index({ openTime: -1 });

module.exports = mongoose.model('InterruptionReport', interruptionReportSchema);
