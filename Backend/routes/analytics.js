import express from "express";
import analyticsService from "../services/analyticsService.js";

const router = express.Router();

router.get("/sales-analysis", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const product = req.query.product || "all";
    const customer = req.query.customer || "all";

    const data = await analyticsService.getSalesData(months, product, customer);

    // Create filter context for AI analysis
    const filterContext = {
      timeRange: months,
      product,
      customer,
    };

    const analysis = await analyticsService.analyzeData(data, filterContext);

    res.json({
      success: true,
      data: data,
      analysis: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch analytics data",
    });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 12;
    const product = req.query.product || "all";
    const customer = req.query.customer || "all";

    // Validate timeRange
    if (timeRange < 1 || timeRange > 60) {
      return res.status(400).json({
        success: false,
        error: "Time range must be between 1 and 60 months",
      });
    }

    const data = await analyticsService.getSalesData(
      timeRange,
      product,
      customer
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch sales data",
    });
  }
});

router.post("/insights", async (req, res) => {
  try {
    const { data, filterContext } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "Invalid data format. Expected array of sales data.",
      });
    }

    const insights = await analyticsService.analyzeData(data, filterContext);
    res.json(insights);
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate insights",
    });
  }
});

export default router;
