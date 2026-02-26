const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { upload_images } = require('./multer');

/* =====================================================
   POST /api/analysis/upload-esp
   ESP base64 image upload
===================================================== */

router.post("/upload-esp", async (req, res) => {
  try {
    const { image_base64, crop, efficientnet_output, yolo_output } = req.body;

    if (!image_base64) {
      return res.status(400).json({
        success: false,
        message: "image_base64 is required",
      });
    }

    const uploadDir = "uploads/plant_images";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-esp.jpg`;
    const filePath = path.join(uploadDir, filename);

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");

    fs.writeFileSync(filePath, base64Data, "base64");

    let final_decision = {
      disease_name: null,
      is_healthy: true,
      confidence: 0,
    };

    if (efficientnet_output?.predicted_disease) {
      final_decision = {
        disease_name: efficientnet_output.predicted_disease,
        is_healthy: efficientnet_output.predicted_disease.toLowerCase() === "healthy",
        confidence: efficientnet_output.confidence || 0,
      };
    }

    return res.status(201).json({
      success: true,
      message: "ESP image saved",
      data: {
        image_url: `/${filePath}`,
        crop,
        yolo_output,
        efficientnet_output,
        final_decision,
        timestamp: new Date().toISOString()
      },
    });
  } catch (err) {
    console.error("ESP UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "ESP upload failed",
      error: err.message,
    });
  }
});

module.exports = router;
