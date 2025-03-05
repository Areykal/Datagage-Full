import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

class MetabaseService {
  constructor() {
    this.METABASE_SITE_URL = process.env.METABASE_SITE_URL;
    this.METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

    // Validation schemas
    this.resourceSchema = z.object({
      dashboard: z.number().optional(),
      question: z.number().optional(),
    });
  }

  validateToken(token) {
    try {
      return jwt.verify(token, this.METABASE_SECRET_KEY);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  generateEmbedUrl(resource, filters = {}) {
    try {
      this.resourceSchema.parse(resource);
      const payload = {
        resource: resource,
        params: {
          time_range: filters.timeRange || "12",
          product: filters.product || "all",
          customer: filters.customer || "all",
        },
        exp: Math.round(Date.now() / 1000) + 10 * 60,
      };

      const token = jwt.sign(payload, this.METABASE_SECRET_KEY);
      return `${this.METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;
    } catch (error) {
      throw new Error(`Invalid resource: ${error.message}`);
    }
  }

  getPublicDashboard(dashboardId, filters = {}) {
    try {
      if (!dashboardId || isNaN(parseInt(dashboardId))) {
        throw new Error("Invalid dashboard ID");
      }

      const resource = { dashboard: parseInt(dashboardId) };
      const embedUrl = this.generateEmbedUrl(resource, filters);
      return { success: true, embedUrl };
    } catch (error) {
      console.error("Metabase embedding error:", error);
      return { success: false, error: error.message };
    }
  }

  getPublicChart(chartId) {
    try {
      const resource = { question: chartId };
      const embedUrl = this.generateEmbedUrl(resource);
      return { success: true, embedUrl };
    } catch (error) {
      console.error("Metabase embedding error:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new MetabaseService();
