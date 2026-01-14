const express = require("express");
const router = express.Router();
const PSBOrder = require("../models/PSBOrder");
const { requireRole } = require("../middleware/auth");
const mongoose = require("mongoose");

// Apply role-based authentication for all routes
router.use(requireRole(["super_admin", "cs", "teknisi"]));

// Input validation and sanitization
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input.trim().replace(/[<>]/g, "");
  }
  return input;
};

const validatePSBOrderInput = (data) => {
  const errors = [];

  if (!data.cluster || typeof data.cluster !== "string") {
    errors.push("Cluster is required and must be a string");
  }
  if (!data.sto || typeof data.sto !== "string") {
    errors.push("STO is required and must be a string");
  }
  if (!data.orderNo || typeof data.orderNo !== "string") {
    errors.push("Order number is required and must be a string");
  }
  if (!data.customerName || typeof data.customerName !== "string") {
    errors.push("Customer name is required and must be a string");
  }
  if (!data.customerPhone || typeof data.customerPhone !== "string") {
    errors.push("Customer phone is required and must be a string");
  }
  if (!data.address || typeof data.address !== "string") {
    errors.push("Address is required and must be a string");
  }
  if (!data.package || typeof data.package !== "string") {
    errors.push("Package is required and must be a string");
  }

  return errors;
};

