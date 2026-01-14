const express = require('express');
const jwt = require('jsonwebtoken');  
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const { auth, superAdminAuth } = require('../middleware/auth');
const { trackLoginAttempt } = require('../middleware/securityMonitor');
const { logAdminActivity, activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user (SUPERADMIN ONLY)
// @route   POST /api/auth/register
// @access  Private (Super Admin)
router.post('/register', superAdminAuth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user - SUPERADMIN ONLY: Can now specify any role
    const user = await User.create({
      name,
      email,
      password,
      role: req.body.role || 'user', // Superadmin can specify role, defaults to 'user'
      department
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Login user  
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, deviceFingerprint } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Track failed login attempt
      await trackLoginAttempt(email, ipAddress, userAgent, false, null, 'invalid_email');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({ 
        error: 'Email Anda belum diverifikasi. Silakan verifikasi email terlebih dahulu untuk dapat login.',
        requiresEmailVerification: true,
        email: user.email,
        userName: user.name
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Akun Anda tidak aktif. Silakan hubungi Super Admin untuk aktivasi akun.',
        accountInactive: true 
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Track failed login attempt
      await trackLoginAttempt(email, ipAddress, userAgent, false, user._id, 'invalid_password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check for concurrent sessions (max 3 active sessions per user)
    const activeSessions = await DeviceSession.countDocuments({
      userId: user._id,
      isActive: true,
      lastActivity: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Active in last 30 minutes
    });

    // If device fingerprint provided, check for existing device session
    let deviceSession = null;
    if (deviceFingerprint && deviceFingerprint.id) {
      deviceSession = await DeviceSession.findOne({
        userId: user._id,
        deviceId: deviceFingerprint.id,
        isActive: true
      });

      // If device session exists, update it
      if (deviceSession) {
        await deviceSession.updateActivity();
      } else if (activeSessions >= 3) {
        // If no existing device session and max sessions reached, revoke oldest
        const oldestSession = await DeviceSession.findOne({
          userId: user._id,
          isActive: true
        }).sort({ lastActivity: 1 });

        if (oldestSession) {
          await oldestSession.revoke('concurrent_limit');
        }
      }
    } else if (activeSessions >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Maximum concurrent sessions reached. Please logout from other devices first.'
      });
    }

    // Track successful login
    await trackLoginAttempt(email, ipAddress, userAgent, true, user._id);

    // Log login activity
    if (user.role === 'admin' || user.role === 'super_admin') {
      try {
        const AdminActivity = require('../models/AdminActivity');
        await AdminActivity.create({
          adminId: user._id,
          admin: user.name || user.email,
          action: 'User Login',
          resource: 'Authentication',
          location: 'Login System',
          details: {
            loginTime: new Date(),
            userAgent: userAgent,
            ipAddress: ipAddress,
            deviceId: deviceFingerprint?.id || 'unknown'
          },
          risk: 'low',
          ipAddress: ipAddress,
          userAgent: userAgent
        });
      } catch (err) {
        console.error('Failed to log login activity:', err);
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create or update device session if fingerprint provided
    if (deviceFingerprint && deviceFingerprint.id) {
      if (!deviceSession) {
        deviceSession = new DeviceSession({
          userId: user._id,
          deviceId: deviceFingerprint.id,
          deviceFingerprint,
          ipAddress,
          userAgent,
          isActive: true,
          lastActivity: new Date()
        });
        await deviceSession.save();
      }
    }

    // Generate JWT token with device binding
    const tokenPayload = { 
      id: user._id,
      email: user.email,
      role: user.role
    };

    // Add device ID to token if provided
    if (deviceFingerprint && deviceFingerprint.id) {
      tokenPayload.deviceId = deviceFingerprint.id;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      },
      deviceSession: deviceSession ? {
        id: deviceSession._id,
        deviceId: deviceSession.deviceId,
        isNew: !deviceSession.isTrusted
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during token refresh' 
    });
  }
});

// Verify token
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, department, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, department, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;