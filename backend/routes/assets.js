const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Asset = require('../models/Asset');
const { auth, superAdminAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('status').optional().isIn(['available', 'in_use', 'borrowed', 'maintenance', 'retired', 'lost', 'stolen']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(filter)
      .populate('assignedTo.user', 'name email department')
      .populate('createdBy updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Asset.countDocuments(filter);

    res.json({
      success: true,
      data: assets,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo.user', 'name email department')
      .populate('createdBy updatedBy', 'name email');

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create asset
// @route   POST /api/assets
// @access  Private (Admin)
// Accepted categories - flexible to allow custom categories
const ACCEPTED_CATEGORIES = [
  "Tools", "Power Tools", "Testing Equipment", "Safety Equipment",
  "Power Equipment", "Network Equipment", "Measuring Tools",
  "Vehicle", "Computer Equipment", "IT Equipment", "Office Furniture",
  "Machinery", "Laptop", "Desktop", "Monitor", "Printer", "Router",
  "Switch", "Server", "UPS", "Other"
];

router.post('/', superAdminAuth, [
  body('name').notEmpty().trim().withMessage('Asset name is required'),
  body('code').notEmpty().trim().withMessage('Asset code is required'),
  body('category').notEmpty().trim().withMessage('Category is required'),
  body('purchasePrice').isNumeric().withMessage('Purchase price must be a number'),
  body('purchaseDate').optional().isISO8601().withMessage('Valid purchase date is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor', 'damaged']).withMessage('Invalid condition'),
  body('status').optional().isIn(['available', 'in_use', 'borrowed', 'maintenance', 'retired', 'lost', 'stolen', 'damaged']).withMessage('Invalid status'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Sanitize and prepare data - handle both object and string location
    const locationData = typeof req.body.location === 'string' 
      ? { building: req.body.location }
      : req.body.location || {};

    const assetData = {
      name: req.body.name?.trim(),
      code: req.body.code?.toUpperCase()?.trim(),
      category: req.body.category?.trim(),
      description: req.body.description?.trim() || '',
      purchasePrice: parseFloat(req.body.purchasePrice) || 0,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date(),
      quantity: parseInt(req.body.quantity) || 1,
      condition: req.body.condition || 'good',
      status: req.body.status || 'available',
      currentValue: req.body.currentValue ? parseFloat(req.body.currentValue) : parseFloat(req.body.purchasePrice) || 0,
      warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry) : null,
      location: locationData,
      specifications: req.body.specifications || {},
      tags: req.body.tags || [],
      createdBy: req.user.id
    };

    // Check if asset code already exists
    const existingAsset = await Asset.findOne({ code: assetData.code });
    if (existingAsset) {
      return res.status(400).json({ 
        success: false,
        error: 'Asset with this code already exists' 
      });
    }

    const asset = await Asset.create(assetData);

    await asset.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'Asset with this code already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create asset',
      message: error.message 
    });
  }
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin)
router.put('/:id', superAdminAuth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check asset code uniqueness if being updated
    if (req.body.code && req.body.code.toUpperCase() !== asset.code) {
      const existingAsset = await Asset.findOne({ code: req.body.code.toUpperCase() });
      if (existingAsset) {
        return res.status(400).json({ error: 'Asset with this code already exists' });
      }
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        code: req.body.code?.toUpperCase() || asset.code,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('assignedTo.user createdBy updatedBy', 'name email department');

    res.json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin)
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Assign asset to user
// @route   POST /api/assets/:id/assign
// @access  Private (Admin)
router.post('/:id/assign', superAdminAuth, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for assignment' });
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      {
        'assignedTo.user': req.body.userId,
        'assignedTo.assignedDate': new Date(),
        'assignedTo.returnDate': null,
        status: 'in_use',
        updatedBy: req.user.id
      },
      { new: true }
    ).populate('assignedTo.user', 'name email department');

    res.json({
      success: true,
      data: updatedAsset,
      message: 'Asset assigned successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Return asset
// @route   POST /api/assets/:id/return
// @access  Private (Admin)
router.post('/:id/return', superAdminAuth, [
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor', 'damaged']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status !== 'in_use') {
      return res.status(400).json({ error: 'Asset is not currently in use' });
    }

    const updateData = {
      'assignedTo.returnDate': new Date(),
      status: 'available',
      updatedBy: req.user.id
    };

    if (req.body.condition) {
      updateData.condition = req.body.condition;
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo.user', 'name email department');

    res.json({
      success: true,
      data: updatedAsset,
      message: 'Asset returned successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get asset categories
// @route   GET /api/assets/categories/list
// @access  Private
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = ['IT Equipment', 'Office Furniture', 'Machinery', 'Vehicle', 'Tools', 'Other'];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;