// Get all PSB orders with pagination and filters
router.get("/", async (req, res) => {
  try {
    // Input validation and sanitization
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      10000,
      Math.max(1, parseInt(req.query.limit) || 1000)
    ); // Increased limit for technician data
    const skip = (page - 1) * limit;

    // Build filter object with sanitized inputs
    const filter = {};
    if (req.query.cluster) {
      const sanitizedCluster = sanitizeInput(req.query.cluster);
      filter.cluster = { $regex: sanitizedCluster, $options: "i" };
    }
    if (req.query.sto) {
      const sanitizedSto = sanitizeInput(req.query.sto);
      filter.sto = { $regex: sanitizedSto, $options: "i" };
    }
    if (req.query.status) {
      const validStatuses = ["Assigned", "Pending", "Completed", "Failed"];

      // Handle "In Progress" as a special case for backward compatibility
      if (req.query.status === "In Progress") {
        filter.status = { $in: ["Assigned", "Pending"] };
      } else if (validStatuses.includes(req.query.status)) {
        filter.status = req.query.status;
      }
    }
    if (req.query.technician) {
      const sanitizedTech = sanitizeInput(req.query.technician);
      // Support both string and object format for technician field
      filter.$or = [
        { technician: { $regex: sanitizedTech, $options: "i" } },
        { "technician.name": { $regex: sanitizedTech, $options: "i" } },
      ];
    }

    // Date range filtering
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filter.createdAt.$lte = endDate;
      }
    }

    if (req.query.search) {
      const sanitizedSearch = sanitizeInput(req.query.search);
      filter.$or = [
        { customerName: { $regex: sanitizedSearch, $options: "i" } },
        { orderNo: { $regex: sanitizedSearch, $options: "i" } },
        { customerPhone: { $regex: sanitizedSearch, $options: "i" } },
        { address: { $regex: sanitizedSearch, $options: "i" } },
        { package: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = {};
    sort[sortBy] = sortOrder;

    console.log(
      `[PSB] Fetching orders - Page: ${page}, Limit: ${limit}, Filter:`,
      filter
    );

    const [orders, total, aggregationStats] = await Promise.all([
      PSBOrder.find(filter)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PSBOrder.countDocuments(filter),
      // Get aggregation stats for the filtered data
      PSBOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            completedCount: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            inProgressCount: {
              $sum: {
                $cond: [{ $in: ["$status", ["Assigned", "Pending"]] }, 1, 0],
              },
            },
            uniqueClusters: { $addToSet: "$cluster" },
            uniqueSTOs: { $addToSet: "$sto" },
            uniqueTechnicians: { $addToSet: "$technician" },
          },
        },
      ]),
    ]);

    console.log(`[PSB] Found ${orders.length} orders out of ${total} total`);

    // Format the response with IDs and additional stats
    const formattedOrders = orders.map((order) => ({
      ...order,
      id: order._id,
      _id: order._id.toString(),
    }));

    const totalPages = Math.ceil(total / limit);
    const stats = aggregationStats[0] || {
      totalRecords: 0,
      completedCount: 0,
      pendingCount: 0,
      inProgressCount: 0,
      uniqueClusters: [],
      uniqueSTOs: [],
      uniqueTechnicians: [],
    };

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        filtered: {
          total: stats.totalRecords,
          completed: stats.completedCount,
          pending: stats.pendingCount,
          inProgress: stats.inProgressCount,
          clusters: stats.uniqueClusters.length,
          stos: stats.uniqueSTOs.length,
          technicians: stats.uniqueTechnicians.length,
        },
      },
      meta: {
        availableClusters: stats.uniqueClusters.filter((c) => c),
        availableSTOs: stats.uniqueSTOs.filter((s) => s),
        availableTechnicians: stats.uniqueTechnicians.filter((t) => t),
      },
    });
  } catch (error) {
    console.error("[PSB] Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PSB orders",
      error: error.message,
    });
  }
});
// Get PSB order analytics
router.get("/analytics", async (req, res) => {
  try {
    const totalOrders = await PSBOrder.countDocuments();
    const completedOrders = await PSBOrder.countDocuments({
      status: "Completed",
    });
    const pendingOrders = await PSBOrder.countDocuments({ status: "Pending" });
    const inProgressOrders = await PSBOrder.countDocuments({
      status: { $in: ["Assigned", "Pending"] },
    });

    // Get orders by cluster
    const clusterStats = await PSBOrder.aggregate([
      {
        $group: {
          _id: "$cluster",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get orders by STO
    const stoStats = await PSBOrder.aggregate([
      {
        $group: {
          _id: "$sto",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get monthly trends
    const monthlyTrends = await PSBOrder.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          pendingOrders,
          inProgressOrders,
          completionRate:
            totalOrders > 0
              ? ((completedOrders / totalOrders) * 100).toFixed(1)
              : 0,
        },
        clusterStats,
        stoStats,
        monthlyTrends,
      },
    });
  } catch (error) {
    console.error("Error fetching PSB analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PSB analytics",
    });
  }
});

// Create new PSB order
router.post("/", async (req, res) => {
  try {
    // Validate input
    const validationErrors = validatePSBOrderInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Sanitize input data
    const sanitizedData = {
      cluster: sanitizeInput(req.body.cluster),
      sto: sanitizeInput(req.body.sto),
      orderNo: sanitizeInput(req.body.orderNo),
      customerName: sanitizeInput(req.body.customerName),
      customerPhone: sanitizeInput(req.body.customerPhone),
      address: sanitizeInput(req.body.address),
      package: sanitizeInput(req.body.package),
      status: req.body.status || "Pending",
      // Standardize technician field to string format
      technician: req.body.technician
        ? typeof req.body.technician === "string"
          ? sanitizeInput(req.body.technician)
          : sanitizeInput(req.body.technician.name || req.body.technician)
        : undefined,
      notes: req.body.notes ? sanitizeInput(req.body.notes) : undefined,
      createdBy: req.user._id,
    };

    // Check for duplicate orderNo
    const existingOrder = await PSBOrder.findOne({
      orderNo: sanitizedData.orderNo,
    });
    if (existingOrder) {
      return res.status(409).json({
        success: false,
        error: "Order number already exists",
        details: `Order ${sanitizedData.orderNo} already exists`,
      });
    }

    // Get the next order number
    const lastOrder = await PSBOrder.findOne().sort({ no: -1 });
    const nextNo = lastOrder ? lastOrder.no + 1 : 1;

    sanitizedData.no = nextNo;

    console.log(
      `[PSB] Creating order ${sanitizedData.orderNo} with no: ${nextNo}`
    );

    const order = new PSBOrder(sanitizedData);
    await order.save();

    await order.populate("createdBy", "name email");

    console.log(`[PSB] Order created successfully: ${order._id}`);

    res.status(201).json({
      success: true,
      data: order,
      message: "PSB order created successfully",
    });
  } catch (error) {
    console.error("[PSB] Error creating order:", error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Duplicate ${field}`,
        details: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create PSB order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update PSB order
router.put("/:id", async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
      });
    }

    // Ambil data update & buang _id biar gak bentrok
    const updateData = { ...req.body };
    delete updateData._id;

    // Sanitasi data
    const sanitizedUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (key !== "createdBy" && key !== "__v") {
        if (key === "technician") {
          // Standardize technician field to string format
          sanitizedUpdateData[key] =
            typeof updateData[key] === "string"
              ? sanitizeInput(updateData[key])
              : sanitizeInput(updateData[key]?.name || updateData[key]);
        } else {
          sanitizedUpdateData[key] =
            typeof updateData[key] === "string"
              ? sanitizeInput(updateData[key])
              : updateData[key];
        }
      }
    });

    sanitizedUpdateData.updatedBy = req.user._id;

    console.log(`[PSB] Updating order ${req.params.id}`);

    const order = await PSBOrder.findByIdAndUpdate(
      req.params.id,
      sanitizedUpdateData,
      { new: true, runValidators: true }
    ).populate("createdBy updatedBy", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "PSB order not found",
      });
    }

    console.log(`[PSB] Order updated successfully: ${order._id}`);

    res.json({
      success: true,
      data: order,
      message: "PSB order updated successfully",
    });
  } catch (error) {
    console.error("[PSB] Error updating order:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Duplicate ${field}`,
        details: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update PSB order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete PSB order
router.delete("/:id", async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
      });
    }

    console.log(`[PSB] Deleting order ${req.params.id}`);

    const order = await PSBOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "PSB order not found",
      });
    }

    console.log(`[PSB] Order deleted successfully: ${req.params.id}`);

    res.json({
      success: true,
      message: "PSB order deleted successfully",
    });
  } catch (error) {
    console.error("[PSB] Error deleting order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete PSB order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.put(
  "/:id/technician-status",
  requireRole(["super_admin", "cs", "teknisi"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID",
        });
      }

      const { technicianStatus, technicianStatusReason } = req.body;

      // Validate status
      const validStatuses = ["pending", "failed", "complete"];
      if (!technicianStatus || !validStatuses.includes(technicianStatus)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid technician status. Must be pending, failed, or complete",
        });
      }

      if (
        (technicianStatus === "pending" || technicianStatus === "failed") &&
        !technicianStatusReason?.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: "Reason is required for pending or failed status",
        });
      }

      const updateData = {
        technicianStatus,
        technicianStatusReason: technicianStatusReason || "",
        technicianStatusUpdatedAt: new Date(),
        updatedBy: req.user._id,
      };

      if (technicianStatus === "complete") {
        updateData.status = "Completed";
      }

      if (technicianStatus === "failed") {
        updateData.status = "Failed";
      }

      if (technicianStatus === "pending") {
        updateData.status = "Pending";
      }

      const order = await PSBOrder.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate("createdBy updatedBy", "name email");

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "PSB order not found",
        });
      }

      console.log(
        `[PSB] Technician status updated: ${order._id} - ${technicianStatus}`
      );

      res.json({
        success: true,
        data: order,
        message: "Technician status updated successfully",
      });
    } catch (error) {
      console.error("[PSB] Error updating technician status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update technician status",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get single PSB order by ID
router.get("/:id", async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
      });
    }

    const order = await PSBOrder.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "PSB order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[PSB] Error fetching order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PSB order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// NEW: Special endpoint for technicians to get their assigned orders
