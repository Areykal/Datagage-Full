import pg from "pg";
import OpenAI from "openai";
import dotenv from "dotenv";
import NodeCache from "node-cache";

dotenv.config();

const { Pool } = pg;

class AnalyticsService {
  constructor() {
    // Initialize cache with 15 minutes TTL
    this.cache = new NodeCache({ stdTTL: 900 });
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });
  }

  validateMonths(months) {
    const parsedMonths = parseInt(months);
    if (isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 60) {
      throw new Error("Months must be between 1 and 60");
    }
    return parsedMonths;
  }

  // Add missing testConnection method
  async testConnection() {
    try {
      await this.pool.query("SELECT NOW()");
      return true;
    } catch (error) {
      throw new Error("Database connection failed: " + error.message);
    }
  }

  async getSalesData(months = 12, product = "all", customer = "all") {
    const cacheKey = `sales_data_${months}_${product}_${customer}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    // Updated SQL query to match the actual sales table schema
    let queryText = `
      SELECT 
        DATE_TRUNC('month', sale_date)::date as month,
        product,
        COUNT(*) as total_orders,
        SUM(quantity) as items_sold,
        SUM(total)::numeric(10,2) as total_revenue,
        COUNT(DISTINCT customer_name) as unique_customers,
        ROUND(AVG(total)::numeric, 2) as avg_order_value
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '${months} months'
    `;

    // Dynamic parameters for filtering
    const queryParams = [];
    let paramPosition = 1;

    if (product !== "all") {
      queryText += ` AND product = $${paramPosition++}`;
      queryParams.push(product);
    }
    if (customer !== "all") {
      queryText += ` AND customer_name = $${paramPosition}`;
      queryParams.push(customer);
    }

    queryText += ` GROUP BY 1, 2 ORDER BY 1 DESC, 2`;

    try {
      const result = await this.pool.query(queryText, queryParams);
      this.cache.set(cacheKey, result.rows);
      return result.rows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  async analyzeData(data, filterContext = {}) {
    try {
      // Validate input data
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected array");
      }

      if (data.length === 0) {
        return "No data available for analysis";
      }

      // Validate required fields
      const requiredFields = [
        "month",
        "total_revenue",
        "unique_customers",
        "avg_order_value",
        "total_orders",
      ];
      const hasRequiredFields = data.every((item) =>
        requiredFields.every((field) => item.hasOwnProperty(field))
      );

      if (!hasRequiredFields) {
        throw new Error("Invalid data format: missing required fields");
      }

      // Create cache key with filters included
      const {
        timeRange = 12,
        product = "all",
        customer = "all",
      } = filterContext;
      const cacheKey = `analysis_${timeRange}_${product}_${customer}_${JSON.stringify(
        data.length
      )}`;
      const cachedAnalysis = this.cache.get(cacheKey);
      if (cachedAnalysis) return cachedAnalysis;

      // Determine date range from data
      const dates = data
        .map((item) => new Date(item.month))
        .sort((a, b) => a - b);
      const startDate = dates[0]?.toISOString().split("T")[0] || "unknown";
      const endDate =
        dates[dates.length - 1]?.toISOString().split("T")[0] || "unknown";
      const dateRange = `from ${startDate} to ${endDate}`;

      // Create filter context description
      let filterDescription = `Time period: ${timeRange} months`;
      if (product !== "all") filterDescription += `, Product: ${product}`;
      if (customer !== "all") filterDescription += `, Customer: ${customer}`;

      const dataDescription = `
Monthly sales analytics ${dateRange} with the following filters applied:
${filterDescription}

The data includes:
- Total revenue per month
- Number of unique customers
- Average order value
- Total number of orders
- Products sold in each month
      `;

      try {
        const completion = await this.openai.chat.completions.create({
          model: "qwen2.5-72b-instruct",
          messages: [
            {
              role: "system",
              content: `You are an elite business intelligence analyst with expertise in retail sales data. Your analysis is known for being insightful, evidence-based, and directly actionable by business stakeholders.

ANALYSIS APPROACH:
1. Begin by deeply examining the data structure and identifying key metrics that tell the most compelling story
2. Apply statistical thinking to separate random fluctuations from meaningful patterns
3. Contextualize what the numbers mean for actual business performance
4. Connect insights across different metrics to reveal deeper business dynamics
5. Think step-by-step about cause-effect relationships in the data
6. Consider both short-term tactical opportunities and long-term strategic implications

RESPONSE FORMAT:
- Use <h3> tags for clear section headings
- Use <ul> and <li> tags for scannable bullet points
- Use <p> tags for explanatory paragraphs
- Put critical metrics and percentages in <strong> tags
- Create a maximum of 4-5 sections total for clarity

YOUR ANALYSIS MUST INCLUDE:

1. <h3>Executive Summary</h3>
   - 3-4 key findings that would be most valuable to a business leader
   - Must include quantifiable metrics with exact numbers/percentages
   - Highlight unexpected or counter-intuitive insights when present

2. <h3>Performance Deep-Dive</h3>
   - Analyze the most significant revenue drivers and detractors
   - Compare performance across different dimensions (products, time periods)
   - Highlight anomalies and their probable causes
   - Calculate and interpret month-over-month or period-over-period changes

3. <h3>Opportunity Identification</h3>
   - Specific product, customer or timing opportunities
   - Potential for revenue optimization
   - Cross-selling or upselling potential revealed by the data
   - Areas where small changes could yield significant results

4. <h3>Actionable Recommendations</h3>
   - 3-5 specific, concrete actions that could be implemented immediately
   - Each recommendation must be:
     - Directly tied to a specific data insight
     - Measurable in its potential impact
     - Realistic to implement
     - Specific about who should take what action

TAILORING:
- Focus exclusively on the data segment defined by the user's filters
- Adapt your analysis depth based on how specific the filters are (more specific filters = more granular analysis)
- If analyzing a subset of products or customers, provide comparative insights against the broader dataset when relevant

CONSTRAINTS:
- Avoid generic advice not backed by the specific data provided
- Do not make assumptions about business goals beyond what the data suggests
- Balance positive findings with areas for improvement
- Ensure recommendations are proportional to the insights (don't suggest major changes based on minor patterns)`,
            },
            {
              role: "user",
              content: `Based on the following filtered data:\n${dataDescription}\n\nQuery results:\n${JSON.stringify(
                data,
                null,
                2
              )}\n\nProvide your expert analysis with particular focus on:\n1. The most significant patterns that could impact business decisions\n2. Revenue optimization opportunities\n3. Customer behavior insights\n4. Specific, implementable recommendations that could improve performance within the next 3 months`,
            },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        });

        const analysis = completion.choices[0].message.content;
        this.cache.set(cacheKey, analysis, 900); // Cache for 15 minutes
        return analysis;
      } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
