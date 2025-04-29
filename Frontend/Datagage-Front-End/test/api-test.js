// Use ES module imports
import axios from 'axios';

// Create an axios instance similar to apiClient
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 60000
});

// Test analytics data fetching
async function testAnalytics() {
  try {
    console.log("Testing analytics endpoints...");
    
    // Test database connection
    console.log("1. Testing database connection...");
    const diagnosticResponse = await apiClient.get('/api/analytics/diagnostic');
    console.log("Database connection:", diagnosticResponse.data.success ? "SUCCESS" : "FAILED");
    console.log("Schema:", diagnosticResponse.data.schema);
    
    // Test sales data retrieval
    console.log("\n2. Testing sales data retrieval...");
    const salesResponse = await apiClient.get('/api/analytics/sales?months=12&product=all&customer=all');
    console.log(`Retrieved ${salesResponse.data.length} records`);
    console.log("Sample record:", salesResponse.data[0]);
    
    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Error during testing:", error.response?.data || error.message);
  }
}

// Run the tests
testAnalytics();
