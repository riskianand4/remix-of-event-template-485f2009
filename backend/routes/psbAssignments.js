const express = require('express');
const router = express.Router();
const PSBOrder = require('../models/PSBOrder');
const Technician = require('../models/Technician');
const { auth, superAdminAuth, technicianAuth, requireRole } = require('../middleware/auth');

// Assign technician to PSB order (Super Admin only)
router.post('/:orderId/assign', superAdminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { technicianId, notes } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        error: 'Technician ID is required'
      });
    }

    const order = await PSBOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only assign technician to pending orders'
      });
    }

    const technician = await Technician.findById(technicianId)
      .populate('userId', 'name email phone');

    if (!technician || !technician.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found or inactive'
      });
    }

    // Check if technician is available
    if (!technician.isAvailableForAssignment()) {
      return res.status(400).json({
        success: false,
        error: 'Technician is not available for assignment'
      });
    }

    // Update order with technician assignment
    const now = new Date();
    order.technician = {
      technicianId: technician._id,
      name: technician.userId.name,
      assignedAt: now,
      territory: order.cluster
    };
    order.status = 'Assigned';
    order.assignedAt = now;
    order.updatedBy = req.user._id;
    
    order.statusHistory.push({
      status: 'Assigned',
      changedBy: req.user._id,
      timestamp: now,
      notes: notes || `Assigned to ${technician.userId.name}`
    });

    await order.save();

    const populatedOrder = await PSBOrder.findById(order._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('technician.technicianId', 'userId employeeId cluster')
      .populate({
        path: 'technician.technicianId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });

    res.json({
      success: true,
      data: populatedOrder,
      message: `Order assigned to ${technician.userId.name} successfully`
    });
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign technician'
    });
  }
});

// Accept assignment (Technician only)
router.patch('/:orderId/accept', technicianAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes, location } = req.body;

    const order = await PSBOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    if (order.status !== 'Assigned') {
      return res.status(400).json({
        success: false,
        error: 'Can only accept assigned orders'
      });
    }

    // Verify this technician is assigned to this order
    const technician = await Technician.findOne({ userId: req.user._id });
    if (!technician || order.technician.technicianId.toString() !== technician._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this order'
      });
    }

    // Update order status
    const now = new Date();
    order.status = 'Accepted';
    order.technician.acceptedAt = now;
    order.updatedBy = req.user._id;

    // Add to status history
    order.statusHistory.push({
      status: 'Accepted',
      changedBy: req.user._id,
      timestamp: now,
      notes: notes || 'Assignment accepted',
      location: location
    });

    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Assignment accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept assignment'
    });
  }
});

// Update order status (Technician only)
router.patch('/:orderId/status', technicianAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, location, fieldWork, installationDetails } = req.body;

    const validStatuses = ['Survey', 'Installation', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const order = await PSBOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    // Verify this technician is assigned to this order
    const technician = await Technician.findOne({ userId: req.user._id });
    if (!technician || order.technician.technicianId.toString() !== technician._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this order'
      });
    }

    // Validate status progression
    const currentStatus = order.status;
    const validTransitions = {
      'Accepted': ['Survey'],
      'Survey': ['Installation'],
      'Installation': ['Completed']
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Update order
    const now = new Date();
    order.status = status;
    order.updatedBy = req.user._id;

    // Update field work data if provided
    if (fieldWork) {
      order.fieldWork = { ...order.fieldWork, ...fieldWork };
    }

    // Update installation details if provided
    if (installationDetails) {
      order.installationDetails = { ...order.installationDetails, ...installationDetails };
    }

    // Add to status history
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      timestamp: now,
      notes,
      location
    });

    await order.save();

    // If completed, update technician availability and performance
    if (status === 'Completed') {
      technician.isAvailable = true;
      await technician.updatePerformanceMetrics();
      await technician.save();
    }

    const populatedOrder = await PSBOrder.findById(order._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('technician.technicianId', 'userId employeeId cluster')
      .populate({
        path: 'technician.technicianId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });

    res.json({
      success: true,
      data: populatedOrder,
      message: `Status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Get technician's assignments (Technician only)
router.get('/my-assignments', technicianAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const technician = await Technician.findOne({ userId: req.user._id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician profile not found'
      });
    }

    const query = { 'technician.technicianId': technician._id };
    
    // Apply status filter
    if (status) {
      query.status = status;
    }

    const orders = await PSBOrder.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PSBOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignments'
    });
  }
});

// Get assignment by ID (Technician can view assigned orders)
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await PSBOrder.findById(orderId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('technician.technicianId', 'userId employeeId cluster skills')
      .populate({
        path: 'technician.technicianId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name email'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    // Check permissions
    if (req.user.role === 'teknisi') {
      const technician = await Technician.findOne({ userId: req.user._id });
      if (!technician || order.technician.technicianId._id.toString() !== technician._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Reassign order to different technician (Super Admin only)
router.patch('/:orderId/reassign', superAdminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newTechnicianId, reason } = req.body;

    if (!newTechnicianId) {
      return res.status(400).json({
        success: false,
        error: 'New technician ID is required'
      });
    }

    const order = await PSBOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    if (!['Assigned', 'Accepted', 'Survey'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reassign order in current status'
      });
    }

    const newTechnician = await Technician.findById(newTechnicianId)
      .populate('userId', 'name email phone');

    if (!newTechnician || !newTechnician.isActive) {
      return res.status(404).json({
        success: false,
        error: 'New technician not found or inactive'
      });
    }

    // Check if new technician is available
    if (!newTechnician.isAvailableForAssignment()) {
      return res.status(400).json({
        success: false,
        error: 'New technician is not available for assignment'
      });
    }

    const oldTechnicianName = order.technician.name;

    // Update order with new technician
    const now = new Date();
    order.technician = {
      technicianId: newTechnician._id,
      name: newTechnician.userId.name,
      assignedAt: now,
      territory: order.cluster
    };
    order.status = 'Assigned'; // Reset to assigned
    order.updatedBy = req.user._id;

    // Add to status history
    order.statusHistory.push({
      status: 'Assigned',
      changedBy: req.user._id,
      timestamp: now,
      notes: `Reassigned from ${oldTechnicianName} to ${newTechnician.userId.name}. Reason: ${reason || 'No reason provided'}`
    });

    await order.save();

    res.json({
      success: true,
      data: order,
      message: `Order reassigned to ${newTechnician.userId.name} successfully`
    });
  } catch (error) {
    console.error('Error reassigning order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reassign order'
    });
  }
});

module.exports = router;