// Integration test for source definitions API routes using real Airbyte API
// This test uses Express to create a test server and integrates with the real Airbyte API

import express from 'express';
import axios from 'axios';
import 'dotenv/config';

const PORT = 5555; // Test port
const app = express();

// Real Airbyte API service adapter
class AirbyteApiAdapter {
  constructor() {
    if (!process.env.AIRBYTE_URL) {
      throw new Error("AIRBYTE_URL not set in .env file");
    }
    
    this.api = axios.create({
      baseURL: process.env.AIRBYTE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000
    });
    
    this.token = null;
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID;
  }
  
  async getToken() {
    // Return cached token if available
    if (this.token) return this.token;
      console.log("Getting authentication token from Airbyte API");
    const response = await this.api.post('/api/public/v1/applications/token', {
      client_id: process.env.AIRBYTE_CLIENT_ID,
      client_secret: process.env.AIRBYTE_CLIENT_SECRET,
    });
    
    if (!response.data || !response.data.access_token) {
      throw new Error("Invalid token response from Airbyte API");
    }
    
    this.token = response.data.access_token;
    return this.token;
  }
  
  async getAuthorizedHeaders() {
    const token = await this.getToken();
    return { Authorization: `Bearer ${token}` };
  }
  
  async listSourceDefinitions() {
    console.log("Called listSourceDefinitions with real Airbyte API");
    const headers = await this.getAuthorizedHeaders();
      const response = await this.api.get(
      `/api/public/v1/workspaces/${this.workspaceId}/definitions/sources`, 
      { headers }
    );
    
    if (!response.data || !response.data.data) {
      throw new Error("Invalid source definitions response from Airbyte API");
    }
    
    return response.data.data;
  }
  
  async getSourceDefinitionDetails(definitionId) {
    console.log(`Called getSourceDefinitionDetails with ID: ${definitionId}`);
    const headers = await this.getAuthorizedHeaders();
      const response = await this.api.get(
      `/api/public/v1/workspaces/${this.workspaceId}/definitions/sources/${definitionId}`,
      { headers }
    );
    
    return response.data;
  }
  
  // API route handlers
  async getSourceDefinitions(req, res) {
    try {
      const definitions = await this.listSourceDefinitions();
      res.json({ data: definitions });
    } catch (error) {
      console.error("Error in getSourceDefinitions:", error);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
  
  async getSourceDefinitionById(req, res) {
    try {
      const { definitionId } = req.params;
      
      if (!definitionId) {
        return res.status(400).json({ error: "Source definition ID is required" });
      }
      
      try {
        const definitionDetails = await this.getSourceDefinitionDetails(definitionId);
        return res.json(definitionDetails);
      } catch (error) {
        console.warn(`Could not fetch definition details for ${definitionId}:`, error.message);
        return res.status(error.response?.status || 404).json({ error: `Source definition not found: ${definitionId}` });
      }
    } catch (error) {
      console.error("Error in getSourceDefinitionById:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

// Create real API service
const airbyteAdapter = new AirbyteApiAdapter();

// Setup routes
app.get('/source-definitions', (req, res) => airbyteAdapter.getSourceDefinitions(req, res));
app.get('/source-definitions/:definitionId', (req, res) => airbyteAdapter.getSourceDefinitionById(req, res));

// Start test server
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  
  try {
    // Check and log environment variables
    console.log('Environment variables check:');
    console.log('- AIRBYTE_URL:', process.env.AIRBYTE_URL || 'Not set');
    console.log('- AIRBYTE_CLIENT_ID:', process.env.AIRBYTE_CLIENT_ID ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_CLIENT_SECRET:', process.env.AIRBYTE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_WORKSPACE_ID:', process.env.AIRBYTE_WORKSPACE_ID || 'Not set');
    
    // Pre-fetch the authentication token to validate credentials
    await airbyteAdapter.getToken();
    console.log('Successfully authenticated with Airbyte API');
    
    // Run tests
    await runTests();
    
    server.close(() => {
      console.log('Test server closed');
    });
  } catch (error) {
    console.error('Setup failed:', error);
    server.close();
    process.exit(1);
  }
});

// Test functions
async function runTests() {
  console.log('Running API route tests...');
  
  try {
    // Test 1: List source definitions
    console.log('\nTest 1: GET /source-definitions');
    const response1 = await fetch(`http://localhost:${PORT}/source-definitions`);
    const data1 = await response1.json();
    
    if (!response1.ok) {
      throw new Error(`Request failed with status ${response1.status}: ${JSON.stringify(data1)}`);
    }
    
    if (!data1.data || !Array.isArray(data1.data)) {
      throw new Error('Invalid response format for list endpoint');
    }
    
    console.log(`Success - Retrieved ${data1.data.length} source definitions`);
    
    // Test 2: Get a specific source definition
    if (data1.data.length > 0) {
      const testDefinition = data1.data[0];
      console.log(`\nTest 2: GET /source-definitions/${testDefinition.sourceDefinitionId}`);
      
      const response2 = await fetch(`http://localhost:${PORT}/source-definitions/${testDefinition.sourceDefinitionId}`);
      const data2 = await response2.json();
      
      if (!response2.ok) {
        throw new Error(`Request failed with status ${response2.status}: ${JSON.stringify(data2)}`);
      }
      
      console.log('Success - Retrieved source definition details:');
      console.log('- Name:', data2.name);
      console.log('- Has form fields:', data2.formFields ? 'Yes' : 'No');
    }
    
    // Test 3: Test with invalid definition ID
    console.log('\nTest 3: GET /source-definitions/invalid-id (Should return 404)');
    const response3 = await fetch(`http://localhost:${PORT}/source-definitions/invalid-id`);
    const data3 = await response3.json();
    
    if (response3.status !== 404) {
      throw new Error(`Expected 404 status, but got ${response3.status}`);
    }
    
    console.log('Success - Received 404 for invalid definition ID');
    
    console.log('\nAll API route tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
