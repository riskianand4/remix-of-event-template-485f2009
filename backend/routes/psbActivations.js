const express = require("express");
const router = express.Router();
const PSBActivation = require("../models/PSBActivation");
const PSBOrder = require("../models/PSBOrder");
const { requireRole } = require("../middleware/auth");
const mongoose = require("mongoose");

// Input validation and sanitization
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input.trim().replace(/[<>]/g, "");
  }
  return input;
};

const validateActivationInput = (data) => {
  const errors = [];

  if (!data.psbOrderId || !mongoose.Types.ObjectId.isValid(data.psbOrderId)) {
    errors.push("Valid PSB Order ID is required");
  }
  if (!data.serviceNumber || typeof data.serviceNumber !== "string") {
    errors.push("Service number is required and must be a string");
  }
  if (!data.pppoeUsername || typeof data.pppoeUsername !== "string") {
    errors.push("PPPoE username is required and must be a string");
  }
  if (!data.pppoePassword || typeof data.pppoePassword !== "string") {
    errors.push("PPPoE password is required and must be a string");
  }
  if (!data.oltName || typeof data.oltName !== "string") {
    errors.push("OLT name is required and must be a string");
  }
  if (!data.ponPort || typeof data.ponPort !== "string") {
    errors.push("PON port is required and must be a string");
  }
  if (!data.onuNumber || typeof data.onuNumber !== "string") {
    errors.push("ONU number is required and must be a string");
  }
  if (data.signalLevel === undefined || typeof data.signalLevel !== "number") {
    errors.push("Signal level is required and must be a number");
  } else if (data.signalLevel < -50 || data.signalLevel > 0) {
    errors.push("Signal level must be between -50 and 0 dBm");
  }
  if (!data.activationDate || isNaN(Date.parse(data.activationDate))) {
    errors.push("Activation date is required and must be a valid date");
  }

  if (!data.cluster || typeof data.cluster !== "string") {
    errors.push("Cluster is required and must be a string");
  }
  if (!data.technician || typeof data.technician !== "string") {
    errors.push("Technician is required and must be a string");
  }

  return errors;
};

// Get all PSB activations with pagination and filters (All authenticated users can view)
router.get(
  "/",
  requireRole(["super_admin", "cs", "teknisi"]),
  async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(
        10000,
        Math.max(1, parseInt(req.query.limit) || 1000)
      );
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};

      // AUTO-FILTER for TEKNISI: Only show their own activations
      if (req.user.role === "teknisi") {
        filter.technician = req.user.name; // Exact match
        console.log(`Teknisi ${req.user.name} viewing their activations only`);
      }

      if (req.query.cluster) {
        filter.cluster = {
          $regex: sanitizeInput(req.query.cluster),
          $options: "i",
        };
      }
      if (req.query.oltName) {
        filter.oltName = {
          $regex: sanitizeInput(req.query.oltName),
          $options: "i",
        };
      }
      if (req.query.ontStatus) {
        const validStatuses = ["configured", "pending", "failed"];
        if (validStatuses.includes(req.query.ontStatus)) {
          filter.ontStatus = req.query.ontStatus;
        }
      }
      // Manual filter technician (for admin/cs to filter by specific technician)
      if (req.query.technician && req.user.role !== "teknisi") {
        filter.technician = {
          $regex: sanitizeInput(req.query.technician),
          $options: "i",
        };
      }

      // Date range filtering
      if (req.query.dateFrom || req.query.dateTo) {
        filter.activationDate = {};
        if (req.query.dateFrom) {
          filter.activationDate.$gte = new Date(req.query.dateFrom);
        }
        if (req.query.dateTo) {
          const endDate = new Date(req.query.dateTo);
          endDate.setHours(23, 59, 59, 999);
          filter.activationDate.$lte = endDate;
        }
      }

      if (req.query.search) {
        const sanitizedSearch = sanitizeInput(req.query.search);
        filter.$or = [
          { serviceNumber: { $regex: sanitizedSearch, $options: "i" } },
          { pppoeUsername: { $regex: sanitizedSearch, $options: "i" } },
          { oltName: { $regex: sanitizedSearch, $options: "i" } },
          { technician: { $regex: sanitizedSearch, $options: "i" } },
        ];
      }

      // Sorting
      const sortBy = req.query.sortBy || "activationDate";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      const sort = {};
      sort[sortBy] = sortOrder;

      const [activations, total] = await Promise.all([
        PSBActivation.find(filter)
          .populate(
            "psbOrderId",
            "orderNo customerName customerPhone address package"
          )
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        PSBActivation.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: activations,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching PSB activations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch PSB activations",
        error: error.message,
      });
    }
  }
);

