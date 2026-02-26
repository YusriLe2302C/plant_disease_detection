const express = require('express');
const router = express.Router();
const Scan = require('../models/scan.model');

router.get("/history", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const scans = await Scan.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Scan.countDocuments();

    return res.json({
      success: true,
      scans,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
      error: err.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const scan = await Scan.findById(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found"
      });
    }

    return res.json({
      success: true,
      data: scan
    });
  } catch (err) {
    console.error("GET SCAN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scan",
      error: err.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const scan = await Scan.findByIdAndDelete(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found"
      });
    }

    return res.json({
      success: true,
      message: "Scan deleted successfully"
    });
  } catch (err) {
    console.error("DELETE SCAN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete scan",
      error: err.message
    });
  }
});

module.exports = router;
