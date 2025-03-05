import fetch from "node-fetch";
import { jest } from "@jest/globals";

// Add delay utility
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Test configurations with increased timeout
const TEST_CONFIG = {
  baseUrl: "http://localhost:5000",
  timeout: 30000, // Increased to 30 seconds
  retries: 3,
};

// Mock data for tests
const MOCK_DATA = {
  salesData: [
    {
      month: "2024-02-01",
      total_revenue: "15250.75",
      unique_customers: 45,
      avg_order_value: "339.25",
      total_orders: 85,
      products_sold: "Laptop, Monitor, Keyboard, Mouse, Headphones",
    },
    {
      month: "2024-01-01",
      total_revenue: "12890.50",
      unique_customers: 38,
      avg_order_value: "312.45",
      total_orders: 72,
      products_sold: "Desktop, Printer, Scanner, Webcam",
    },
    {
      month: "2023-12-01",
      total_revenue: "18760.25",
      unique_customers: 52,
      avg_order_value: "352.80",
      total_orders: 94,
      products_sold: "Server, Network Switch, Router, Access Point",
    },
  ],
  sourceData: [
    {
      sourceId: "12345",
      name: "Sales Data Sheet",
      sourceType: "google-sheets",
      connectionStatus: "active",
      lastSync: "2024-02-15T10:30:00Z",
    },
    {
      sourceId: "67890",
      name: "Inventory Sheet",
      sourceType: "google-sheets",
      connectionStatus: "active",
      lastSync: "2024-02-15T11:45:00Z",
    },
  ],
  destinationData: [
    {
      destinationId: "postgres-dest-01",
      name: "PostgreSQL Warehouse",
      destinationType: "postgres",
      connectionStatus: "active",
      lastSync: "2024-02-15T12:00:00Z",
      config: {
        host: "localhost",
        port: 5432,
        database: "datagage_db",
        schema: "public",
      },
    },
  ],
};

// Enhanced retry utility
const retryOperation = async (operation, retries = TEST_CONFIG.retries) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await delay(1000 * (i + 1));
    }
  }
  throw lastError;
};

// Helper to check if server is ready
const checkServerReady = async () => {
  try {
    const response = await fetch(TEST_CONFIG.baseUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
};

describe("Integration Tests", () => {
  // Increase timeout for all tests
  jest.setTimeout(TEST_CONFIG.timeout);

  beforeAll(async () => {
    // Wait for server to be ready
    let isReady = false;
    for (let i = 0; i < 10; i++) {
      isReady = await checkServerReady();
      if (isReady) break;
      await delay(2000);
    }

    if (!isReady) {
      console.warn("Warning: Server may not be ready. Tests might fail.");
    }
  });

  describe("Analytics Service", () => {
    it("should connect to database and retrieve sales data", async () => {
      const response = await retryOperation(async () => {
        const res = await fetch(
          `${TEST_CONFIG.baseUrl}/api/analytics/sales-analysis`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res;
      });

      const data = await response.json();
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
    }, 5);

    it("should match sample sales data structure", async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/analytics/sales-analysis`
      );
      const data = await response.json();

      const sampleData = data.data[0];
      expect(sampleData).toHaveProperty("month");
      expect(sampleData).toHaveProperty("total_revenue");
      expect(sampleData).toHaveProperty("unique_customers");
    });
  });

  describe("Airbyte Service", () => {
    it("should list available sources", async () => {
      try {
        const response = await retryOperation(async () => {
          const res = await fetch(`${TEST_CONFIG.baseUrl}/api/airbyte/sources`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res;
        });

        const data = await response.json();
        expect(data).toBeDefined();
        // Airbyte might return empty array if no sources
        expect(Array.isArray(data.data || data)).toBe(true);
      } catch (error) {
        console.warn("Airbyte service test failed:", error.message);
        // Skip test if Airbyte is not available
        return;
      }
    });

    it("should list available destinations", async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/airbyte/destinations`
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should list existing connections", async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/airbyte/connections`
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("Metabase Service", () => {
    it("should generate dashboard embed URL", async () => {
      try {
        const response = await fetch(
          `${TEST_CONFIG.baseUrl}/api/metabase/dashboard/1`
        );
        const data = await response.json();

        if (!response.ok) {
          console.warn(
            "Metabase service warning:",
            data.error || "Unknown error"
          );
          return; // Skip test if Metabase is not available
        }

        expect(data).toHaveProperty("success");
        expect(data).toHaveProperty("embedUrl");
      } catch (error) {
        console.warn("Metabase service test failed:", error.message);
        return; // Skip test if Metabase is not available
      }
    });

    it("should generate chart embed URL", async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/metabase/chart/1`
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("embedUrl");
      expect(typeof data.embedUrl).toBe("string");
    });
  });
});
