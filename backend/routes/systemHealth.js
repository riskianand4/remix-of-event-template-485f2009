const express = require('express');
const SystemHealth = require('../models/SystemHealth');
const AdminActivity = require('../models/AdminActivity');
const { superAdminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Get current system health metrics
// @route   GET /api/system/health
// @access  Super Admin
router.get('/', superAdminAuth, async (req, res) => {
  try {
    // Get current system metrics
    const currentMetrics = {
      uptime: process.uptime(),
      memoryUsage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: ((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(1) + '%'
      },
      cpuUsage: 0, // Would need additional monitoring for real CPU usage
      diskUsage: 0,
      activeConnections: 1,
      database: {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        responseTime: 0
      }
    };

    // Test database response time
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    currentMetrics.database.responseTime = Date.now() - start;

    // Determine overall status
    let status = 'excellent';
    const memoryPercentage = parseFloat(currentMetrics.memoryUsage.percentage);
    
    if (currentMetrics.database.status !== 'healthy') {
      status = 'critical';
    } else if (memoryPercentage > 90) {
      status = 'critical';
    } else if (memoryPercentage > 70) {
      status = 'warning';
    } else if (memoryPercentage > 50) {
      status = 'good';
    }

    // Save health record
    await SystemHealth.create({
      metrics: currentMetrics,
      status
    });

    // Get recent health history (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const healthHistory = await SystemHealth.find({
      timestamp: { $gte: yesterday }
    }).sort({ timestamp: -1 }).limit(24);

    res.json({
      success: true,
      data: {
        current: currentMetrics,
        status,
        history: healthHistory,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'critical',
        timestamp: new Date()
      }
    });
  }
});

