import axios from "axios";
import { auth } from "@/utils/auth";

// Base URL for API calls - replace with actual URL in production
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// No mock data - using real API calls

// Airbyte service
export const airbyteService = {
  // Source types
  async getSourceTypes() {
    const response = await axios.get(`${API_BASE_URL}/airbyte/source-types`);
    // Extract the source types array from the response
    if (response.data && response.data.sourceTypes) {
      return response.data.sourceTypes;
    }
    return response.data; // If it's already the correct format
  },

  async getSourceTypeDetails(sourceType) {
    const response = await axios.get(
      `${API_BASE_URL}/airbyte/source-types/${sourceType}`
    );
    if (response.data && response.data.typeDetails) {
      return response.data.typeDetails;
    }
    return response.data;
  },  // Sources
  async getSources() {
    try {
      const response = await axios.get(`${API_BASE_URL}/airbyte/sources`);
      return response.data;
    } catch (error) {
      console.error("Error fetching sources:", error);
      throw error;
    }
  },

  async getSourceDetails(sourceId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/airbyte/sources/${sourceId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching source details for ID ${sourceId}:`, error);
      throw error;
    }
  },async createSource(sourceData) {
    // Handle both traditional JSON payload and FormData
    let payload = sourceData;
    
    // If it's a plain object (not FormData), ensure it follows the expected structure
    if (!(sourceData instanceof FormData)) {
      payload = {
        sourceName: sourceData.name,
        sourceType: sourceData.sourceType,
        sourceConfig: sourceData.config || {}
      };
    }
    
    // Configure request with proper content type based on payload type
    const config = {
      headers: payload instanceof FormData ? 
        { 'Content-Type': 'multipart/form-data' } : 
        { 'Content-Type': 'application/json' }
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/airbyte/create/sources`,
      payload,
      config
    );
    return response.data;
  },

  async deleteSource(sourceId) {
    const response = await axios.delete(
      `${API_BASE_URL}/airbyte/sources/${sourceId}`
    );
    return response.data;
  },

  // Destinations
  getDestinations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching destinations:", error);
      throw error;
    }
  },

  // Connections
  getConnections: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/connections`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching connections:", error);
      throw error;
    }
  },
};

export default airbyteService;
