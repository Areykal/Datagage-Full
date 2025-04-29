import express from "express";
import analyticsService from "../services/analyticsService.js";

const router = express.Router();

// New diagnostic endpoint to check database connection
router.get("/diagnostic", async (req, res) => {
  try {
    const dbStatus = await analyticsService.testConnection();
    const schema = await analyticsService.inspectTableSchema();

    res.json({
      success: true,
      dbStatus,
      schema,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database diagnostic error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Database connection failed",
    });
  }
});

// UPDATED /sales route: Returns OVERVIEW metrics + TRENDS
router.get("/sales", async (req, res) => {
  try {
    // Handle 'all' time range
    let months;
    if (req.query.months === "all") {
      months = "all";
    } else {
      months = parseInt(req.query.months) || 12;
      if (isNaN(months) || months < 1 || months > 60) {
        return res.status(400).json({
          success: false,
          error: "Time range must be between 1 and 60 months, or 'all'",
        });
      }
    }

    const product = req.query.product || "all";
    const customer = req.query.customer || "all";

    console.log(
      `GET /sales (overview) query params: months=${months}, product=${product}, customer=${customer}`
    );

    // Calls the refactored service method for overview + trends
    const overviewData = await analyticsService.getSalesData(
      months, // Pass 'all' or the number
      product,
      customer
    );

    console.log(`GET /sales (overview) returning data`);
    res.json(overviewData); // Return the overview object
  } catch (error) {
    console.error("Error in /sales (overview) route:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch sales overview data",
    });
  }
});

// NEW /sales-detail route: Returns DETAILED data for charts/tables
router.get("/sales-detail", async (req, res) => {
  try {
    // Handle 'all' time range
    let months;
    if (req.query.months === "all") {
      months = "all";
    } else {
      months = parseInt(req.query.months) || 12;
      if (isNaN(months) || months < 1 || months > 60) {
        return res.status(400).json({
          success: false,
          error: "Time range must be between 1 and 60 months, or 'all'",
        });
      }
    }

    const product = req.query.product || "all";
    const customer = req.query.customer || "all";

    console.log(
      `GET /sales-detail query params: months=${months}, product=${product}, customer=${customer}`
    );

    // Calls the new service method for detailed data
    const detailData = await analyticsService.getSalesDetailData(
      months, // Pass 'all' or the number
      product,
      customer
    );

    console.log(`GET /sales-detail returning ${detailData.length} records`);
    res.json(detailData); // Return the array of detailed records
  } catch (error) {
    console.error("Error in /sales-detail route:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch sales detail data",
    });
  }
});

// New routes for Chart.js integration

// Time series data endpoint
router.get("/time-series", async (req, res) => {
  try {
    // Default values and safe extraction of query params
    const granularity = req.query.granularity || "day";
    const tableName = req.query.tableName || null;
    const timeColumn = req.query.timeColumn || "created_at";

    // Parse metrics as an array, or use default if not provided
    let metrics;
    if (req.query.metrics) {
      try {
        // Try to parse as JSON if it's a JSON string
        metrics =
          typeof req.query.metrics === "string"
            ? JSON.parse(req.query.metrics)
            : req.query.metrics;
      } catch (e) {
        // If parsing fails, treat it as a single metric
        metrics = [req.query.metrics];
      }
    } else {
      metrics = ["count(*)"];
    }

    console.log(
      `Time series request: granularity=${granularity}, table=${tableName}, metrics=`,
      metrics
    );

    // If we have the tableName and timeColumn, use them for specific data
    // Otherwise fallback to generic sales data
    let data;
    if (tableName) {
      data = await analyticsService.getTimeSeriesData(
        tableName,
        timeColumn,
        granularity,
        metrics
      );
    } else {
      // Fallback to sample data if specific table analytics not available
      const months = parseInt(req.query.months) || 6;
      try {
        const salesData = await analyticsService.getSalesData(months);

        // Transform sales data into time series format
        data = salesData.map((item) => ({
          time_bucket: item.month,
          metric_value: item.total_revenue || item.items_sold || 0,
        }));
      } catch (error) {
        console.error("Error fetching sales data for time series:", error);
        // Return empty array rather than failing
        data = [];
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error in time-series endpoint:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch time series data",
    });
  }
});

// Event counts endpoint
router.get("/event-counts", async (req, res) => {
  try {
    // For now, return sample data
    const data = {
      orders: 124,
      new_customers: 18,
      products_sold: 432,
      returns: 7,
    };

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch event counts",
    });
  }
});

// Top sources endpoint
router.get("/top-sources", async (req, res) => {
  try {
    const sources = await analyticsService.getTopSources();
    res.json(sources);
  } catch (error) {
    // Fallback to sample data
    const sampleSources = [
      { id: 1, name: "Customer Database", recordCount: 5243 },
      { id: 2, name: "Product Catalog", recordCount: 1872 },
      { id: 3, name: "Sales Transactions", recordCount: 9876 },
      { id: 4, name: "Inventory Data", recordCount: 3421 },
    ];

    res.json(sampleSources);
  }
});

// Recent activity endpoint
router.get("/recent-activity", async (req, res) => {
  try {
    const activities = await analyticsService.getRecentActivity();
    res.json(activities);
  } catch (error) {
    // Fallback to sample data
    const sampleActivities = [
      {
        id: 1,
        sourceName: "Customer Database",
        status: "Completed",
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        sourceName: "Product Catalog",
        status: "Running",
        timestamp: new Date().toISOString(),
      },
      {
        id: 3,
        sourceName: "Sales Transactions",
        status: "Completed",
        timestamp: new Date().toISOString(),
      },
    ];

    res.json(sampleActivities);
  }
});

// NEW route for streaming AI insights
router.post("/insights-stream", async (req, res) => {
  try {
    const { detailData, filterContext, overviewData } = req.body;

    // Basic validation (can be expanded)
    if (!filterContext) {
      return res.status(400).json({
        success: false,
        error: "Filter context is required for streaming insights.",
      });
    }

    console.log("Received request for /insights-stream");

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Flush the headers to establish the connection

    const stream = await analyticsService.analyzeDataStream(
      detailData,
      filterContext,
      overviewData
    );

    console.log("Piping OpenAI stream to response...");

    // Iterate over the stream and send chunks to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // Format as SSE: data: {chunk}\n\n
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Signal the end of the stream
    res.write("data: [DONE]\n\n");
    res.end();
    console.log("Stream finished.");
  } catch (error) {
    console.error("Error in /insights-stream route:", error);
    // If headers are already sent, we can't send a JSON error
    // We can try sending an error event if the connection is still open
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to stream AI insights",
      });
    } else {
      // Attempt to send an error event via SSE
      try {
        res.write(
          `data: ${JSON.stringify({
            error: error.message || "Streaming error occurred",
          })}\n\n`
        );
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (sseError) {
        console.error("Failed to send SSE error event:", sseError);
        res.end(); // Ensure the connection is closed
      }
    }
  }
});

export default router;
