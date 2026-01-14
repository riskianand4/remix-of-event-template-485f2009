const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceFingerprint: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginLocation: {
    country: String,
    city: String,
    region: String
  },
  isTrusted: {
    type: Boolean,
    default: false
  },
  trustedAt: {
    type: Date
  },
  revokedAt: {
    type: Date
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedReason: {
    type: String,
    enum: ['manual', 'suspicious_activity', 'concurrent_limit', 'security_violation', 'expired']
  }
}, {
  timestamps: true
});

// Compound indexes for performance
deviceSessionSchema.index({ userId: 1, isActive: 1 });
deviceSessionSchema.index({ deviceId: 1, userId: 1 });
deviceSessionSchema.index({ ipAddress: 1, createdAt: -1 });
deviceSessionSchema.index({ lastActivity: -1 });

// TTL index to auto-delete inactive sessions after 30 days
deviceSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 2592000 });

// Update last activity
deviceSessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Mark session as trusted
deviceSessionSchema.methods.markTrusted = function(trustedBy) {
  this.isTrusted = true;
  this.trustedAt = new Date();
  return this.save();
};

// Revoke session
deviceSessionSchema.methods.revoke = function(reason, revokedBy) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  if (revokedBy) {
    this.revokedBy = revokedBy;
  }
  return this.save();
};

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);