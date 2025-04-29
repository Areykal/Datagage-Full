import pg from "pg";
import OpenAI from "openai";
import dotenv from "dotenv";
import NodeCache from "node-cache";
// Import necessary services (assuming they are exported correctly)
import sourceService from "./sourceService.js";
import * as etlStatusService from "./etlStatusService.js"; // Use named import alias

dotenv.config();

const { Pool } = pg;

class AnalyticsService {
  constructor() {
    // Initialize cache with 15 minutes TTL
    this.cache = new NodeCache({ stdTTL: 900 });

    // Configure the database connection
    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "datagage_db",
      user: process.env.DB_USER || "datagage_user",
      password: process.env.DB_PASSWORD || "datagageuser",
      port: process.env.DB_PORT || 5432,
    };

    console.log("Analytics service connecting to database:", dbConfig.database);

    this.pool = new Pool(dbConfig);

    // Initialize OpenAI for insights generation
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });

    // Store references to other services if needed (dependency injection pattern)
    this.sourceService = sourceService;
    this.etlStatusService = etlStatusService;
  }

  validateMonths(months) {
    const parsedMonths = parseInt(months);
    if (isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 60) {
      throw new Error("Months must be between 1 and 60");
    }
    return parsedMonths;
  }

  // Test database connection
  async testConnection() {
    try {
      await this.pool.query("SELECT NOW()");
      return true;
    } catch (error) {
      throw new Error("Database connection failed: " + error.message);
    }
  }

  // First, inspect the schema to confirm table structure
  async inspectTableSchema() {
    try {
      console.log("Inspecting sales table schema...");

      // Query to get column names and types
      const schemaQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales'
      `;

      const result = await this.pool.query(schemaQuery);
      console.log("Table schema:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Schema inspection error:", error);
      return [];
    }
  }

  async getSalesData(months = 12, product = "all", customer = "all") {
    console.log(
      `Fetching sales overview: months=${months}, product=${product}, customer=${customer}`
    );

    let validatedMonths;
    let isAllTime = months === "all";

    if (!isAllTime) {
      try {
        validatedMonths = this.validateMonths(months);
      } catch (validationError) {
        console.error("Invalid input for months:", validationError.message);
        throw validationError;
      }
    }

    // Update cache key for 'all' time
    const cacheKey = `sales_overview_${
      isAllTime ? "all" : validatedMonths
    }_${product}_${customer}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached sales overview.");
      return cachedData;
    }

    try {
      const dateColumn = "sale_date";
      const priceColumn = "total";
      const customerColumn = "customer_name";
      const productColumn = "product";
      const quantityColumn = "quantity";

      // Define time periods - only relevant if not isAllTime
      let currentPeriodEndDate = "NOW()";
      let currentPeriodStartDate = `NOW() - INTERVAL '${validatedMonths} months'`;
      let previousPeriodEndDate = currentPeriodStartDate;
      let previousPeriodStartDate = `NOW() - INTERVAL '${
        validatedMonths * 2
      } months'`;

      // Build filter conditions
      let filterConditions = "";
      const queryParams = [];
      let paramPosition = 1;

      if (product !== "all") {
        filterConditions += ` AND ${productColumn} = $${paramPosition++}`;
        queryParams.push(product);
      }
      if (customer !== "all") {
        filterConditions += ` AND ${customerColumn} = $${paramPosition++}`;
        queryParams.push(customer);
      }

      // Build date conditions based on whether it's all time or specific months
      const currentPeriodDateCondition = isAllTime
        ? "1=1" // Always true for all time
        : `${dateColumn} >= ${previousPeriodEndDate} AND ${dateColumn} < ${currentPeriodEndDate}`;

      const previousPeriodDateCondition = isAllTime
        ? "1=0" // Always false for all time (no previous period)
        : `${dateColumn} >= ${previousPeriodStartDate} AND ${dateColumn} < ${previousPeriodEndDate}`;

      // Main query using CTEs
      const queryText = `
        WITH CurrentPeriod AS (
          SELECT
            SUM(${priceColumn}) AS total_revenue,
            COUNT(*) AS total_orders,
            COUNT(DISTINCT ${customerColumn}) AS unique_customers,
            SUM(${quantityColumn}) AS items_sold
          FROM sales
          WHERE ${currentPeriodDateCondition}
          ${filterConditions}
        ),
        PreviousPeriod AS (
          SELECT
            SUM(${priceColumn}) AS total_revenue,
            COUNT(*) AS total_orders,
            COUNT(DISTINCT ${customerColumn}) AS unique_customers,
            SUM(${quantityColumn}) AS items_sold
          FROM sales
          WHERE ${previousPeriodDateCondition} -- Will be 1=0 if isAllTime
          ${filterConditions}
        )
        SELECT
          -- Current Period Metrics (or All Time)
          COALESCE(cp.total_revenue, 0)::numeric(12,2) AS current_total_revenue,
          COALESCE(cp.total_orders, 0)::integer AS current_total_orders,
          COALESCE(cp.unique_customers, 0)::integer AS current_unique_customers,
          COALESCE(cp.items_sold, 0)::integer AS current_items_sold,
          CASE
            WHEN COALESCE(cp.total_orders, 0) > 0 THEN (COALESCE(cp.total_revenue, 0) / cp.total_orders)::numeric(10,2)
            ELSE 0::numeric(10,2)
          END AS current_avg_order_value,

          -- Previous Period Metrics (will be zero if isAllTime)
          COALESCE(pp.total_revenue, 0)::numeric(12,2) AS previous_total_revenue,
          COALESCE(pp.total_orders, 0)::integer AS previous_total_orders,
          COALESCE(pp.unique_customers, 0)::integer AS previous_unique_customers,
          COALESCE(pp.items_sold, 0)::integer AS previous_items_sold,
          CASE
            WHEN COALESCE(pp.total_orders, 0) > 0 THEN (COALESCE(pp.total_revenue, 0) / pp.total_orders)::numeric(10,2)
            ELSE 0::numeric(10,2)
          END AS previous_avg_order_value

        FROM CurrentPeriod cp, PreviousPeriod pp;
      `;

      console.log("Executing overview query:", queryText);
      console.log("With parameters:", queryParams);

      const result = await this.pool.query(queryText, queryParams);
      const row = result.rows[0];

      if (!row) {
        console.log("No overview data returned for the specified filters.");
        // Return zeroed data structure if no rows found
        const zeroData = {
          totalRevenue: 0,
          revenueTrend: 0,
          totalOrders: 0,
          ordersTrend: 0,
          uniqueCustomers: 0,
          customersTrend: 0,
          avgOrderValue: 0,
          aovTrend: 0,
          itemsSold: 0,
          itemsSoldTrend: 0, // Add items sold if needed
          // Include raw data if necessary, or fetch separately
          rawData: [], // Placeholder for detailed data if needed elsewhere
        };
        this.cache.set(cacheKey, zeroData);
        return zeroData;
      }

      console.log("Raw overview result:", row);

      // Calculate trends safely, handling division by zero and 'all time' case
      const calculateTrend = (current, previous) => {
        if (isAllTime) return null; // No trend for all time
        if (previous === 0 || previous === null || previous === undefined) {
          return current > 0 ? 100.0 : 0.0;
        }
        const trend = ((current - previous) / previous) * 100;
        // Round to one decimal place
        return parseFloat(trend.toFixed(1));
      };

      const overviewData = {
        totalRevenue: parseFloat(row.current_total_revenue),
        revenueTrend: calculateTrend(
          row.current_total_revenue,
          row.previous_total_revenue
        ),
        totalOrders: parseInt(row.current_total_orders),
        ordersTrend: calculateTrend(
          row.current_total_orders,
          row.previous_total_orders
        ),
        uniqueCustomers: parseInt(row.current_unique_customers),
        customersTrend: calculateTrend(
          row.current_unique_customers,
          row.previous_unique_customers
        ),
        avgOrderValue: parseFloat(row.current_avg_order_value),
        aovTrend: calculateTrend(
          row.current_avg_order_value,
          row.previous_avg_order_value
        ),
        itemsSold: parseInt(row.current_items_sold),
        itemsSoldTrend: calculateTrend(
          row.current_items_sold,
          row.previous_items_sold
        ),
        // Add items sold trend
        // Include raw data if necessary, or fetch separately
        rawData: [], // Placeholder - Raw data for charts/tables needs separate fetch/logic
      };

      console.log("Calculated overview data with trends:", overviewData);

      this.cache.set(cacheKey, overviewData);
      return overviewData;
    } catch (error) {
      console.error("Database error in getSalesData (overview):", error);
      if (error.detail) console.error("Error details:", error.detail);
      if (error.hint) console.error("Error hint:", error.hint);
      if (error.position) console.error("Error position:", error.position);
      throw new Error(`Failed to get sales overview: ${error.message}`);
    }
  }

  // --- IMPORTANT ---
  // The original getSalesData returned detailed, grouped data for charts/tables.
  // The new version returns aggregated overview metrics and trends.
  // We need a SEPARATE function or endpoint to get the detailed data for charts.
  // Let's create getSalesDetailData for that purpose.

  async getSalesDetailData(months = 12, product = "all", customer = "all") {
    console.log(
      `Fetching sales DETAIL data: months=${months}, product=${product}, customer=${customer}`
    );

    let validatedMonths;
    let isAllTime = months === "all";

    if (!isAllTime) {
      try {
        validatedMonths = this.validateMonths(months);
      } catch (validationError) {
        console.error("Invalid input for months:", validationError.message);
        throw validationError;
      }
    }

    // Update cache key for 'all' time
    const cacheKey = `sales_detail_${
      isAllTime ? "all" : validatedMonths
    }_${product}_${customer}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached sales detail data.");
      return cachedData;
    }

    try {
      const dateColumn = "sale_date";
      const priceColumn = "total";
      const customerColumn = "customer_name";
      const productColumn = "product";
      const quantityColumn = "quantity";

      // Build the base query
      let queryText = `
        SELECT
          DATE_TRUNC('month', ${dateColumn})::date as month,
          ${productColumn},
          ${customerColumn},
          COUNT(*) as total_orders,
          SUM(${quantityColumn}) as items_sold,
          SUM(${priceColumn})::numeric(10,2) as total_revenue,
          COUNT(DISTINCT ${customerColumn}) as unique_customers
        FROM sales
      `;

      // Add WHERE clause conditions
      const whereConditions = [];
      const queryParams = [];
      let paramPosition = 1;

      // Add date filter only if not 'all time'
      if (!isAllTime) {
        whereConditions.push(
          `${dateColumn} >= NOW() - ($${paramPosition++} || ' months')::INTERVAL`
        );
        queryParams.push(validatedMonths);
      }

      // Add product filter
      if (product !== "all") {
        whereConditions.push(`${productColumn} = $${paramPosition++}`);
        queryParams.push(product);
      }

      // Add customer filter
      if (customer !== "all") {
        whereConditions.push(`${customerColumn} = $${paramPosition++}`);
        queryParams.push(customer);
      }

      // Append WHERE clause if conditions exist
      if (whereConditions.length > 0) {
        queryText += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      // Add GROUP BY and ORDER BY
      queryText += ` GROUP BY 1, 2, 3 ORDER BY 1 DESC, 2, 3`;

      console.log("Executing detail query:", queryText);
      console.log("With parameters:", queryParams);

      const result = await this.pool.query(queryText, queryParams);
      console.log(`Detail query returned ${result.rows.length} rows`);

      if (result.rows.length === 0) {
        console.log("No detail data returned for the specified filters.");
      } else {
        console.log("Sample detail row:", result.rows[0]);
      }

      this.cache.set(cacheKey, result.rows);
      return result.rows;
    } catch (error) {
      console.error("Database error in getSalesDetailData:", error);
      if (error.detail) console.error("Error details:", error.detail);
      if (error.hint) console.error("Error hint:", error.hint);
      if (error.position) console.error("Error position:", error.position);
      throw new Error(`Failed to get sales detail data: ${error.message}`);
    }
  }

  /**
   * Get time series data for a specific table and column
   * @param {string} tableName - Name of the table to analyze
   * @param {string} timeColumn - Column containing time/date values
   * @param {string} granularity - Time granularity (day, week, month)
   * @param {Array} metrics - Metrics to calculate
   * @returns {Promise<Array>} Time series data
   */
  async getTimeSeriesData(
    tableName = "sales",
    timeColumn = "sale_date",
    granularity = "day",
    metrics = ["SUM(total)"]
  ) {
    const cacheKey = `time_series_${tableName}_${timeColumn}_${granularity}_${metrics.join(
      "_"
    )}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // Validate granularity to prevent SQL injection
      const validGranularities = [
        "hour",
        "day",
        "week",
        "month",
        "quarter",
        "year",
      ];
      if (!validGranularities.includes(granularity)) {
        throw new Error(`Invalid granularity: ${granularity}`);
      }

      // Build the query with sanitized table and column names
      // Note: This is still vulnerable to SQL injection if tableName and timeColumn are not validated
      // In a real app, you'd validate these against a whitelist of allowed table/column names
      let queryText = `
        SELECT 
          DATE_TRUNC('${granularity}', ${timeColumn}) as time_bucket,
      `;

      // Add each metric as a column
      queryText += metrics
        .map((metric, i) => {
          // Simple sanitization - extract function name and column
          const cleanMetric = metric.replace(/[^a-zA-Z0-9_()*.]/g, "");
          return `${cleanMetric} as metric_value${i > 0 ? i + 1 : ""}`;
        })
        .join(", ");

      queryText += `
        FROM ${tableName}
        GROUP BY 1
        ORDER BY 1
      `;

      console.log("Time series query:", queryText);

      const result = await this.pool.query(queryText);

      // Transform the result to a standard format
      const transformedData = result.rows.map((row) => {
        const formattedRow = {
          time_bucket: row.time_bucket,
          metric_value: parseFloat(row.metric_value) || 0,
        };

        // Add additional metrics if present
        metrics.forEach((metric, i) => {
          if (i > 0) {
            const metricKey = `metric_value${i + 1}`;
            if (row[metricKey] !== undefined) {
              formattedRow[`metric_value${i + 1}`] =
                parseFloat(row[metricKey]) || 0;
            }
          }
        });

        return formattedRow;
      });

      this.cache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching time series data:", error);
      throw new Error(`Failed to get time series data: ${error.message}`);
    }
  }

  /**
   * Get aggregated event counts from the sales table
   * @returns {Promise<Object>} Object with event counts
   */
  async getEventCounts() {
    const cacheKey = "event_counts";
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached event counts.");
      return cachedData;
    }

    try {
      // Example: Count orders, unique customers, total products sold
      // Adjust table and column names as per your actual schema
      const queryText = `
        SELECT 
          COUNT(*) AS total_orders,
          COUNT(DISTINCT customer_name) AS unique_customers,
          SUM(quantity) AS products_sold 
        FROM sales 
        WHERE sale_date >= NOW() - INTERVAL '30 days'; -- Example: last 30 days
      `;

      console.log("Executing event counts query:", queryText);
      const result = await this.pool.query(queryText);

      const counts = result.rows[0] || {
        total_orders: 0,
        unique_customers: 0,
        products_sold: 0,
      };

      // Convert counts to numbers
      const formattedCounts = {
        orders: Number(counts.total_orders) || 0,
        new_customers: Number(counts.unique_customers) || 0, // Assuming unique customers in period are 'new' for simplicity
        products_sold: Number(counts.products_sold) || 0,
        returns: 0, // Placeholder for returns, needs a separate query/table
      };

      this.cache.set(cacheKey, formattedCounts);
      console.log("Fetched event counts:", formattedCounts);
      return formattedCounts;
    } catch (error) {
      console.error("Error fetching event counts:", error);
      throw new Error(`Failed to get event counts: ${error.message}`);
    }
  }

  /**
   * Get top data sources based on some criteria (e.g., record count, last sync)
   * @returns {Promise<Array>} Array of top sources
   */
  async getTopSources(limit = 4) {
    const cacheKey = `top_sources_${limit}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached top sources.");
      return cachedData;
    }

    try {
      // Use sourceService to get sources and sort/limit them
      // This assumes sourceService.getSources() returns relevant data like name and maybe record count or last sync time
      const allSources = await this.sourceService.getSources();

      // Example sorting: by name for now, replace with a more meaningful metric if available
      const sortedSources = allSources.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // Format for consistency with frontend expectations (if any)
      const topSources = sortedSources.slice(0, limit).map((source) => ({
        id: source.source_id, // Use the local DB source_id
        name: source.name,
        recordCount: source.record_count || 0, // Placeholder, needs actual data if available
      }));

      this.cache.set(cacheKey, topSources);
      console.log("Fetched top sources:", topSources);
      return topSources;
    } catch (error) {
      console.error("Error fetching top sources:", error);
      throw new Error(`Failed to get top sources: ${error.message}`);
    }
  }

  /**
   * Get recent ETL job activities
   * @returns {Promise<Array>} Array of recent activities
   */
  async getRecentActivity(limit = 5) {
    const cacheKey = `recent_activity_${limit}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached recent activity.");
      return cachedData;
    }

    try {
      // Use etlStatusService to get recent jobs
      const recentJobs = await this.etlStatusService.getRecentJobs(limit);

      // Format the data as needed by the frontend
      const activities = recentJobs.map((job) => ({
        id: job.job_id,
        sourceName: job.source_name || `Source ID ${job.source_id}`, // Get source name if joined
        status: job.status,
        timestamp: job.updated_at || job.created_at,
        type: job.details?.stage || "sync", // Infer type from stage if possible
      }));

      this.cache.set(cacheKey, activities);
      console.log("Fetched recent activities:", activities);
      return activities;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }

  // NEW: Analyze data using OpenAI stream
  async analyzeDataStream(detailData, filterContext, overviewData) {
    console.log("Streaming AI insights analysis...");
    let dataSummary;
    try {
      dataSummary = this.prepareDataSummary(
        detailData,
        filterContext,
        overviewData
      );
      if (!dataSummary || dataSummary.startsWith("Error preparing")) {
        throw new Error(
          dataSummary || "Insufficient data to generate insights."
        );
      }
      console.log(
        "Prepared Data Summary for Streaming Prompt:\\n",
        dataSummary
      ); // Log the summary
    } catch (summaryError) {
      console.error(
        "Failed during data summary preparation for stream:",
        summaryError
      );
      // Rethrow or handle appropriately, maybe send error via stream?
      // For now, rethrow to be caught by the outer catch block
      throw summaryError;
    }

    // Define HTML tags as string variables
    const h4 = "<h4>";
    const h4End = "</h4>";
    const strong = "<strong>";
    const strongEnd = "</strong>";
    const ul = "<ul>";
    const ulEnd = "</ul>";
    const li = "<li>";
    const liEnd = "</li>";
    const p = "<p>";
    const pEnd = "</p>";
    const em = "<em>";
    const emEnd = "</em>";

    // --- MODIFICATION START: Add conditional prompt text based on product filter ---
    let productFocusInstruction = "";
    if (filterContext?.product && filterContext.product !== "all") {
      productFocusInstruction = `\\nIMPORTANT: The data is filtered for the product '${filterContext.product}'. Focus your entire analysis, findings, and recommendations *exclusively* on this specific product.\\n`;
    }
    // --- MODIFICATION END ---

    const prompt = `
      You are an expert Sales Analyst tasked with interpreting the following sales data summary.
      Your goal is to provide specific, actionable recommendations to improve sales performance based *directly* on the data provided.

      Data Summary:
      ${dataSummary}
      ${productFocusInstruction} {/* MODIFIED: Insert conditional instruction here */}
      Analysis Requirements:
      1.  **Interpret Key Metrics & Trends:** Analyze the provided overview metrics (Revenue, Orders, Customers, AOV, Items Sold) and their trends. Highlight significant changes or patterns.
      2.  **Identify Key Findings:** Based on the data (including overview and any detailed samples), identify the most important findings regarding customer behavior (e.g., repeat purchases, high-value customers), product performance (e.g., top sellers, potential bundles), and overall sales health. Clearly link findings to the data.
      3.  **Provide Actionable Recommendations:** For each key finding, propose specific, actionable recommendations. Ensure each recommendation directly addresses a specific finding. Examples include:
          *   Targeted marketing campaigns for specific customer segments.
          *   Sales strategies to boost AOV or order frequency.
          *   Customer retention initiatives based on loyalty patterns.
          *   Product bundling or cross-selling opportunities.
          *   Inventory or pricing adjustments based on product performance.
          *   Strategies to mitigate identified risks (e.g., customer concentration).
      4.  **Focus & Clarity:** Be concise and clear. Use bullet points for findings and recommendations. Avoid generic business advice; ensure all points are directly supported by the provided data summary.

      Formatting Instructions:
      Format the response as clean HTML content suitable for direct injection into a div.
      *   Use ${h4} for the main section titles: "Interpretation of Key Metrics & Trends", "Key Findings", and "Actionable Recommendations"${h4End}.
      *   Within "Interpretation", use ${p} tags for each metric analysis${pEnd}. Use ${strong} for metric names (e.g., ${strong}Total Revenue${strongEnd}).
      *   Within "Key Findings", use ${ul} and ${li} for each finding${liEnd}${ulEnd}. Use ${strong} to highlight the core finding in each list item${strongEnd}.
      *   Within "Actionable Recommendations", use ${ul}. For each recommendation, use ${li} and start with ${strong} for a brief title (e.g., ${strong}Enhance Customer Retention:${strongEnd}), followed by the detailed recommendation text${liEnd}${ulEnd}.
      *   Use ${p}, ${em} where appropriate for emphasis or paragraph structure${pEnd}${emEnd}.
      *   Do NOT include \\\`\\\`\\\`html markers or the <html> or <body> tags. Start directly with the analysis content (e.g., a ${h4} tag).
    `;

    try {
      console.log(
        "Sending request to OpenAI for streaming with updated prompt..."
      );
      const stream = await this.openai.chat.completions.create({
        model: "qwen2.5-72b-instruct", // Reverted model name
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      console.log("Received stream from OpenAI.");
      return stream; // Return the stream object
    } catch (error) {
      console.error("Error calling OpenAI API for streaming:", error);
      // Log more details if available
      if (error.response) {
        console.error("OpenAI Error Response Status:", error.response.status);
        console.error("OpenAI Error Response Data:", error.response.data);
      }
      throw new Error("Failed to generate streaming insights from AI.");
    }
  }

  // Helper to prepare data summary (Corrected Again - Attempt 4)
  prepareDataSummary(detailData, filterContext, overviewData) {
    try {
      let summary = "Filters Applied:\\n";
      summary += `- Time Range: ${
        filterContext?.months || "Default"
      } months\\n`;
      summary += `- Product: ${filterContext?.product || "All"}\\n`;
      summary += `- Customer: ${filterContext?.customer || "All"}\\n\\n`;

      if (overviewData && typeof overviewData === "object") {
        summary += "Overview Metrics:\\n";
        const formatTrend = (trend) =>
          trend !== null && trend !== undefined ? trend.toFixed(2) : "N/A";
        const formatValue = (value, digits = 2) =>
          value !== null && value !== undefined ? value.toFixed(digits) : "N/A";

        summary += `- Total Revenue: $${formatValue(
          overviewData.totalRevenue
        )} (Trend: ${formatTrend(overviewData.revenueTrend)}%)\\n`;
        summary += `- Total Orders: ${
          overviewData.totalOrders ?? "N/A"
        } (Trend: ${formatTrend(overviewData.ordersTrend)}%)\\n`;
        summary += `- Unique Customers: ${
          overviewData.uniqueCustomers ?? "N/A"
        } (Trend: ${formatTrend(overviewData.customersTrend)}%)\\n`;
        summary += `- Avg Order Value: $${formatValue(
          overviewData.avgOrderValue
        )} (Trend: ${formatTrend(overviewData.aovTrend)}%)\\n`;
        if (overviewData.itemsSold !== undefined) {
          summary += `- Items Sold: ${
            overviewData.itemsSold ?? "N/A"
          } (Trend: ${formatTrend(overviewData.itemsSoldTrend)}%)\\n`;
        }
        summary += "\\n";
      } else {
        summary += "Overview Metrics: Not available.\\n\\n";
      }

      if (Array.isArray(detailData) && detailData.length > 0) {
        summary += `Detailed Data Sample (First ${Math.min(
          detailData.length,
          5
        )} of ${detailData.length} records):\\n`;
        detailData.slice(0, 5).forEach((row, index) => {
          summary += `  Record ${index + 1}: Month=${row.month}, Product=${
            row.product || "N/A"
          }, Customer=${row.customer_name || "N/A"}, Revenue=$${formatValue(
            row.total_revenue
          )}\\n`;
        });
      } else {
        summary += "Detailed Data Sample: Not available or not provided.\\n";
      }
      return summary;
    } catch (error) {
      console.error("Error preparing data summary:", error);
      return "Error preparing data summary. Cannot generate insights."; // Return an error string
    }
  }
}

export default new AnalyticsService();
