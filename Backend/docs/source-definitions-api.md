# Source Definitions API Implementation

## Overview

This document describes the implementation of the source definitions API following the new format:
```
http://localhost:8080/api/public/v1/workspaces/{workspaceId}/definitions/sources/{definitionId}
```

The implementation includes both the ability to list all source definitions and to get a specific source definition by ID.

## Changes Made

1. **Updated API Endpoint Format**:
   - Changed from `/source_definitions/list` to `/api/public/v1/workspaces/{workspaceId}/definitions/sources`
   - Added support for retrieving a specific definition via `/api/public/v1/workspaces/{workspaceId}/definitions/sources/{definitionId}`

2. **New Methods Added**:
   - `getSourceDefinitionDetails(definitionId)`: Retrieves details for a specific source definition
   - `getSourceDefinitions(req, res)`: API route handler for listing source definitions
   - `getSourceDefinitionById(req, res)`: API route handler for retrieving a specific source definition

3. **API Routes Added**:
   - `GET /source-definitions`: Lists all available source definitions
   - `GET /source-definitions/:definitionId`: Gets details for a specific source definition

4. **Fallback Mechanism**:
   - The implementation continues to support the local source definitions as a fallback when the API is not available
   - Static definitions are generated from the `sourceConfigs.js` file

5. **Testing**:
   - Added `test-source-definitions.js` to specifically test the new endpoints
   - Updated `test-public-api.js` and `test-endpoints.js` to include the new endpoint format
   - Created `run-test.js` script to easily run the tests

## How It Works

1. The system first tries to use locally defined source definitions from `sourceConfigs.js`
2. When API access is restored, you can uncomment the code in `listSourceDefinitions()` to use the API endpoint
3. The API endpoints are properly formatted according to the new convention:
   - For listing: `/api/public/v1/workspaces/{workspaceId}/definitions/sources`
   - For details: `/api/public/v1/workspaces/{workspaceId}/definitions/sources/{definitionId}`

## Testing Instructions

1. Set environment variables in your `.env` file:
   ```
   AIRBYTE_URL=http://localhost:8080
   AIRBYTE_CLIENT_ID=your_client_id
   AIRBYTE_CLIENT_SECRET=your_client_secret
   AIRBYTE_WORKSPACE_ID=your_workspace_id
   ```

2. Run the test script:
   ```
   node run-test.js
   ```

3. Check the output to verify successful API communication

## Next Steps

1. Once API permissions are fully resolved, the commented code in `listSourceDefinitions()` can be uncommented
2. Additional error handling and logging could be added to improve robustness
3. The frontend could be updated to use these new endpoints if necessary
