// Simple test for real Airbyte API source definitions
import airbyteService from './services/airbyte.js';
import 'dotenv/config';

async function testSourceDefinitionsService() {
  console.log('Testing Airbyte source definitions using real API...');
  
  try {
    // Test 1: Create a mock request/response for testing the API handlers
    console.log('\nTest 1: Setting up mock request/response objects');
    const req = { params: {} };
    const res = {
      json: (data) => {
        console.log('Response data:', JSON.stringify(data).substring(0, 100) + '...');
        return res;
      },
      status: (code) => {
        console.log('Status code:', code);
        return res;
      }
    };
    
    // Test 2: Get source definitions from the service
    console.log('\nTest 2: Calling getSourceDefinitions handler...');
    await airbyteService.getSourceDefinitions(req, res);
    
    // Test 3: Get definitions using the direct service method
    console.log('\nTest 3: Getting source definitions directly from service...');
    const definitions = await airbyteService.listSourceDefinitions();
    console.log(`Retrieved ${definitions.length} source definitions`);
    
    // Test 4: Test with a specific source definition ID if available
    if (definitions.length > 0) {
      const firstDef = definitions[0];
      console.log('\nTest 4: Getting a specific source definition');
      console.log('First definition:', {
        id: firstDef.sourceDefinitionId,
        name: firstDef.name
      });
      
      console.log(`\nCalling getSourceDefinitionById handler with ID: ${firstDef.sourceDefinitionId}...`);
      req.params.definitionId = firstDef.sourceDefinitionId;
      await airbyteService.getSourceDefinitionById(req, res);
    } else {
      console.log('\nSkipping Test 4: No source definitions available');
    }
    
    // Test 5: Test with an invalid ID
    console.log('\nTest 5: Testing with invalid definition ID...');
    req.params.definitionId = 'invalid-id';
    await airbyteService.getSourceDefinitionById(req, res);
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testSourceDefinitionsService().catch(console.error);
