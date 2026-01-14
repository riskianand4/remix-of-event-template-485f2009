const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const { auth } = require("../middleware/auth");

// Default categories that match the Asset model enum
const DEFAULT_CATEGORIES = [
  "Tools",
  "Power Tools",
  "Testing Equipment",
  "Safety Equipment",
  "Power Equipment",
  "Network Equipment",
  "Measuring Tools",
  "Vehicle",
  "Computer Equipment",
  "Other"
];

// GET /api/assets/metadata/categories - Get asset categories
router.get("/categories", auth, async (req, res) => {
  try {
    // Try to get distinct categories from database
    let categories = [];
    
    try {
      const dbCategories = await Asset.distinct("category");
      categories = dbCategories
        .filter(cat => cat && cat.trim() !== '')
        .sort((a, b) => a.localeCompare(b));
    } catch (dbError) {
      console.warn("Could not fetch categories from DB, using defaults:", dbError.message);
    }
    
    // If no categories in DB, use defaults
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching asset categories:", error);
    // Return default categories on any error
    res.json({
      success: true,
      data: DEFAULT_CATEGORIES
    });
  }
});

// GET /api/assets/metadata/conditions - Get asset conditions
router.get("/conditions", auth, async (req, res) => {
  res.json({
    success: true,
    data: ['excellent', 'good', 'fair', 'poor', 'damaged']
  });
});

// GET /api/assets/metadata/statuses - Get asset statuses
router.get("/statuses", auth, async (req, res) => {
  res.json({
    success: true,
    data: ['available', 'in_use', 'borrowed', 'maintenance', 'retired', 'lost', 'stolen']
  });
});

module.exports = router;