// This endpoint is placed BEFORE the sample data route to avoid conflicts
router.get(
  "/technician/my-orders",
  requireRole(["teknisi"]),
  async (req, res) => {
    try {
      console.log("[PSB] Technician fetching their orders:", req.user.name);

      const technicianName = req.user.name;

      // Build filter to match technician by name (support both string and object format)
      const filter = {
        $or: [
          { technician: technicianName },
          { "technician.name": technicianName },
        ],
        status: { $nin: ["Completed", "Cancelled"] }, // Exclude completed/cancelled
      };

      const orders = await PSBOrder.find(filter)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      console.log(
        `[PSB] Found ${orders.length} orders for technician ${technicianName}`
      );

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: 1,
          limit: orders.length,
          total: orders.length,
          pages: 1,
        },
      });
    } catch (error) {
      console.error("[PSB] Error fetching technician orders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch technician orders",
        error: error.message,
      });
    }
  }
);

// Generate sample PSB orders for testing
router.post(
  "/generate-sample",
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      // Only allow super_admin to generate sample data
      if (req.user.role !== "super_admin") {
        return res.status(403).json({
          success: false,
          error: "Only super admin can generate sample data",
        });
      }

      const { seedPSBOrders } = require("../seeds/seedPSBOrders");
      const User = require("../models/User");

      // Get users for seeding
      const users = await User.find();
      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No users found. Please seed users first.",
        });
      }

      await PSBOrder.deleteMany({});

      const orders = await seedPSBOrders(users);

      res.json({
        success: true,
        message: `Generated ${orders.length} sample PSB orders`,
        data: {
          count: orders.length,
        },
      });
    } catch (error) {
      console.error("Error generating sample PSB orders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate sample data",
      });
    }
  }
);

module.exports = router;
