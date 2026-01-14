const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

/**
 * @route   GET /api/products/metadata/categories
 * @desc    Get unique product categories
 * @access  Private
 */
router.get('/categories', auth, async (req, res) => {
  try {
    // Get all unique categories from products
    const categories = await Product.distinct('category');
    
    // Filter out null/undefined and sort alphabetically
    const cleanedCategories = categories
      .filter(cat => cat && cat.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      data: cleanedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil kategori',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/metadata/units
 * @desc    Get unique product units
 * @access  Private
 */
router.get('/units', auth, async (req, res) => {
  try {
    // Get all unique units from products
    const units = await Product.distinct('unit');
    
    // Filter out null/undefined and sort alphabetically
    const cleanedUnits = units
      .filter(unit => unit && unit.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      data: cleanedUnits
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil unit',
      error: error.message
    });
  }
});

module.exports = router;
