import api from "./api";

export const metabaseService = {
  /**
   * Create a new metabase dashboard
   * @returns {Promise<Object>} Dashboard creation result with ID
   */
  async createDashboard() {
    try {
      const response = await api.post("/api/metabase/dashboard/create");
      return response.data;
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw new Error(
        error.response?.data?.error || "Failed to create dashboard"
      );
    }
  },

  /**
   * Get an embeddable URL for a dashboard
   * @param {number} dashboardId - The dashboard ID
   * @param {Object} filters - Optional filters for the dashboard
   * @returns {Promise<string>} Embeddable dashboard URL
   */
  async getDashboardUrl(dashboardId, filters = {}) {
    try {
      if (!dashboardId) throw new Error("Dashboard ID is required");

      const queryParams = new URLSearchParams();

      if (filters.timeRange) queryParams.append("timeRange", filters.timeRange);
      if (filters.product) queryParams.append("product", filters.product);
      if (filters.customer) queryParams.append("customer", filters.customer);

      const queryString = queryParams.toString()
        ? `?${queryParams.toString()}`
        : "";

      const response = await api.get(
        `/api/metabase/dashboard/${dashboardId}${queryString}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to get dashboard URL");
      }

      return response.data.embedUrl;
    } catch (error) {
      console.error("Error getting dashboard URL:", error);
      throw new Error(
        error.response?.data?.error || "Failed to get dashboard URL"
      );
    }
  },
};

export default metabaseService;
