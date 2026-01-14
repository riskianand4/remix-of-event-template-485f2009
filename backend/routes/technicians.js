const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Technician = require('../models/Technician');
const PSBOrder = require('../models/PSBOrder');
const { auth, superAdminAuth, technicianAuth, requireRole } = require('../middleware/auth');

// Get all technicians (Super Admin only)
router.get('/', requireRole(['super_admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cluster,
      territory,
      isAvailable,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    // Apply filters
    if (cluster) query.cluster = cluster;
    if (territory) query.territory = { $in: [territory] };
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const technicians = await Technician.find(query)
      .populate('userId', 'name email phone avatar')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Technician.countDocuments(query);

    // Apply search filter if provided
    let filteredTechnicians = technicians;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredTechnicians = technicians.filter(tech => 
        tech.userId.name.match(searchRegex) ||
        tech.employeeId.match(searchRegex) ||
        tech.cluster.match(searchRegex)
      );
    }

    res.json({
      success: true,
      data: filteredTechnicians,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch technicians'
    });
  }
});

// Get technician by ID
router.get('/:id', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('userId', 'name email phone avatar department position');

    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }

    // Technicians can only view their own profile
    if (req.user.role === 'teknisi' && technician.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch technician'
    });
  }
});

// Create new technician (Super Admin only)
router.post('/', superAdminAuth, async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      cluster,
      skills,
      certification,
      territory,
      workingHours,
      equipment,
      emergencyContact,
      notes
    } = req.body;

    // Validate required fields
    if (!userId || !employeeId || !cluster || !skills || !territory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if user exists and is a technician
    const user = await User.findById(userId);
    if (!user || user.role !== 'teknisi') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user or user is not a technician'
      });
    }

    // Check if technician profile already exists for this user
    const existingTechnician = await Technician.findOne({ userId });
    if (existingTechnician) {
      return res.status(409).json({
        success: false,
        error: 'Technician profile already exists for this user'
      });
    }

    // Check if employee ID is unique
    const existingEmployeeId = await Technician.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }

    const technician = new Technician({
      userId,
      employeeId,
      cluster,
      skills,
      certification,
      territory,
      workingHours,
      equipment,
      emergencyContact,
      notes
    });

    await technician.save();

    // Update user's technicianInfo
    await User.findByIdAndUpdate(userId, {
      'technicianInfo.employeeId': employeeId,
      'technicianInfo.cluster': cluster,
      'technicianInfo.skills': skills,
      'technicianInfo.territory': territory
    });

    const populatedTechnician = await Technician.findById(technician._id)
      .populate('userId', 'name email phone avatar');

    res.status(201).json({
      success: true,
      data: populatedTechnician,
      message: 'Technician created successfully'
    });
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create technician'
    });
  }
});

// Update technician (Super Admin or own profile)
router.put('/:id', auth, async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }

    // Check authorization
    const isOwnProfile = technician.userId.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';
    
    if (!isOwnProfile && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Restrict what technicians can update about their own profile
    let updateData = req.body;
    if (req.user.role === 'teknisi' && !isSuperAdmin) {
      // Technicians can only update certain fields
      updateData = {
        currentLocation: req.body.currentLocation,
        isAvailable: req.body.isAvailable,
        notes: req.body.notes,
        emergencyContact: req.body.emergencyContact
      };
    }

    const updatedTechnician = await Technician.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone avatar');

    res.json({
      success: true,
      data: updatedTechnician,
      message: 'Technician updated successfully'
    });
  } catch (error) {
    console.error('Error updating technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update technician'
    });
  }
});

// Delete/deactivate technician (Super Admin only)
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }

    // Check for active assignments
    const activeAssignments = await PSBOrder.countDocuments({
      'technician.technicianId': req.params.id,
      status: { $in: ['Assigned', 'Accepted', 'Survey', 'Installation'] }
    });

    if (activeAssignments > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete technician with ${activeAssignments} active assignments`
      });
    }

    // Soft delete - set isActive to false
    await Technician.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Technician deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete technician'
    });
  }
});

// Get available technicians for cluster (Super Admin only)
router.get('/available/:cluster', superAdminAuth, async (req, res) => {
  try {
    const { cluster } = req.params;
    
    const technicians = await Technician.findAvailableByCluster(cluster);
    
    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('Error fetching available technicians:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available technicians'
    });
  }
});

// Update technician location (Technician only)
router.patch('/:id/location', technicianAuth, async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }

    // Check if updating own location
    if (technician.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Can only update own location'
      });
    }

    technician.currentLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      updatedAt: new Date()
    };

    await technician.save();

    res.json({
      success: true,
      data: technician.currentLocation,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

// Get technician performance analytics (Super Admin or own profile)
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('userId', 'name email');

    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }

    // Check authorization
    const isOwnProfile = technician.userId._id.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';
    
    if (!isOwnProfile && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update performance metrics
    await technician.updatePerformanceMetrics();

    // Get detailed analytics
    const assignments = await PSBOrder.find({
      'technician.technicianId': req.params.id
    }).sort({ createdAt: -1 });

    const analytics = {
      performance: technician.performance,
      completionRate: technician.completionRate,
      recentAssignments: assignments.slice(0, 10),
      monthlyStats: {},
      statusBredown: {}
    };

    // Calculate monthly stats
    const monthlyStats = {};
    assignments.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { total: 0, completed: 0 };
      }
      monthlyStats[month].total++;
      if (order.status === 'Completed') {
        monthlyStats[month].completed++;
      }
    });
    analytics.monthlyStats = monthlyStats;

    // Calculate status breakdown
    const statusBreakdown = {};
    assignments.forEach(order => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });
    analytics.statusBredown = statusBreakdown;

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching technician analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;