// Get next available service number (CS and Super Admin only)
router.get(
  "/next-service-number",
  requireRole(["super_admin", "cs"]),
  async (req, res) => {
    try {
      const lastActivation = await PSBActivation.findOne()
        .sort({ serviceNumber: -1 })
        .select("serviceNumber")
        .lean();

      let nextNumber = "2988372626"; // Default starting number

      if (lastActivation && lastActivation.serviceNumber) {
        const currentNumber = parseInt(lastActivation.serviceNumber);
        if (!isNaN(currentNumber)) {
          nextNumber = (currentNumber + 1).toString();
        }
      }

      res.json({
        success: true,
        data: {
          nextServiceNumber: nextNumber,
          lastServiceNumber: lastActivation?.serviceNumber || null,
        },
      });
    } catch (error) {
      console.error("Error fetching next service number:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch next service number",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get PSB activation analytics (All authenticated users can view)
router.get(
  "/analytics",
  requireRole(["super_admin", "cs", "teknisi"]),
  async (req, res) => {
    try {
      // Filter for technician role - only show their own data
      const filter = {};
      if (req.user.role === "teknisi") {
        filter.technician = req.user.name;
        console.log(
          `Teknisi ${req.user.name} viewing their activation analytics only`
        );
      }

      const totalActivations = await PSBActivation.countDocuments(filter);
      const configuredONT = await PSBActivation.countDocuments({
        ...filter,
        ontStatus: "configured",
      });
      const pendingONT = await PSBActivation.countDocuments({
        ...filter,
        ontStatus: "pending",
      });
      const failedONT = await PSBActivation.countDocuments({
        ...filter,
        ontStatus: "failed",
      });

      // Calculate average signal level
      const signalStats = await PSBActivation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            averageSignalLevel: { $avg: "$signalLevel" },
          },
        },
      ]);
      const averageSignalLevel = signalStats[0]?.averageSignalLevel || 0;

      // Get activations by cluster
      const clusterStats = await PSBActivation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$cluster",
            count: { $sum: 1 },
            configured: {
              $sum: { $cond: [{ $eq: ["$ontStatus", "configured"] }, 1, 0] },
            },
            averageSignal: { $avg: "$signalLevel" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Get activations by OLT
      const oltStats = await PSBActivation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$oltName",
            count: { $sum: 1 },
            configured: {
              $sum: { $cond: [{ $eq: ["$ontStatus", "configured"] }, 1, 0] },
            },
            averageSignal: { $avg: "$signalLevel" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Get monthly trends
      const monthlyTrends = await PSBActivation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: "$activationDate" },
              month: { $month: "$activationDate" },
            },
            count: { $sum: 1 },
            configured: {
              $sum: { $cond: [{ $eq: ["$ontStatus", "configured"] }, 1, 0] },
            },
            averageSignal: { $avg: "$signalLevel" },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 },
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            totalActivations,
            configuredONT,
            pendingONT,
            failedONT,
            averageSignalLevel: Math.round(averageSignalLevel * 100) / 100,
            configurationRate:
              totalActivations > 0
                ? ((configuredONT / totalActivations) * 100).toFixed(1)
                : "0",
          },
          clusterStats,
          oltStats,
          monthlyTrends,
        },
      });
    } catch (error) {
      console.error("Error fetching PSB activation analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch PSB activation analytics",
      });
    }
  }
);

