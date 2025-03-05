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
};

export default analyticsService;
