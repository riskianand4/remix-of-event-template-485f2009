const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Critical: No fallback for JWT_SECRET - fail fast if not configured
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // If token has device ID, validate device session
    if (process.env.ENABLE_DEVICE_SESSION === 'true' && decoded.deviceId) {
      const deviceSession = await DeviceSession.findOne({
        userId: user._id,
        deviceId: decoded.deviceId,
        isActive: true
      });

      if (!deviceSession) {
        return res.status(401).json({ 
          message: 'Device session invalid or expired',
          code: 'DEVICE_SESSION_INVALID'
        });
      }

      // Update device activity
      await deviceSession.updateActivity();
      req.deviceSession = deviceSession;
    }

    req.user = user;
    next();
  } catch (error) {
    console.warn('Token validation failed:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      error: error.message
    });
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// adminAuth removed - admin role deleted

const superAdminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'super_admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Super admin privileges required.' 
        });
      }
      next();
    });
    } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

const technicianAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'teknisi') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Technician privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

const csAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'cs') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. CS privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

const normalizeRole = (role) => {
  if (role === 'superadmin') return 'super_admin';
  if (role === 'teknisi') return 'teknisi';
  if (role === 'cs') return 'cs';
  return role;
};

// Generic role-based authorization middleware
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      await auth(req, res, () => {
        const userRole = normalizeRole(req.user.role);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
        
        if (!normalizedAllowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied. Insufficient privileges.' 
          });
        }
        next();
      });
    } catch (error) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication failed' 
      });
    }
  };
};

module.exports = { auth, superAdminAuth, technicianAuth, csAuth, requireRole };