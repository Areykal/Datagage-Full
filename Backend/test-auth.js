// Test file to verify Airbyte authentication
import 'dotenv/config';
import airbyteService from './services/airbyte.js';

async function testAuth() {
  try {
    console.log('Testing Airbyte authentication...');
    console.log('Environment variables:');
    console.log('- AIRBYTE_URL:', process.env.AIRBYTE_URL ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_CLIENT_ID:', process.env.AIRBYTE_CLIENT_ID ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_CLIENT_SECRET:', process.env.AIRBYTE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
    console.log('- AIRBYTE_WORKSPACE_ID:', process.env.AIRBYTE_WORKSPACE_ID ? '✓ Set' : '✗ Not set');
    
    console.log('\nTesting token retrieval...');
    const token = await airbyteService.getToken();
    console.log('Token retrieved:', token ? '✓ Success' : '✗ Failed');
    
    console.log('\nTesting workspace ID retrieval...');
    const workspaceId = await airbyteService.getWorkspaceId();
    console.log('Workspace ID:', workspaceId);
    
    console.log('\nTesting source definitions retrieval...');
    const sourceDefinitions = await airbyteService.listSourceDefinitions();
    console.log(`Retrieved ${sourceDefinitions.length} source definitions`);
    console.log('Sample source definition:', sourceDefinitions[0]?.name);
    
    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();
