const express = require('express');
const router = express.Router();
const InterruptionReport = require('../models/InterruptionReport');
const PSBActivation = require('../models/PSBActivation');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Get all interruption reports with filters
router.get('/', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      technician,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.ticketStatus = status;
    if (technician) query.technician = technician;
    if (startDate || endDate) {
      query.openTime = {};
      if (startDate) query.openTime.$gte = new Date(startDate);
      if (endDate) query.openTime.$lte = new Date(endDate);
    }

    // Search in service number, customer name, or contact
    if (search) {
      query.$or = [
        { serviceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await InterruptionReport.countDocuments(query);

    const reports = await InterruptionReport.find(query)
      .populate('technician', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching interruption reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interruption reports',
      message: error.message
    });
  }
});

// Get single interruption report
router.get('/:id', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    const report = await InterruptionReport.findById(req.params.id)
      .populate('technician', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Interruption report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching interruption report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interruption report',
      message: error.message
    });
  }
});

// Lookup service number from PSB Activation
router.get('/lookup/:serviceNumber', async (req, res) => {
  try {
    const { serviceNumber } = req.params;

    const activation = await PSBActivation.findOne({ serviceNumber })
      .populate('psbOrderId', 'customerName address contactNumber');

    if (!activation || !activation.psbOrderId) {
      return res.status(404).json({
        success: false,
        error: 'Service number not found in PSB database'
      });
    }

    res.json({
      success: true,
      data: {
        serviceNumber: activation.serviceNumber,
        customerName: activation.psbOrderId.customerName,
        address: activation.psbOrderId.address,
        contactNumber: activation.psbOrderId.contactNumber
      }
    });
  } catch (error) {
    console.error('Error looking up service number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup service number',
      message: error.message
    });
  }
});

// Get technicians (users with role 'teknisi')
router.get('/meta/technicians', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    console.log('===== TECHNICIAN LOOKUP DEBUG START =====');
    console.log('Request URL:', req.originalUrl);
    console.log('Request User:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');
    
    let technicians;
    
    // Jika user adalah teknisi, return hanya nama sendiri
    if (req.user.role === 'teknisi') {
      technicians = await User.find({ 
        _id: req.user._id,
        role: 'teknisi', 
        isActive: true 
      })
      .select('name email phone role isActive')
      .sort({ name: 1 });
      
      console.log('Teknisi viewing own data only');
    } else {
      // Superadmin bisa lihat semua teknisi
      technicians = await User.find({ 
        role: 'teknisi', 
        isActive: true 
      })
      .select('name email phone role isActive')
      .sort({ name: 1 });
      
      console.log('Superadmin viewing all technicians');
    }

    console.log('Technicians Found:', technicians.length);
    console.log('Technicians List:', technicians.map(t => ({
      id: t._id,
      name: t.name,
      email: t.email,
      role: t.role,
      isActive: t.isActive
    })));
    console.log('===== TECHNICIAN LOOKUP DEBUG END =====');

    res.json({
      success: true,
      data: technicians,
      debug: {
        count: technicians.length,
        userRole: req.user.role,
        query: req.user.role === 'teknisi' 
          ? { _id: req.user._id, role: 'teknisi', isActive: true }
          : { role: 'teknisi', isActive: true },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ ERROR FETCHING TECHNICIANS:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch technicians',
      message: error.message
    });
  }
});

// Get distinct interruption types
router.get('/meta/types', async (req, res) => {
  try {
    const types = await InterruptionReport.distinct('interruptionType');
    
    res.json({
      success: true,
      data: types.filter(t => t).sort()
    });
  } catch (error) {
    console.error('Error fetching interruption types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interruption types',
      message: error.message
    });
  }
});

// Get distinct ticket statuses
router.get('/meta/statuses', async (req, res) => {
  try {
    const statuses = await InterruptionReport.distinct('ticketStatus');
    
    res.json({
      success: true,
      data: statuses.filter(s => s).sort()
    });
  } catch (error) {
    console.error('Error fetching ticket statuses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket statuses',
      message: error.message
    });
  }
});

