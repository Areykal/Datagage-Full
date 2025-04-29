// Test file specifically for source definitions with new API format
import 'dotenv/config';
import axios from 'axios';

async function testSourceDefinitions() {
  try {
    console.log('Testing Source Definitions implementation with new API format...');
    
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
    
    if (!workspaceId) {
      throw new Error('AIRBYTE_WORKSPACE_ID environment variable is not set');
    }
    
    // Step 1: Test listing source definitions
    console.log('\nStep 1: Testing list source definitions endpoint...');    console.log(`Using API endpoint: ${baseURL}/workspaces/${workspaceId}/definitions/sources`);
    const sourceDefsResponse = await api.get(
      `/workspaces/${workspaceId}/definitions/sources`, 
      { headers }
    );
    
    if (!sourceDefsResponse.data || !sourceDefsResponse.data.data) {
      throw new Error('Failed to list source definitions - invalid response format');
    }
    
    console.log(`Success! Retrieved ${sourceDefsResponse.data.data.length} source definitions`);
    
    if (sourceDefsResponse.data.data.length === 0) {
      console.warn('Warning: No source definitions found, further tests will be skipped');
      return;
    }
    
    const firstDefinition = sourceDefsResponse.data.data[0];
    console.log('Sample source definition:', {
      id: firstDefinition.sourceDefinitionId,
      name: firstDefinition.name
    });
    
    // Step 2: Test get a specific source definition
    console.log('\nStep 2: Testing get source definition endpoint...');
    const definitionId = firstDefinition.sourceDefinitionId;
      const defDetailsResponse = await api.get(
      `/workspaces/${workspaceId}/definitions/sources/${definitionId}`,
      { headers }
    );
    
    if (!defDetailsResponse.data) {
      throw new Error('Failed to get source definition details - invalid response format');
    }
    
    console.log('Success! Retrieved source definition details:');
    console.log('- ID:', defDetailsResponse.data.sourceDefinitionId);
    console.log('- Name:', defDetailsResponse.data.name); 
    console.log('- Documentation URL:', defDetailsResponse.data.documentationUrl || 'N/A');
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
  }
}

testSourceDefinitions();
