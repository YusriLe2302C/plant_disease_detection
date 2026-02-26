const express = require("express");
const router = express.Router();

/* =====================================================
   ESP DEVICE REGISTRY (in-memory)
===================================================== */

const espDevices = new Map();

/* =====================================================
   POST /api/analysis/esp-status
===================================================== */

router.post("/esp-status", async (req, res) => {
  try {
    const { device_id, ip, free_heap } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id required",
      });
    }

    const existing = espDevices.get(device_id) || {
      enabled: true,
    };

    const updated = {
      ...existing,
      last_seen: new Date(),
      ip,
      free_heap,
    };

    espDevices.set(device_id, updated);

    return res.json({
      success: true,
      message: "ESP heartbeat received",
      enabled: updated.enabled,
      server_time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("ESP STATUS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "ESP status check failed",
    });
  }
});

/* =====================================================
   POST /api/analysis/esp-disable
===================================================== */

router.post("/esp-disable", async (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id required",
      });
    }

    const device = espDevices.get(device_id) || {};
    device.enabled = false;
    espDevices.set(device_id, device);

    return res.json({
      success: true,
      message: `ESP ${device_id} disabled`,
    });
  } catch (err) {
    console.error("ESP DISABLE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to disable ESP",
    });
  }
});

/* =====================================================
   POST /api/analysis/esp-enable
===================================================== */

router.post("/esp-enable", async (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id required",
      });
    }

    const device = espDevices.get(device_id) || {};
    device.enabled = true;
    espDevices.set(device_id, device);

    return res.json({
      success: true,
      message: `ESP ${device_id} enabled`,
    });
  } catch (err) {
    console.error("ESP ENABLE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to enable ESP",
    });
  }
});

module.exports = router;
