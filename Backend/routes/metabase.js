import express from "express";
import metabaseDashboard from "../services/metabaseDashboard.js";
import metabaseService from "../services/metabase.js"; // Add this import

const router = express.Router();

router.post("/dashboard/create", async (req, res) => {
  try {
    console.log("Starting dashboard creation process...");
    const dashboardId = await metabaseDashboard.createDashboard();
    console.log("Dashboard created with ID:", dashboardId);
    res.json({ success: true, dashboardId });
  } catch (error) {
    console.error("Dashboard creation failed:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.get("/dashboard/:dashboardId", (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { timeRange, product, customer } = req.query;

    // Use the correct method from metabaseService
    const result = metabaseService.getPublicDashboard(parseInt(dashboardId), {
      timeRange,
      product,
      customer,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
