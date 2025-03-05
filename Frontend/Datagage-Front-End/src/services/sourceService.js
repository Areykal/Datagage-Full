import { airbyteService } from "./airbyteService";
import { notificationStore } from "@/stores/notification";
import { notify } from "@/utils/notifications";
import { apiClient } from "./apiClient";

// Debug flag - set to true to log service operations
const DEBUG = true;

/**
 * Centralized service for managing data sources
 */
export const sourceService = {
  /**
   * Fetch a list of all available sources
   * @returns {Promise<Array>} List of sources
   */
  async getSources() {
    if (DEBUG) console.log("[SOURCE SERVICE] Getting sources");
    try {
      const sources = await airbyteService.getSources();
      return sources;
    } catch (error) {
      if (DEBUG)
        console.error("[SOURCE SERVICE] Error getting sources:", error);
      // Use both notification methods for redundancy during debugging
      notificationStore.error("Failed to load sources");
      notify.error("Failed to load sources");
      throw error;
    }
  },

  /**
   * Get detailed information about a specific source
   * @param {string} sourceId - ID of the source to retrieve
   * @returns {Promise<Object>} Source details
   */
  async getSourceDetails(sourceId) {
    console.log("Fetching source details for ID:", sourceId);
    try {
      const response = await apiClient.get(`/api/airbyte/sources/${sourceId}`);
      console.log("Source details response:", response.data);

      // Ensure sourceType exists
      if (!response.data.sourceType) {
        console.warn(
          "sourceType is missing in response, checking if source type is available elsewhere"
        );
        // If sourceType is missing but connectionConfiguration.sourceType exists
        if (response.data.connectionConfiguration?.sourceType) {
          response.data.sourceType =
            response.data.connectionConfiguration.sourceType;
        }
      }

      return response.data;
    } catch (error) {
      console.error("Error in getSourceDetails:", error);
      throw error;
    }
  },

  /**
   * Create a new data source
   * @param {Object} sourceData - Data for the new source
   * @returns {Promise<Object>} Created source
   */
  async createSource(sourceData) {
    if (DEBUG) console.log("[SOURCE SERVICE] Creating source:", sourceData);
    try {
      const result = await airbyteService.createSource(sourceData);
      const sourceName =
        sourceData.sourceName || sourceData.name || "New source";
      notify.success(`Source "${sourceName}" created successfully`);
      return result;
    } catch (error) {
      if (DEBUG)
        console.error("[SOURCE SERVICE] Error creating source:", error);
      notify.error("Failed to create source");
      throw error;
    }
  },

  /**
   * Delete an existing source
   * @param {string} sourceId - ID of the source to delete
   * @returns {Promise<Object>} Result of the deletion operation
   */
  async deleteSource(sourceId) {
    if (DEBUG) console.log("[SOURCE SERVICE] Deleting source:", sourceId);
    try {
      const result = await airbyteService.deleteSource(sourceId);
      notify.success("Source deleted successfully");
      return result;
    } catch (error) {
      if (DEBUG)
        console.error("[SOURCE SERVICE] Error deleting source:", error);
      notify.error("Failed to delete source");
      throw error;
    }
  },

  /**
   * Get a list of all available source types
   * @returns {Promise<Array>} List of source types
   */
  async getSourceTypes() {
    if (DEBUG) console.log("[SOURCE SERVICE] Getting source types");
    try {
      const response = await airbyteService.getSourceTypes();
      // Check if the response has the expected structure
      if (response && response.sourceTypes) {
        return response.sourceTypes;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.error(
          "[SOURCE SERVICE] Unexpected source types response format:",
          response
        );
        // Return a default array to prevent further errors
        return [];
      }
    } catch (error) {
      if (DEBUG)
        console.error("[SOURCE SERVICE] Error getting source types:", error);
      notify.error("Failed to load source types");
      throw error;
    }
  },

  /**
   * Get detailed information about a specific source type
   * @param {string} sourceType - Type identifier
   * @returns {Promise<Object>} Source type details
   */
  async getSourceTypeDetails(sourceType) {
    if (DEBUG)
      console.log(
        "[SOURCE SERVICE] Getting source type details for:",
        sourceType
      );
    try {
      const typeDetails = await airbyteService.getSourceTypeDetails(sourceType);
      return typeDetails;
    } catch (error) {
      if (DEBUG)
        console.error(
          "[SOURCE SERVICE] Error getting source type details:",
          error
        );
      notify.error("Failed to load source type details");
      throw error;
    }
  },

  /**
   * Test a connection to a data source
   * @param {Object} connectionConfig - Connection configuration to test
   * @param {string} sourceType - Type of source to test
   * @returns {Promise<boolean>} True if connection succeeded
   */
  async testConnection(connectionConfig, sourceType) {
    if (DEBUG)
      console.log(
        "[SOURCE SERVICE] Testing connection for:",
        sourceType,
        connectionConfig
      );
    try {
      // This would be replaced with an actual API call in production
      // For now, simulate a delay and return success
      await new Promise((resolve) => setTimeout(resolve, 1500));
      notify.success("Connection successful");
      return true;
    } catch (error) {
      if (DEBUG)
        console.error("[SOURCE SERVICE] Connection test failed:", error);
      notify.error("Connection test failed");
      throw error;
    }
  },

  /**
   * Sync a source to initiate data extraction
   * @param {string} sourceId - ID of the source to sync
   * @returns {Promise<Object>} Result of sync operation
   */
  async syncSource(sourceId, sourceName) {
    if (DEBUG)
      console.log("[SOURCE SERVICE] Syncing source:", sourceId, sourceName);
    try {
      // This would call the actual sync API in production
      await new Promise((resolve) => setTimeout(resolve, 1500));
      notify.success(`Source ${sourceName || sourceId} synced successfully`);
      return true;
    } catch (error) {
      if (DEBUG) console.error("[SOURCE SERVICE] Sync failed:", error);
      notify.error("Failed to sync source");
      throw error;
    }
  },
};

// Log that the service is loaded
if (DEBUG) console.log("[SOURCE SERVICE] Service initialized");

export default sourceService;