// Create new PSB activation (Only CS and Super Admin)
router.post("/", requireRole(["super_admin", "cs"]), async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateActivationInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check if PSB Order exists and is completed
    const psbOrder = await PSBOrder.findById(req.body.psbOrderId);
    if (!psbOrder) {
      return res.status(404).json({
        success: false,
        error: "PSB Order not found",
      });
    }

    if (!["Completed"].includes(psbOrder.status)) {
      return res.status(400).json({
        success: false,
        error:
          "PSB Order must be completed or in installation phase before activation",
        details: `Order status is currently: ${psbOrder.status}`,
      });
    }

    // Check for duplicate service number
    const existingActivation = await PSBActivation.findOne({
      serviceNumber: sanitizeInput(req.body.serviceNumber),
    });
    if (existingActivation) {
      return res.status(409).json({
        success: false,
        error: "Service number already exists",
        details: `Service number ${req.body.serviceNumber} is already in use`,
      });
    }

    // Sanitize input data
    const sanitizedData = {
      psbOrderId: req.body.psbOrderId,
      customerName: req.body.customerName
        ? sanitizeInput(req.body.customerName)
        : psbOrder.customerName,
      serviceNumber: sanitizeInput(req.body.serviceNumber),
      pppoeUsername: sanitizeInput(req.body.pppoeUsername),
      pppoePassword: sanitizeInput(req.body.pppoePassword),
      oltName: sanitizeInput(req.body.oltName),
      ponPort: sanitizeInput(req.body.ponPort),
      onuNumber: sanitizeInput(req.body.onuNumber),
      signalLevel: req.body.signalLevel,
      activationDate: req.body.activationDate
        ? new Date(req.body.activationDate)
        : new Date(),
      ontStatus: req.body.ontStatus || "pending",
      cluster: sanitizeInput(req.body.cluster),
      technician: sanitizeInput(req.body.technician),
      notes: req.body.notes ? sanitizeInput(req.body.notes) : undefined,
      createdBy: req.user._id,
    };

    const activation = new PSBActivation(sanitizedData);
    await activation.save();

    await activation.populate([
      {
        path: "psbOrderId",
        select: "orderNo customerName customerPhone address package",
      },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      data: activation,
      message: "PSB activation created successfully",
    });
  } catch (error) {
    console.error("Error creating PSB activation:", error);

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
      error: "Failed to create PSB activation",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update PSB activation (All authenticated users - teknisi for signatures only)
router.put(
  "/:id",
  requireRole(["super_admin", "cs", "teknisi"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid activation ID",
        });
      }

      const updateData = { ...req.body };
      delete updateData._id;

      // Sanitize data
      const sanitizedUpdateData = {};
      Object.keys(updateData).forEach((key) => {
        if (key !== "createdBy" && key !== "__v") {
          sanitizedUpdateData[key] =
            typeof updateData[key] === "string"
              ? sanitizeInput(updateData[key])
              : updateData[key];
        }
      });

      sanitizedUpdateData.updatedBy = req.user._id;

      const activation = await PSBActivation.findByIdAndUpdate(
        req.params.id,
        sanitizedUpdateData,
        { new: true, runValidators: true }
      ).populate([
        {
          path: "psbOrderId",
          select: "orderNo customerName customerPhone address package",
        },
        { path: "createdBy updatedBy", select: "name email" },
      ]);

      if (!activation) {
        return res.status(404).json({
          success: false,
          error: "PSB activation not found",
        });
      }

      res.json({
        success: true,
        data: activation,
        message: "PSB activation updated successfully",
      });
    } catch (error) {
      console.error("Error updating PSB activation:", error);

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
        error: "Failed to update PSB activation",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Delete PSB activation (Only CS and Super Admin)
router.delete("/:id", requireRole(["super_admin", "cs"]), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid activation ID",
      });
    }

    const activation = await PSBActivation.findByIdAndDelete(req.params.id);

    if (!activation) {
      return res.status(404).json({
        success: false,
        error: "PSB activation not found",
      });
    }

    res.json({
      success: true,
      message: "PSB activation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting PSB activation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete PSB activation",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get single PSB activation by ID (All authenticated users can view)
router.get(
  "/:id",
  requireRole(["super_admin", "cs", "teknisi"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid activation ID",
        });
      }

      const activation = await PSBActivation.findById(req.params.id)
        .populate(
          "psbOrderId",
          "orderNo customerName customerPhone address package"
        )
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!activation) {
        return res.status(404).json({
          success: false,
          error: "PSB activation not found",
        });
      }

      res.json({
        success: true,
        data: activation,
      });
    } catch (error) {
      console.error("Error fetching PSB activation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch PSB activation",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Update installation report details (CS/SuperAdmin only)
router.put(
  "/:id/installation-report",
  requireRole(["super_admin", "cs"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid activation ID",
        });
      }

      const activation = await PSBActivation.findById(req.params.id);
      if (!activation) {
        return res.status(404).json({
          success: false,
          error: "PSB activation not found",
        });
      }

      // Update installation report
      const updateData = {
        "installationReport.speedTest": req.body.speedTest,
        "installationReport.device": req.body.device,
        "installationReport.datek": req.body.datek,
        "installationReport.serviceType": req.body.serviceType,
        "installationReport.packageSpeed": req.body.packageSpeed,
        "installationReport.fastelNumber": req.body.fastelNumber,
        "installationReport.contactPerson": req.body.contactPerson,
        updatedBy: req.user._id,
      };

      const updatedActivation = await PSBActivation.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        {
          path: "psbOrderId",
          select: "orderNo customerName customerPhone address package",
        },
        { path: "createdBy updatedBy", select: "name email" },
      ]);

      res.json({
        success: true,
        data: updatedActivation,
        message: "Installation report updated successfully",
      });
    } catch (error) {
      console.error("Error updating installation report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update installation report",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Submit signatures for PSB activation (Teknisi only)
router.post("/:id/signature", requireRole(["teknisi"]), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid activation ID",
      });
    }

    const activation = await PSBActivation.findById(req.params.id);

    if (!activation) {
      return res.status(404).json({
        success: false,
        error: "PSB activation not found",
      });
    }

    // Verify technician is assigned to this activation
    if (activation.technician !== req.user.name) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You can only sign activations assigned to you",
        details: `This activation is assigned to ${activation.technician}`,
      });
    }

    // Check if signatures already exist
    if (
      activation.installationReport?.signatures?.technician &&
      activation.installationReport?.signatures?.customer
    ) {
      return res.status(400).json({
        success: false,
        error: "Signatures already exist",
        details: "This activation has already been signed",
      });
    }

    // Validate signature data
    if (!req.body.technicianSignature || !req.body.customerSignature) {
      return res.status(400).json({
        success: false,
        error: "Both technician and customer signatures are required",
      });
    }

    // Update activation with signatures
    const updateData = {
      "installationReport.signatures": {
        technician: req.body.technicianSignature,
        customer: req.body.customerSignature,
        signedAt: new Date(),
      },
      updatedBy: req.user._id,
    };

    // Also update installation report details if provided
    if (req.body.installationReport) {
      if (req.body.installationReport.speedTest) {
        updateData["installationReport.speedTest"] =
          req.body.installationReport.speedTest;
      }
      if (req.body.installationReport.device) {
        updateData["installationReport.device"] =
          req.body.installationReport.device;
      }
      if (req.body.installationReport.datek) {
        updateData["installationReport.datek"] =
          req.body.installationReport.datek;
      }
      if (req.body.installationReport.serviceType) {
        updateData["installationReport.serviceType"] =
          req.body.installationReport.serviceType;
      }
      if (req.body.installationReport.packageSpeed) {
        updateData["installationReport.packageSpeed"] =
          req.body.installationReport.packageSpeed;
      }
      if (req.body.installationReport.fastelNumber) {
        updateData["installationReport.fastelNumber"] =
          req.body.installationReport.fastelNumber;
      }
      if (req.body.installationReport.contactPerson) {
        updateData["installationReport.contactPerson"] =
          req.body.installationReport.contactPerson;
      }
    }

    const updatedActivation = await PSBActivation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      {
        path: "psbOrderId",
        select: "orderNo customerName customerPhone address package",
      },
      { path: "createdBy updatedBy", select: "name email" },
    ]);

    res.json({
      success: true,
      data: updatedActivation,
      message: "Signatures submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting signatures:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit signatures",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
