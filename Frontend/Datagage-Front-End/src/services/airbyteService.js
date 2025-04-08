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

// Mock data for development
const mockSources = [
  {
    sourceId: "1",
    name: "MySQL Database",
    sourceType: "mysql",
    status: "active",
    connectionConfiguration: {
      host: "mysql.example.com",
      port: 3306,
      database: "analytics",
      username: "dbuser",
      password: "password123",
    },
    createdAt: "2025-03-15T14:30:00Z",
    lastSync: "2025-03-30T08:45:22Z"
  },
  {
    sourceId: "2",
    name: "PostgreSQL Data Warehouse",
    sourceType: "postgres",
    status: "active",
    connectionConfiguration: {
      host: "postgres.example.com",
      port: 5432,
      database: "warehouse",
      username: "analyst",
      password: "p@ssw0rd",
    },
    createdAt: "2025-02-10T09:20:15Z",
    lastSync: "2025-03-29T22:18:05Z"
  },
  {
    sourceId: "3",
    name: "Google Sheets Marketing",
    sourceType: "google-sheets",
    status: "inactive",
    connectionConfiguration: {
      spreadsheetId: "1XYZ123abc",
      credentialsJson: "{...}",
    },
    createdAt: "2025-01-25T16:42:30Z",
    lastSync: null
  },
  {
    sourceId: "fb8fa66d-a573-44a8-9c3f-f32a2fab5941",
    name: "Sales Data",
    sourceType: "mysql",
    status: "active",
    connectionConfiguration: {
      host: "sales-db.example.com",
      port: 3306,
      database: "sales_data",
      username: "sales_analyst",
      password: "secure_pwd",
      sslMode: true
    },
    createdAt: "2025-03-01T10:15:30Z",
    lastSync: "2025-03-31T14:22:45Z"
  }
];

// Simulated API delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

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
  },
  // Sources
  async getSources() {
    try {
      const response = await axios.get(`${API_BASE_URL}/airbyte/sources`);
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock data for sources:", error);
      // Return mock data when API fails or in development mode
      // Wrap in same structure as API response would have
      return { data: mockSources };
    }
  },

  async getSourceDetails(sourceId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/airbyte/sources/${sourceId}`
      );
      return response.data;
    } catch (error) {
      console.warn("API call failed, using mock data for source details:", error);
      // Find the matching mock source by ID
      const mockSource = mockSources.find(source => source.sourceId === sourceId);
      if (mockSource) {
        return mockSource;
      }
      // If no matching source, throw the error
      throw new Error(`Source with ID ${sourceId} not found`);
    }
  },

  async createSource(sourceData) {
    const response = await axios.post(
      `${API_BASE_URL}/airbyte/create/sources`,
      sourceData
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
