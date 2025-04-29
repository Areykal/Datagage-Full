// Test different Airbyte API endpoints to find which ones work with public API
import 'dotenv/config';
import axios from 'axios';

async function testEndpoints() {
  try {
    console.log('Testing various Airbyte API endpoints...');
    
    const baseURL = process.env.AIRBYTE_URL;
    console.log('Base URL:', baseURL);
    
    // Create API client
    const api = axios.create({
      baseURL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000
    });
    
    // Get authentication token
    console.log('\nGetting authentication token...');
    const tokenResponse = await api.post('/applications/token', {
      client_id: process.env.AIRBYTE_CLIENT_ID,
      client_secret: process.env.AIRBYTE_CLIENT_SECRET,
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      throw new Error('Failed to get authentication token');
    }
    
    const token = tokenResponse.data.access_token;
    console.log('Token retrieved successfully');
    
    // Set authorization header
    const headers = { Authorization: `Bearer ${token}` };
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;
      // Try different API endpoints
    const endpoints = [
      // Standard sources endpoints
      { name: "List source definitions (standard)", method: "post", path: "/source_definitions/list", payload: { workspaceId } },
      { name: "List source definitions (get)", method: "get", path: "/source_definitions?workspaceId=" + workspaceId },
      { name: "List source definitions (no workspace)", method: "post", path: "/source_definitions/list", payload: {} },
      
      // New public API endpoints
      { name: "List source definitions (public API)", method: "get", path: `/workspaces/${workspaceId}/definitions/sources` },
      
      // Source definition specs endpoint
      { name: "Get source definition specification", method: "post", path: "/source_definition_specifications/get", 
        payload: { workspaceId, sourceDefinitionId: "decd338e-5647-4c0b-adf4-da0e75f5a750" } }, // example ID
        // Try accessing a specific source definition directly
      { name: "Get source definition (public API)", method: "get", path: `/workspaces/${workspaceId}/definitions/sources/decd338e-5647-4c0b-adf4-da0e75f5a750` }, // example ID
      
      // Source listing
      { name: "List sources (standard)", method: "post", path: "/sources/list", payload: { workspaceId } },
      { name: "List sources (get)", method: "get", path: "/sources?workspaceId=" + workspaceId },
      
      // Try other related endpoints
      { name: "Workspaces list", method: "post", path: "/workspaces/list", payload: {} },
      { name: "Health check", method: "get", path: "/health" },
    ];
    
    // Test each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting endpoint: ${endpoint.name} - ${endpoint.method.toUpperCase()} ${endpoint.path}`);
        
        let response;
        if (endpoint.method === "get") {
          response = await api.get(endpoint.path, { headers });
        } else {
          response = await api.post(endpoint.path, endpoint.payload, { headers });
        }
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data).substring(0, 200) + '...');
      } catch (error) {
        console.error('Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testEndpoints();