// Get analytics data
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        openTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      let start;
      
      switch (period) {
        case 'today':
          start = new Date();
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'year':
          start = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case '5years':
          start = new Date(now.setFullYear(now.getFullYear() - 5));
          break;
        default: // month
          start = new Date(now.setMonth(now.getMonth() - 1));
      }
      
      dateFilter = { openTime: { $gte: start } };
    }

    // Summary statistics
    const totalReports = await InterruptionReport.countDocuments(dateFilter);
    const openReports = await InterruptionReport.countDocuments({
      ...dateFilter,
      ticketStatus: 'Open'
    });
    const resolvedReports = await InterruptionReport.countDocuments({
      ...dateFilter,
      ticketStatus: 'Resolved'
    });

    const avgHandlingTimeResult = await InterruptionReport.aggregate([
      { $match: { ...dateFilter, closeTime: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$handlingDuration' } } }
    ]);
    const averageHandlingTime = avgHandlingTimeResult[0]?.avgTime || 0;

    const performanceStats = await InterruptionReport.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$performance', count: { $sum: 1 } } }
    ]);
    const totalPerformance = performanceStats.reduce((acc, curr) => acc + curr.count, 0);
    const baikCount = performanceStats.find(p => p._id === 'Baik')?.count || 0;
    const performanceRate = totalPerformance > 0 
      ? ((baikCount / totalPerformance) * 100).toFixed(1) 
      : '0';

    // Monthly trends
    const monthlyTrends = await InterruptionReport.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$openTime' },
            month: { $month: '$openTime' }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$ticketStatus', 'Resolved'] }, 1, 0] }
          },
          avgHandlingTime: { $avg: '$handlingDuration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Type breakdown
    const typeBreakdown = await InterruptionReport.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$interruptionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Technician performance
    const technicianPerformance = await InterruptionReport.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$technician',
          totalReports: { $sum: 1 },
          avgHandlingTime: { $avg: '$handlingDuration' },
          baikCount: {
            $sum: { $cond: [{ $eq: ['$performance', 'Baik'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technicianData'
        }
      },
      { $unwind: '$technicianData' },
      {
        $project: {
          _id: 1,
          name: '$technicianData.name',
          totalReports: 1,
          avgHandlingTime: 1,
          performanceRate: {
            $cond: [
              { $gt: ['$totalReports', 0] },
              {
                $multiply: [
                  { $divide: ['$baikCount', '$totalReports'] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          openReports,
          resolvedReports,
          averageHandlingTime: parseFloat(averageHandlingTime.toFixed(2)),
          performanceRate
        },
        monthlyTrends,
        typeBreakdown,
        technicianPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// Create new interruption report
router.post('/', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    // Jika user adalah teknisi, paksa technician field = user._id sendiri
    if (req.user.role === 'teknisi') {
      req.body.technician = req.user._id;
    }
    
    const reportData = {
      ...req.body,
      createdBy: req.user._id
    };

    const report = new InterruptionReport(reportData);
    await report.save();

    const populatedReport = await InterruptionReport.findById(report._id)
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedReport,
      message: 'Interruption report created successfully'
    });
  } catch (error) {
    console.error('Error creating interruption report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create interruption report',
      message: error.message
    });
  }
});

// Update interruption report (dengan regex untuk MongoDB ObjectId)
// Uses find + save pattern to trigger pre('save') middleware for handlingDuration calculation
router.put('/:id([0-9a-fA-F]{24})', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    // Jika user adalah teknisi, paksa technician field = user._id sendiri
    if (req.user.role === 'teknisi') {
      req.body.technician = req.user._id;
    }
    
    // 1. Find document first
    const report = await InterruptionReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Interruption report not found'
      });
    }
    
    // 2. Update fields
    Object.keys(req.body).forEach(key => {
      report[key] = req.body[key];
    });
    report.updatedBy = req.user._id;
    
    // 3. Save (this triggers pre('save') middleware for handlingDuration calculation)
    await report.save();
    
    // 4. Populate and return
    await report.populate('technician', 'name email');
    await report.populate('createdBy', 'name email');
    await report.populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      data: report,
      message: 'Interruption report updated successfully'
    });
  } catch (error) {
    console.error('Error updating interruption report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interruption report',
      message: error.message
    });
  }
});

// Delete interruption report (dengan regex untuk MongoDB ObjectId)
router.delete('/:id([0-9a-fA-F]{24})', requireRole(['super_admin', 'teknisi']), async (req, res) => {
  try {
    const report = await InterruptionReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Interruption report not found'
      });
    }

    res.json({
      success: true,
      message: 'Interruption report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting interruption report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete interruption report',
      message: error.message
    });
  }
});

module.exports = router;
