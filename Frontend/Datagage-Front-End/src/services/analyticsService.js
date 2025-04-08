import apiClient from "./apiClient";

export const analyticsService = {
  /**
   * Get sales data with optional filters
   * @param {number} timeRange - Number of months to include (1-60)
   * @param {string} product - Product filter or "all"
   * @param {string} customer - Customer filter or "all"
   * @returns {Promise<Array>} Sales data
   */
  async getSalesData(timeRange = 12, product = "all", customer = "all") {
    try {
      const params = new URLSearchParams();
      params.append("timeRange", timeRange);
      if (product !== "all") params.append("product", product);
      if (customer !== "all") params.append("customer", customer);

      const response = await apiClient.get(
        `/api/analytics/sales?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching sales data:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch sales data"
      );
    }
  },

  /**
   * Get AI-generated insights for the sales data
   * @param {Array} data - Sales data array
   * @param {Object} filterContext - Information about current filters applied
   * @returns {Promise<string>} AI-generated insights
   */
  async getInsights(data, filterContext = {}) {
    try {
      const response = await apiClient.post("/api/analytics/insights", {
        data,
        filterContext,
      });
      return response.data;
    } catch (error) {
      console.error("Error generating insights:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate insights"
      );
    }
  },

  /**
   * Get combined sales data and analysis
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Object>} Sales data and analysis
   */
  async getSalesAnalysis(months = 12) {
    try {
      const response = await apiClient.get(
        `/api/analytics/sales-analysis?months=${months}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching analysis:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch analysis"
      );
    }
  },
  
  /**
   * Get Metabase dashboard URL for embedding
   * @returns {Promise<Object>} Object containing the Metabase URL
   */
  async getMetabaseUrl() {
    try {
      const response = await apiClient.get('/api/metabase/dashboard-url');
      return response.data;
    } catch (error) {
      console.error("Error fetching Metabase URL:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch Metabase dashboard URL"
      );
    }
  },
  
  /**
   * Export analytics data to CSV format
   * @param {Array} data - The data to export
   * @returns {string} CSV content
   */
  exportToCsv(data) {
    if (!data || !data.length) {
      throw new Error("No data to export");
    }
    
    // Get headers from first row
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV format
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const valueStr = String(value);
        if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
          // Escape quotes and wrap in quotes
          return `"${valueStr.replace(/"/g, '""')}"`;
        }
        return valueStr;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },
  
  /**
   * Get trends data for time series analysis
   * @param {number} timeRange - Time range in months
   * @param {string} metric - Metric to analyze ('revenue', 'orders', 'customers')
   * @returns {Promise<Array>} Trend data
   */
  async getTrendData(timeRange = 12, metric = 'revenue') {
    try {
      const response = await apiClient.get(
        `/api/analytics/trends?timeRange=${timeRange}&metric=${metric}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching trend data:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch trend data"
      );
    }
  }
};

export default analyticsService;
