const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  cluster: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    type: String,
    enum: ['survey', 'installation', 'maintenance', 'troubleshooting', 'ont_config'],
    required: true
  }],
  certification: {
    type: String,
    trim: true
  },
  territory: [{
    type: String,
    required: true,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    accuracy: {
      type: Number // GPS accuracy in meters
    }
  },
  workingHours: {
    start: {
      type: String, // "08:00"
      default: "08:00"
    },
    end: {
      type: String, // "17:00"
      default: "17:00"
    },
    workingDays: [{
      type: Number, // 0-6 (Sunday-Saturday)
      min: 0,
      max: 6
    }]
  },
  performance: {
    totalAssignments: {
      type: Number,
      default: 0
    },
    completedAssignments: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number, // in hours
      default: 0
    },
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    lastPerformanceUpdate: {
      type: Date,
      default: Date.now
    }
  },
  equipment: [{
    name: String,
    serialNumber: String,
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'damaged'],
      default: 'available'
    }
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
technicianSchema.index({ cluster: 1 });
technicianSchema.index({ isAvailable: 1 });
technicianSchema.index({ territory: 1 });
technicianSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });

// Virtual for completion rate
technicianSchema.virtual('completionRate').get(function() {
  if (this.performance.totalAssignments === 0) return 0;
  return (this.performance.completedAssignments / this.performance.totalAssignments * 100).toFixed(1);
});

// Method to update performance metrics
technicianSchema.methods.updatePerformanceMetrics = async function() {
  const PSBOrder = mongoose.model('PSBOrder');
  
  const assignments = await PSBOrder.find({ 
    'technician.technicianId': this._id 
  });
  
  const completed = assignments.filter(order => 
    order.status === 'Completed'
  );
  
  this.performance.totalAssignments = assignments.length;
  this.performance.completedAssignments = completed.length;
  this.performance.lastPerformanceUpdate = new Date();
  
  // Calculate average completion time for completed orders
  if (completed.length > 0) {
    const totalTime = completed.reduce((sum, order) => {
      if (order.assignedAt && order.updatedAt) {
        const timeDiff = order.updatedAt - order.assignedAt;
        return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
      }
      return sum;
    }, 0);
    
    this.performance.averageCompletionTime = (totalTime / completed.length).toFixed(1);
  }
  
  return this.save();
};

// Method to check if technician is available for assignment
technicianSchema.methods.isAvailableForAssignment = function() {
  if (!this.isActive || !this.isAvailable) return false;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  
  // Check working days
  if (!this.workingHours.workingDays.includes(currentDay)) {
    return false;
  }
  
  // Check working hours
  if (currentTime < this.workingHours.start || currentTime > this.workingHours.end) {
    return false;
  }
  
  return true;
};

// Static method to find available technicians by cluster
technicianSchema.statics.findAvailableByCluster = function(cluster) {
  return this.find({
    cluster: cluster,
    isActive: true,
    isAvailable: true
  }).populate('userId', 'name email phone');
};

// Static method to find technicians by territory
technicianSchema.statics.findByTerritory = function(territory) {
  return this.find({
    territory: { $in: [territory] },
    isActive: true
  }).populate('userId', 'name email phone');
};

module.exports = mongoose.model('Technician', technicianSchema);