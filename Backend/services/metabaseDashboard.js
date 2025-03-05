import axios from "axios";
import jwt from "jsonwebtoken";
import metabaseService from "./metabase.js"; // Add this import

class MetabaseDashboardService {
  constructor() {
    this.baseURL = process.env.METABASE_SITE_URL;
    this.sessionToken = null;
  }

  async authenticate() {
    try {
      console.log("Attempting Metabase OSS authentication with:", {
        url: `${this.baseURL}/api/session`,
        username: process.env.METABASE_USER,
      });

      const response = await axios.post(`${this.baseURL}/api/session`, {
        username: process.env.METABASE_USER,
        password: process.env.METABASE_PASSWORD,
      });

      console.log("Auth response:", {
        status: response.status,
        hasId: !!response.data?.id,
      });

      this.sessionToken = response.data.id;
      return this.sessionToken;
    } catch (error) {
      console.error("Authentication failed:", {
        error: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      throw error;
    }
  }

  async createDashboard() {
    try {
      const sessionToken = await this.authenticate();
      console.log("Got session token:", sessionToken);

      // Create dashboard
      const dashboardResponse = await axios.post(
        `${this.baseURL}/api/dashboard`,
        {
          name: "Sales Analytics Dashboard",
          description: "Overview of sales performance metrics",
        },
        {
          headers: { "X-Metabase-Session": sessionToken },
        }
      );

      const dashboardId = dashboardResponse.data.id;
      console.log("Created dashboard:", dashboardId);

      // Get tables
      const tablesResponse = await axios.get(
        `${this.baseURL}/api/database/33/tables`,
        {
          headers: { "X-Metabase-Session": sessionToken },
        }
      );

      const salesTable = tablesResponse.data.find((t) => t.name === "sales");
      if (!salesTable) {
        throw new Error("Sales table not found");
      }

      console.log("Found sales table:", salesTable.id);

      // Create cards
      const cards = [
        {
          name: "Monthly Sales Trend",
          query: {
            "source-table": salesTable.id,
            aggregation: [["sum", ["field", "total_amount", null]]],
            breakout: [["field", "sale_date", { "temporal-unit": "month" }]],
          },
          display: "line",
          visualization_settings: {
            "graph.dimensions": ["sale_date"],
            "graph.metrics": ["sum"],
          },
          size_x: 8,
          size_y: 6,
        },
        {
          name: "Product Performance",
          query: {
            "source-table": salesTable.id,
            aggregation: [["sum", ["field", "total_amount", null]], ["count"]],
            breakout: [["field", "product", null]],
          },
          display: "bar",
          visualization_settings: {
            "graph.dimensions": ["product"],
            "graph.metrics": ["sum", "count"],
          },
          size_x: 4,
          size_y: 6,
        },
      ];

      // Add cards to dashboard
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardResponse = await axios.post(
          `${this.baseURL}/api/card`,
          {
            ...card,
            display: card.display,
            visualization_settings: card.visualization_settings,
            dataset_query: {
              type: "query",
              query: card.query,
              database: 33,
            },
          },
          {
            headers: { "X-Metabase-Session": sessionToken },
          }
        );

        // Add card to dashboard
        await axios.post(
          `${this.baseURL}/api/dashboard/${dashboardId}/cards`,
          {
            cardId: cardResponse.data.id,
            row: 0,
            col: i * card.size_x,
            size_x: card.size_x,
            size_y: card.size_y,
          },
          {
            headers: { "X-Metabase-Session": sessionToken },
          }
        );

        console.log(`Added card ${card.name} to dashboard`);
      }

      return dashboardId;
    } catch (error) {
      console.error("Dashboard creation failed:", {
        message: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  }

  // Add method to get embed URL using the metabaseService
  getEmbedURL(dashboardId, filters = {}) {
    try {
      return metabaseService.getPublicDashboard(dashboardId, filters);
    } catch (error) {
      console.error("Error generating embed URL:", error);
      throw error;
    }
  }

  // Remove other methods temporarily to isolate the issue
}

export default new MetabaseDashboardService();
