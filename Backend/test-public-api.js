// Test file to verify correct Airbyte Public API endpoint usage
import 'dotenv/config';
import axios from 'axios';

async function testPublicApiEndpoints() {
  try {
    console.log('Testing Airbyte Public API endpoints...');
    console.log('Environment variables:');
    console.log('- AIRBYTE_URL:', process.env.AIRBYTE_URL);
    console.log('- AIRBYTE_CLIENT_ID:', process.env.AIRBYTE_CLIENT_ID ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_CLIENT_SECRET:', process.env.AIRBYTE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_WORKSPACE_ID:', process.env.AIRBYTE_WORKSPACE_ID);
    
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
    const headers = { Authorization: `Bearer ${token}` };    // Test correct Public API endpoint for source definitions
    console.log('\nTesting source definitions endpoint for Public API...');
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;
    const sourceDefsResponse = await api.get(
      `/workspaces/${workspaceId}/definitions/sources`, 
      { headers }
    );
    
    if (!sourceDefsResponse.data || !sourceDefsResponse.data.data) {
      throw new Error('Failed to get source definitions or invalid response format');
    }
      console.log(`Success! Retrieved ${sourceDefsResponse.data.data.length} source definitions`);
    console.log('First source definition:', sourceDefsResponse.data.data[0]?.name);
    
    // Test source definition details endpoint
    if (sourceDefsResponse.data.data.length > 0) {
      const definitionId = sourceDefsResponse.data.data[0].sourceDefinitionId;
      console.log(`\nTesting source definition details endpoint for ID: ${definitionId}`);
        const definitionResponse = await api.get(
        `/workspaces/${workspaceId}/definitions/sources/${definitionId}`,
        { headers }
      );
      
      if (!definitionResponse.data) {
        throw new Error('Failed to get source definition details or invalid response format');
      }
      
      console.log('Success! Retrieved source definition details:');
      console.log('- Name:', definitionResponse.data.name);
      console.log('- Documentation URL:', definitionResponse.data.documentationUrl || 'N/A');
    }
    
  } catch (error) {
    console.error('Error testing API endpoints:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
  }
}

testPublicApiEndpoints();