// @desc    Get system metrics for dashboard
// @route   GET /api/system/metrics
// @access  Super Admin
router.get('/metrics', superAdminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    
    // Get user stats
    const users = await User.find({});
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === true).length;
    const admins = users.filter(u => u.role === 'super_admin').length;

    // Get product stats  
    const products = await Product.find({});
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 10)).length;

    // Get current system health
    const latestHealth = await SystemHealth.findOne().sort({ timestamp: -1 });
    const systemHealth = latestHealth || {
      metrics: {
        uptime: process.uptime(),
        memoryUsage: { percentage: '0%' },
        database: { status: 'healthy' }
      },
      status: 'excellent'
    };

    const metrics = [
      {
        label: 'Total Users',
        value: totalUsers.toString(),
        icon: 'Users',
        trend: `${activeUsers} active`,
        status: totalUsers > 0 ? 'good' : 'warning'
      },
      {
        label: 'System Load',
        value: systemHealth.metrics.memoryUsage.percentage,
        icon: 'Server',
        trend: 'stable',
        status: systemHealth.status
      },
      {
        label: 'Security Alerts',
        value: '0',
        icon: 'AlertTriangle',
        trend: 'none',
        status: 'excellent'
      },
      {
        label: 'Database Status',
        value: systemHealth.metrics.database.status === 'healthy' ? 'Online' : 'Offline',
        icon: 'Database',
        trend: 'stable',
        status: systemHealth.metrics.database.status === 'healthy' ? 'excellent' : 'critical'
      },
      {
        label: 'Active Admins',
        value: admins.toString(),
        icon: 'Shield',
        trend: `${admins} online`,
        status: admins > 0 ? 'good' : 'warning'
      },
      {
        label: 'System Uptime',
        value: Math.floor(systemHealth.metrics.uptime / 3600) + 'h',
        icon: 'Globe',
        trend: 'stable',
        status: 'excellent'
      }
    ];

    res.json({
      success: true,
      data: {
        metrics,
        systemHealth: systemHealth.metrics,
        userStats: { totalUsers, activeUsers, admins },
        productStats: { totalProducts, lowStockProducts }
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get admin activities
// @route   GET /api/system/activities
// @access  Super Admin
router.get('/activities', superAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Enhanced query with filters
    const filter = {};
    if (req.query.admin && req.query.admin !== 'all') {
      filter.admin = req.query.admin;
    }
    if (req.query.risk && req.query.risk !== 'all') {
      filter.risk = req.query.risk;
    }
    if (req.query.action) {
      filter.action = { $regex: req.query.action, $options: 'i' };
    }
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const activities = await AdminActivity.find(filter)
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminActivity.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get system alerts
// @route   GET /api/system/alerts
// @access  Super Admin
router.get('/alerts', superAdminAuth, async (req, res) => {
  try {
    const Alert = require('../models/Alert');
    const Product = require('../models/Product');
    
    // Get recent health issues
    const recentHealth = await SystemHealth.find({
      status: { $in: ['warning', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 }).limit(10);

    // Check for products that need stock alerts but don't have them yet
    const products = await Product.find({
      status: 'active',
      $or: [
        { 'stock.current': { $lte: 0 } }, // Out of stock
        { $expr: { $lte: ['$stock.current', '$stock.minimum'] } } // Low stock
      ]
    });

    // Get existing alerts to avoid duplicates
    const existingAlerts = await Alert.find({
      type: { $in: ['OUT_OF_STOCK', 'LOW_STOCK'] },
      product: { $in: products.map(p => p._id) },
      acknowledged: false
    });

    const existingProductIds = new Set(existingAlerts.map(a => a.product.toString()));

    // Auto-generate missing stock alerts
    for (const product of products) {
      if (!existingProductIds.has(product._id.toString())) {
        const currentStock = product.stock?.current || 0;
        const minStock = product.stock?.minimum || 0;
        
        if (currentStock <= 0) {
          // Out of stock
          await Alert.createStockAlert(
            product,
            'OUT_OF_STOCK',
            `Product ${product.name} is completely out of stock. Immediate restock needed.`,
            'CRITICAL'
          );
        } else if (currentStock <= minStock && minStock > 0) {
          // Low stock
          await Alert.createStockAlert(
            product,
            'LOW_STOCK',
            `Product ${product.name} stock is below minimum threshold (${currentStock}/${minStock}).`,
            'HIGH'
          );
        }
      }
    }

    // Get all alerts (system + stock)
    const inventoryAlerts = await Alert.find({
      acknowledged: false,
      type: { $in: ['OUT_OF_STOCK', 'LOW_STOCK', 'OVERSTOCK'] }
    }).populate('product', 'name sku stock minStock').sort({ createdAt: -1 }).limit(10);

    const systemAlerts = recentHealth.map(health => ({
      message: `System ${health.status} - Memory usage: ${health.metrics.memoryUsage.percentage}`,
      severity: health.status === 'critical' ? 'critical' : 'warning',
      time: health.timestamp.toLocaleString('id-ID'),
      action: 'Monitor',
      affected: 'System Performance'
    }));

    const stockAlerts = inventoryAlerts.map(alert => ({
      message: alert.message,
      severity: alert.severity.toLowerCase(),
      time: alert.createdAt.toLocaleString('id-ID'),
      action: 'Restock',
      affected: alert.productName || 'Product'
    }));

    const allAlerts = [...stockAlerts, ...systemAlerts];

    const finalAlerts = allAlerts.length > 0 ? allAlerts : [
      {
        message: 'System running smoothly - no critical alerts',
        severity: 'success',
        time: new Date().toLocaleString('id-ID'),
        action: 'Monitor',
        affected: 'All Systems'
      }
    ];

    res.json({
      success: true,
      data: finalAlerts
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get location stats
// @route   GET /api/system/locations
// @access  Super Admin
router.get('/locations', superAdminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    
    const users = await User.find({});
    const products = await Product.find({});
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === true).length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 10)).length;

    const locations = [
      {
        location: 'User Management',
        products: totalUsers,
        alerts: totalUsers - activeUsers,
        health: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100
      },
      {
        location: 'Product Management',
        products: totalProducts,
        alerts: lowStockProducts,
        health: totalProducts > 0 ? Math.round(((totalProducts - lowStockProducts) / totalProducts) * 100) : 100
      },
      {
        location: 'System Core',
        products: 1,
        alerts: 0,
        health: 100
      }
    ];

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Locations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Log admin activity
// @route   POST /api/system/activities
// @access  Super Admin
router.post('/activities', superAdminAuth, async (req, res) => {
  try {
    const { action, resource, location, details, risk } = req.body;
    
    const activity = await AdminActivity.create({
      adminId: req.user.id,
      admin: req.user.name || req.user.email,
      action,
      resource: resource || 'System',
      location: location || 'System Core',
      details: details || {},
      risk: risk || 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'N/A'
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;