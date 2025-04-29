// Test real source definitions API
import 'dotenv/config';
import axios from 'axios';

async function testRealSourceDefinitions() {
  console.log('Testing real source definitions from API...');
  
  // Log environment variables
  console.log('Environment variables:');
  console.log('- AIRBYTE_URL:', process.env.AIRBYTE_URL);
  console.log('- AIRBYTE_CLIENT_ID:', process.env.AIRBYTE_CLIENT_ID ? '✓ Set' : '✗ Not set');
  console.log('- AIRBYTE_CLIENT_SECRET:', process.env.AIRBYTE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
  console.log('- AIRBYTE_WORKSPACE_ID:', process.env.AIRBYTE_WORKSPACE_ID);
  
  try {
    // Create API client
    const api = axios.create({
      baseURL: process.env.AIRBYTE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000
    });
      // Get authentication token
    console.log('\nGetting authentication token...');
    const tokenResponse = await api.post('/api/public/v1/applications/token', {
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
      // Fetch source definitions from real API
    console.log('\nFetching source definitions from API...');
    const response = await api.get(`/api/public/v1/workspaces/${workspaceId}/definitions/sources`, { headers });
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format from API');
    }
    
    const sourceDefinitions = response.data.data;
    console.log(`Retrieved ${sourceDefinitions.length} source definitions from API`);
    
    if (sourceDefinitions.length > 0) {
      console.log('Sample source definition:', sourceDefinitions[0]?.name);
      
      // Test getting a specific source definition
      const firstDef = sourceDefinitions[0];
      console.log(`\nFetching details for definition ID: ${firstDef.sourceDefinitionId}`);
        const detailResponse = await api.get(
        `/api/public/v1/workspaces/${workspaceId}/definitions/sources/${firstDef.sourceDefinitionId}`, 
        { headers }
      );
      
      console.log('Source definition details:');
      console.log('- Name:', detailResponse.data?.name);
      console.log('- Documentation URL:', detailResponse.data?.documentationUrl || 'N/A');
    }
    
    console.log('\nAll tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testRealSourceDefinitions();
