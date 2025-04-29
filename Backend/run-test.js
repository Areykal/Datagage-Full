// Run script to test the new source definition implementations
console.log('Testing source definition API implementation...');

// Load environment variables
import 'dotenv/config';

// First, ensure required environment variables are set
const requiredEnvVars = [
  'AIRBYTE_URL', 
  'AIRBYTE_CLIENT_ID', 
  'AIRBYTE_CLIENT_SECRET', 
  'AIRBYTE_WORKSPACE_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: The following environment variables are required but not set:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

// Import and run the test
try {
  console.log('Running source definitions test...');
  // Using dynamic import for ES modules
  import('./test-source-definitions.js')
    .catch(error => console.error('Failed to run test:', error));
} catch (error) {
  console.error('Failed to run test:', error);
}
