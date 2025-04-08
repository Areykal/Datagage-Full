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
    console.log(`Fetching sales data: months=${months}, product=${product}, customer=${customer}`);
    
    // Clear cache to ensure we're getting fresh data during troubleshooting
    const cacheKey = `sales_data_${months}_${product}_${customer}`;
    this.cache.del(cacheKey);
    
    try {
      // Inspect schema first to debug column names
      await this.inspectTableSchema();      // More adaptive query that works with various possible schemas
      const schema = await this.inspectTableSchema();
      console.log("Using schema to build query:", schema);
      
      // Extract column names from schema
      const columnNames = schema.map(col => col.column_name);
      
      // Find the date column - check various possible column names
      let dateColumn = null;
      ['date', 'sale_date', 'order_date', 'transaction_date'].forEach(possible => {
        if (columnNames.includes(possible)) {
          dateColumn = possible;
        }
      });
      
      // Find price/amount column - check various possible column names
      let priceColumn = null;
      ['total_price', 'price', 'total', 'amount', 'revenue', 'total_amount'].forEach(possible => {
        if (columnNames.includes(possible)) {
          priceColumn = possible;
        }
      });
      
      // Find customer column - check various possible column names
      let customerColumn = null;
      ['sales_rep', 'customer_name', 'customer', 'client'].forEach(possible => {
        if (columnNames.includes(possible)) {
          customerColumn = possible;
        }
      });
      
      // Make sure we have the required columns
      if (!dateColumn) {
        throw new Error("Could not find date column in sales table");
      }
      
      if (!priceColumn) {
        throw new Error("Could not find price/total column in sales table");
      }
      
      if (!customerColumn) {
        console.warn("No customer column found, using constant value for customer metrics");
      }
      
      console.log(`Using date column: ${dateColumn}, price column: ${priceColumn}, customer column: ${customerColumn || 'none'}`);
      
      let queryText = `
        SELECT 
          DATE_TRUNC('month', ${dateColumn})::date as month,
          product,
          COUNT(*) as total_orders,
          SUM(quantity) as items_sold,
          SUM(${priceColumn})::numeric(10,2) as total_revenue,
          COUNT(DISTINCT ${customerColumn || '1'}) as unique_customers,
          ROUND(AVG(${priceColumn})::numeric, 2) as avg_order_value
        FROM sales
        WHERE ${dateColumn} >= NOW() - INTERVAL '${months} months'
      `;

      // Dynamic parameters for filtering
      const queryParams = [];
      let paramPosition = 1;

      if (product !== "all") {
        queryText += ` AND COALESCE(product_name, product, item) = $${paramPosition++}`;
        queryParams.push(product);
      }
      
      if (customer !== "all") {
        queryText += ` AND COALESCE(customer_name, customer, client) = $${paramPosition}`;
        queryParams.push(customer);
      }

      queryText += ` GROUP BY 1, 2 ORDER BY 1 DESC, 2`;

      console.log("Executing query:", queryText);
      console.log("With parameters:", queryParams);
      
      const result = await this.pool.query(queryText, queryParams);
      console.log(`Query returned ${result.rows.length} rows`);
      
      if (result.rows.length === 0) {
        console.log("No data returned. This could indicate a schema mismatch.");
      } else {
        console.log("Sample row:", result.rows[0]);
      }
      
      this.cache.set(cacheKey, result.rows);
      return result.rows;
    } catch (error) {
      console.error("Database error:", error);
      console.error("Error details:", error.detail || "No additional details");
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
      `;      try {
        console.log("Generating insights for data with length:", data.length);
        
        // Check if API key is available
        if (!process.env.OPENAI_API_KEY) {
          console.warn("Missing OpenAI API key. Generating fallback insights.");
          return this.generateFallbackInsights(data, filterContext);
        }
        
        // Prepare data summaries to reduce token usage
        // Limit the data to maximum 30 rows to avoid token limits
        const isLargeDataset = data.length > 30;
        let dataToSend = data;
        let dataSummary = {};

        if (isLargeDataset) {
          console.log(`Large dataset detected (${data.length} rows). Creating summary instead of sending full data.`);
          // Take the most recent 30 rows for smaller payload
          dataToSend = data.slice(0, 30);
          
          try {
            // Create data summaries
            const totalRevenue = data.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0);
            const totalOrders = data.reduce((sum, item) => sum + Number(item.total_orders || 0), 0);
            const uniqueProducts = new Set(data.map(item => item.product)).size;
            
            // Get top 5 products by revenue
            const productRevenue = {};
            data.forEach(item => {
              const product = item.product || 'Unknown';
              if (!productRevenue[product]) {
                productRevenue[product] = 0;
              }
              productRevenue[product] += Number(item.total_revenue || 0);
            });
            
            const topProducts = Object.entries(productRevenue)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([product, revenue]) => ({ product, revenue }));
            
            dataSummary = {
              totalRecords: data.length,
              totalRevenue,
              totalOrders,
              uniqueProducts,
              topProducts,
              samplingNote: "This analysis is based on a summary of the dataset. The full dataset contains more records than can be processed at once."
            };
          } catch (summaryError) {
            console.error("Error creating data summary:", summaryError);
            // If summary creation fails, just use the truncated data
            dataSummary = { note: "Data summary generation failed, using sample data only." };
          }
        }
        
        // Set a timeout to avoid hanging on API calls
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timed out after 20 seconds')), 20000);
        });        try {          // Race between API call and timeout
          const completion = await Promise.race([
            this.openai.chat.completions.create({
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
                  content: `Based on the following filtered data:\n${dataDescription}\n\n${
                    isLargeDataset 
                      ? `Data Summary:\n${JSON.stringify(dataSummary, null, 2)}\n\nSample data (showing first 50 records):\n` 
                      : 'Query results:\n'
                  }${JSON.stringify(
                    dataToSend,
                    null,
                    2
                  )}\n\nProvide your expert analysis with particular focus on:\n1. The most significant patterns that could impact business decisions\n2. Revenue optimization opportunities\n3. Customer behavior insights\n4. Specific, implementable recommendations that could improve performance within the next 3 months`,
                },
              ],
              temperature: 0.5,
              max_tokens: 1500,
            }),
            timeoutPromise
          ]);
          
          const analysis = completion.choices[0].message.content;
          this.cache.set(cacheKey, analysis, 900); // Cache for 15 minutes
          return analysis;
        } catch (error) {
          console.error("OpenAI API error:", error);
          // If the API call fails, generate fallback insights
          return this.generateFallbackInsights(data, filterContext);
        }
      } catch (error) {
        console.error(`Analysis failed: ${error.message}`);
        return this.generateFallbackInsights(data, filterContext);
      }
    } catch (error) {
      console.error(`Analysis failed: ${error.message}`);
      return this.generateFallbackInsights(data, filterContext);
    }
  }
  
  // Fallback method to generate insights without using AI
  generateFallbackInsights(data, filterContext = {}) {
    try {
      console.log("Generating fallback insights for data length:", data.length);
      
      // Extract basic statistics
      let totalRevenue = 0;
      let totalOrders = 0;
      const productTotals = {};
      const months = new Set();
      
      // Calculate basic statistics
      data.forEach(item => {
        totalRevenue += Number(item.total_revenue || 0);
        totalOrders += Number(item.total_orders || 0);
        months.add(item.month);
        
        if (!productTotals[item.product]) {
          productTotals[item.product] = 0;
        }
        productTotals[item.product] += Number(item.total_revenue || 0);
      });
      
      // Sort products by revenue
      const topProducts = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      // Generate a basic HTML report
      const insights = `
<h3>Executive Summary</h3>
<p>This is an automated data summary. The insights system is currently unable to generate AI-powered insights.</p>
<ul>
  <li>Total Revenue: <strong>$${totalRevenue.toLocaleString()}</strong></li>
  <li>Total Orders: <strong>${totalOrders.toLocaleString()}</strong></li>
  <li>Time Period Analyzed: <strong>${months.size} months</strong></li>
  <li>Products Analyzed: <strong>${Object.keys(productTotals).length}</strong></li>
</ul>

<h3>Performance Deep-Dive</h3>
<p>Top performing products by revenue:</p>
<ul>
  ${topProducts.map(([product, revenue]) => 
    `<li>${product}: <strong>$${revenue.toLocaleString()}</strong></li>`
  ).join('\n  ')}
</ul>

<h3>Basic Statistics</h3>
<p>Average Revenue per Order: <strong>$${(totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0).toLocaleString()}</strong></p>
<p>Average Orders per Month: <strong>${(months.size > 0 ? (totalOrders / months.size).toFixed(2) : 0).toLocaleString()}</strong></p>
`;
      
      return insights;    } catch (error) {
      console.error("Error generating fallback insights:", error);
      return "<h3>Data Analysis</h3><p>Unable to generate insights at this time. Please try again later.</p>";
    }
  }
}

export default new AnalyticsService();
