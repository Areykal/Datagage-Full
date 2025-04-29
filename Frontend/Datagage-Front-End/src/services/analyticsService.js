import apiClient from "./apiClient";

class AnalyticsService {
  /**
   * Get sales OVERVIEW data with trends
   * @param {Object} filters - Filter options
   * @param {number} filters.months - Number of months to include (1-60)
   * @param {string} filters.product - Product filter or "all"
   * @param {string} filters.customer - Customer filter or "all"
   * @returns {Promise<Object>} Sales overview object with metrics and trends
   */
  async getSalesOverview(filters = {}) {
    try {
      // Check for 'all' time range
      const months =
        filters.timeRange === "all"
          ? "all"
          : filters.months || filters.timeRange || 12;
      const product = filters.product || "all";
      const customer = filters.customer || "all";

      const params = new URLSearchParams();
      // Append 'all' or the number
      params.append("months", months);
      if (product !== "all") params.append("product", product);
      if (customer !== "all") params.append("customer", customer);

      console.log(`Fetching sales OVERVIEW with params: ${params.toString()}`);

      // Calls the backend /api/analytics/sales route which now returns overview+trends
      const response = await apiClient.get(
        `/api/analytics/sales?${params.toString()}`
      );

      console.log(`Received sales overview data`);
      // Ensure a valid object is returned even if backend sends null/undefined
      return (
        response.data || {
          totalRevenue: 0,
          revenueTrend: 0,
          totalOrders: 0,
          ordersTrend: 0,
          uniqueCustomers: 0,
          customersTrend: 0,
          avgOrderValue: 0,
          aovTrend: 0,
          itemsSold: 0,
          itemsSoldTrend: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching sales overview:", error);
      // Return zeroed data on error
      return {
        totalRevenue: 0,
        revenueTrend: 0,
        totalOrders: 0,
        ordersTrend: 0,
        uniqueCustomers: 0,
        customersTrend: 0,
        avgOrderValue: 0,
        aovTrend: 0,
        itemsSold: 0,
        itemsSoldTrend: 0,
      };
      // Or re-throw if preferred:
      // throw new Error(
      //   error.response?.data?.error || "Failed to fetch sales overview"
      // );
    }
  }

  /**
   * Get sales DETAIL data for charts/tables
   * @param {Object} filters - Filter options
   * @param {number} filters.months - Number of months to include (1-60)
   * @param {string} filters.product - Product filter or "all"
   * @param {string} filters.customer - Customer filter or "all"
   * @returns {Promise<Array>} Detailed sales data array
   */
  async getSalesDetailData(filters = {}) {
    try {
      // Check for 'all' time range
      const months =
        filters.timeRange === "all"
          ? "all"
          : filters.months || filters.timeRange || 12;
      const product = filters.product || "all";
      const customer = filters.customer || "all";

      const params = new URLSearchParams();
      // Append 'all' or the number
      params.append("months", months);
      if (product !== "all") params.append("product", product);
      if (customer !== "all") params.append("customer", customer);

      console.log(`Fetching sales DETAIL with params: ${params.toString()}`);

      // Calls the NEW backend /api/analytics/sales-detail route
      const response = await apiClient.get(
        `/api/analytics/sales-detail?${params.toString()}`
      );

      console.log(
        `Received ${response.data?.length || 0} records from sales detail API`
      );
      return response.data || []; // Ensure array is returned
    } catch (error) {
      console.error("Error fetching sales detail data:", error);
      // Return empty array on error
      return [];
      // Or re-throw if preferred:
      // throw new Error(
      //   error.response?.data?.error || "Failed to fetch sales detail data"
      // );
    }
  }

  /**
   * Get time series data with optional filters
   * @param {Object} params - Parameters for time series data
   * @param {string} params.granularity - Time granularity (hour, day, week, month)
   * @returns {Promise<Array>} Time series data
   */
  async getTimeSeriesData(params = {}) {
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (params.granularity)
        queryParams.append("granularity", params.granularity);
      if (params.tableName) queryParams.append("tableName", params.tableName);
      if (params.timeColumn)
        queryParams.append("timeColumn", params.timeColumn);
      if (params.metrics)
        queryParams.append("metrics", JSON.stringify(params.metrics));

      const response = await apiClient.get(
        `/api/analytics/time-series?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching time series data:", error);

      // If we're in development mode, return sample data
      if (process.env.NODE_ENV === "development") {
        return this.getSampleTimeSeriesData();
      }

      throw new Error(
        error.response?.data?.error || "Failed to fetch time series data"
      );
    }
  }

  /**
   * Get event counts for analytics
   * @returns {Promise<Object>} Event counts
   */
  async getEventCounts() {
    try {
      const response = await apiClient.get("/api/analytics/event-counts");
      return response.data;
    } catch (error) {
      console.error("Error fetching event counts:", error);

      // Return sample data in development mode
      if (process.env.NODE_ENV === "development") {
        return {
          order_placed: 356,
          checkout_completed: 372,
          product_viewed: 1278,
          cart_abandoned: 118,
        };
      }

      throw new Error(
        error.response?.data?.error || "Failed to fetch event counts"
      );
    }
  }

  /**
   * Get top data sources
   * @returns {Promise<Array>} Top sources data
   */
  async getTopSources() {
    try {
      const response = await apiClient.get("/api/analytics/top-sources");
      return response.data;
    } catch (error) {
      console.error("Error fetching top sources:", error);

      // Return sample data in development mode
      if (process.env.NODE_ENV === "development") {
        return [
          { id: 1, name: "E-commerce Platform", recordCount: 4250 },
          { id: 2, name: "CRM System", recordCount: 1876 },
          { id: 3, name: "Marketing Analytics", recordCount: 1520 },
          { id: 4, name: "Inventory Management", recordCount: 980 },
        ];
      }

      throw new Error(
        error.response?.data?.error || "Failed to fetch top sources"
      );
    }
  }
  /**
   * Get recent system activity
   * @returns {Promise<Array>} Recent activity data
   */
  async getRecentActivity() {
    try {
      const response = await apiClient.get("/api/analytics/recent-activity");
      return response.data;
    } catch (error) {
      console.error("Error fetching recent activity:", error);

      // Return sample data in development mode
      if (import.meta.env.MODE === "development") {
        return [
          {
            id: "act-123",
            sourceName: "E-commerce Platform",
            type: "data_refresh",
            timestamp: new Date().toISOString(),
          },
          {
            id: "act-122",
            sourceName: "CRM System",
            type: "data_refresh",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "act-121",
            sourceName: "Marketing Analytics",
            type: "report_generation",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
        ];
      }

      throw new Error(
        error.response?.data?.error || "Failed to fetch recent activity"
      );
    }
  }

  // Sample data generator methods
  getSampleSalesData() {
    const products = [
      "Premium Widget",
      "Standard Package",
      "Budget Solution",
      "Enterprise Suite",
      "Starter Kit",
    ];
    const customers = [
      "Acme Corporation",
      "Smith Enterprises",
      "Tech Solutions Inc",
      "Global Logistics",
      "Retail Partners",
    ];
    const months = 12;
    const result = [];

    const today = new Date();

    for (let i = 0; i < months; i++) {
      const month = new Date(today);
      month.setMonth(month.getMonth() - i);
      const monthStr = month.toISOString().substring(0, 10); // YYYY-MM-DD format

      // Add data for each product in this month
      products.forEach((product) => {
        // Generate some fake sales data with reasonable trends
        const baseRevenue = Math.round(10000 + Math.random() * 30000);
        const orders = Math.round(20 + Math.random() * 80);

        result.push({
          month: monthStr,
          product: product,
          customer: customers[Math.floor(Math.random() * customers.length)],
          total_orders: orders,
          total_revenue: baseRevenue,
          avg_order_value: Math.round(baseRevenue / orders),
        });
      });
    }

    return result;
  }

  getSampleTimeSeriesData() {
    const data = [];
    const today = new Date();

    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Create some patterns in the data - higher on weekends, gradual uptrend
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendBoost = isWeekend ? 1.4 : 1;
      const uptrend = 1 + ((30 - i) / 30) * 0.15; // 15% uptrend over the period

      // Base value with some randomness
      const baseValue = 4200;
      const randomness = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15

      data.push({
        time_bucket: date.toISOString(),
        metric_value: Math.round(
          baseValue * weekendBoost * uptrend * randomness
        ),
      });
    }

    return data;
  }
}

export default new AnalyticsService();
