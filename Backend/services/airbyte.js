import axios from "axios"; // Ensure axios is imported

class AirbyteService {
  constructor() {
    // Validate required environment variables during initialization
    if (!process.env.AIRBYTE_URL) {
      console.error("AIRBYTE_URL not set in .env file");
    }

    const baseUrl =
      process.env.AIRBYTE_URL || "http://localhost:8000/api/public/v1";
    console.log(`Using Airbyte API URL: ${baseUrl}`);

    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Rest of constructor remains the same
    this.token = null;
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID || null;
    this.sourceDefinitions = null;

    if (this.workspaceId) {
      console.log(
        `Initialized with Airbyte Workspace ID from env: ${this.workspaceId}`
      );
    }
  }

  handleError(error, res, context = "Unknown operation") {
    console.error(`Error during ${context}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config, // Log request config for debugging
    });
    const response =
      error.response?.data?.message || error.response?.data || error.message;
    const status = error.response?.status || 500;
    // Avoid sending response if headers already sent (e.g., in streaming scenarios)
    if (res && !res.headersSent) {
      return res.status(status).json({ error: response, context });
    }
    // If response object isn't available, re-throw the error
    // or handle it based on where handleError is called.
    // For background tasks, logging might be sufficient.
    // For API requests, returning the response is typical.
  }

  // --- Authentication and Workspace ---
  // Get the authentication token using client credentials from .env
  async getToken() {
    try {
      // Return cached token if available
      if (this.token) return this.token;

      // Check if required environment variables are set
      if (
        !process.env.AIRBYTE_CLIENT_ID ||
        !process.env.AIRBYTE_CLIENT_SECRET
      ) {
        console.error(
          "AIRBYTE_CLIENT_ID or AIRBYTE_CLIENT_SECRET not set in .env file"
        );
        throw new Error(
          "Authentication credentials missing. Check your .env file."
        );
      }

      // For getting token:
      const response = await this.api.post(`/applications/token`, {
        client_id: process.env.AIRBYTE_CLIENT_ID,
        client_secret: process.env.AIRBYTE_CLIENT_SECRET,
      });

      if (!response.data || !response.data.access_token) {
        throw new Error("Invalid token response from Airbyte API");
      }

      this.token = response.data.access_token;
      console.log("Successfully obtained Airbyte access token");
      return this.token;
    } catch (error) {
      console.error("Failed to get Airbyte access token:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  async getWorkspaceId() {
    try {
      // Return cached workspace ID if available
      if (this.workspaceId) return this.workspaceId;

      // Use static workspace ID from environment variable
      if (process.env.AIRBYTE_WORKSPACE_ID) {
        this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID;
        console.log(`Using Airbyte Workspace ID from env: ${this.workspaceId}`);
        return this.workspaceId;
      }

      // Fallback to API request if no workspace ID in environment
      console.warn(
        "AIRBYTE_WORKSPACE_ID not set in .env file, falling back to API request"
      );
      const token = await this.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await this.api.post("/workspaces/list", {}, { headers });

      if (!response.data.workspaces || response.data.workspaces.length === 0) {
        throw new Error(
          "No Airbyte workspaces found for the provided credentials"
        );
      }

      this.workspaceId = response.data.workspaces[0].workspaceId;
      console.log(
        `Retrieved Airbyte Workspace ID via API: ${this.workspaceId}`
      );
      return this.workspaceId;
    } catch (error) {
      this.handleError(error, null, "getWorkspaceId");
      throw new Error(`Failed to get workspace ID: ${error.message}`);
    }
  }
  async getAuthorizedHeaders() {
    const token = await this.getToken();
    if (!token) {
      throw new Error(
        "Unable to authenticate with Airbyte. Check your credentials."
      );
    }
    return { Authorization: `Bearer ${token}` };
  }

  // --- Source Definitions (Used for Source Types) ---
  // Refactored listSourceDefinitions (used by GET /source-types route)
  async getSourceTypes() {
    // Renamed for clarity matching the route
    // Return cached definitions if available
    if (this.sourceDefinitions) return this.sourceDefinitions;

    try {
      const workspaceId = await this.getWorkspaceId();
      const headers = await this.getAuthorizedHeaders();

      console.log("Fetching source definitions (types) from Airbyte API");
      // Assuming the correct endpoint for public API source definitions list
      // Adjust endpoint if necessary based on Airbyte API version
      const response = await this.api.get(
        `/source_definitions`, // Common endpoint, adjust if needed
        {
          params: { workspaceId }, // May not be needed depending on API version
          headers,
        }
      );

      // Validate the response structure (adjust based on actual API response)
      if (!response.data || !response.data.sourceDefinitions) {
        // Check common response structures
        console.warn(
          "Unexpected source definitions response structure:",
          response.data
        );
        // Attempt to handle potential variations, e.g., response.data directly being the array
        if (Array.isArray(response.data)) {
          this.sourceDefinitions = response.data;
        } else {
          throw new Error(
            "Invalid source definitions response from Airbyte API"
          );
        }
      } else {
        this.sourceDefinitions = response.data.sourceDefinitions;
      }

      console.log(
        `Retrieved ${this.sourceDefinitions.length} source definitions (types) from Airbyte`
      );
      return this.sourceDefinitions; // Return the data
    } catch (error) {
      // Log the error with context
      console.error(`Error listing Airbyte source definitions (types):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      // Re-throw the error for the route handler
      throw error;
    }
  }

  // Refactored getSourceTypeDetails method
  async getSourceTypeDetails(sourceType) {
    try {
      // Ensure source definitions (types) are loaded
      const definitions = await this.getSourceTypes();

      // Find the definition matching the sourceType (case-insensitive)
      const definition = definitions.find(
        (d) =>
          d.name?.toLowerCase() === sourceType.toLowerCase() ||
          d.sourceType?.toLowerCase() === sourceType.toLowerCase() // Check both fields if needed
      );

      if (!definition) {
        // Throw an error if not found, which the route handler can catch
        const error = new Error(
          `Source type definition not found: ${sourceType}`
        );
        error.status = 404; // Add status for the route handler
        throw error;
      }

      // Return the found definition details
      return definition;
    } catch (error) {
      // Log the error if it wasn't the 'not found' error we threw
      if (error.status !== 404) {
        console.error(`Error getting details for source type ${sourceType}:`, {
          message: error.message,
          // Avoid logging potentially large definitions array here
        });
      }
      // Re-throw the error for the route handler
      throw error;
    }
  }

  // async getSourceDetailDefinitionId(sourceType) { ... existing commented code ... }

  // Refactored getSourceDefinitions method (used by GET /source-definitions route)
  async getSourceDefinitions() {
    // This method is very similar to getSourceTypes, but might hit a different
    // endpoint or have slightly different logic depending on the Airbyte API version
    // and how you differentiate "types" vs "definitions".
    // For now, assuming it's the same as getSourceTypes for demonstration.
    // If they are truly distinct, adjust the endpoint and logic here.

    // Return cached definitions if available
    if (this.sourceDefinitions) return this.sourceDefinitions;

    try {
      const workspaceId = await this.getWorkspaceId();
      const headers = await this.getAuthorizedHeaders();

      console.log("Fetching source definitions from Airbyte API");
      // Adjust endpoint if necessary based on Airbyte API version
      const response = await this.api.get(
        `/source_definitions`, // Common endpoint, adjust if needed
        {
          params: { workspaceId }, // May not be needed depending on API version
          headers,
        }
      );

      // Validate the response structure (adjust based on actual API response)
      if (!response.data || !response.data.sourceDefinitions) {
        console.warn(
          "Unexpected source definitions response structure:",
          response.data
        );
        if (Array.isArray(response.data)) {
          this.sourceDefinitions = response.data;
        } else {
          throw new Error(
            "Invalid source definitions response from Airbyte API"
          );
        }
      } else {
        this.sourceDefinitions = response.data.sourceDefinitions;
      }

      console.log(
        `Retrieved ${this.sourceDefinitions.length} source definitions from Airbyte`
      );
      return this.sourceDefinitions; // Return the data
    } catch (error) {
      // Log the error with context
      console.error(`Error listing Airbyte source definitions:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      // Re-throw the error for the route handler
      throw error;
    }
  }

  // --- Source Management ---
  async getSources() {
    try {
      const headers = await this.getAuthorizedHeaders();
      const workspaceId = await this.getWorkspaceId();

      // List sources endpoint - GET request to sources
      const response = await this.api.get(`/sources`, {
        params: { workspaceId },
        headers,
      });

      if (!response.data) {
        throw new Error("Invalid response from Airbyte API");
      }

      return response.data;
    } catch (error) {
      console.error("Error listing Airbyte sources:", error);
      throw error;
    }
  }

  async getSourceDetail(sourceId) {
    try {
      const headers = await this.getAuthorizedHeaders();

      // Using the correct endpoint format for a single source
      const response = await this.api.get(`/sources/${sourceId}`, { headers });

      if (!response.data || !response.data.sourceId) {
        throw new Error("Invalid source response from Airbyte API");
      }

      return response.data;
    } catch (error) {
      console.error(`Error getting Airbyte source ${sourceId}:`, error);
      throw error;
    }
  }

  // Refactored initiateSourceOAuth method
  async initiateSourceOAuth(sourceType, redirectUrl, workspaceId) {
    // Removed req, res handling
    try {
      // Validation is now expected to happen in the route or middleware
      // Get authentication headers
      const headers = await this.getAuthorizedHeaders();

      // Create the payload for OAuth initiation
      const oAuthPayload = {
        redirectUrl: redirectUrl,
        workspaceId: workspaceId,
        sourceType: sourceType,
        // oAuthInputConfiguration can be added if needed for specific sources
      };

      // Make the API call to initiate OAuth
      const response = await this.api.post(
        "/sources/initiateOAuth", // Ensure endpoint is correct for your API version
        oAuthPayload,
        { headers }
      );

      // Return the authorization URL
      if (!response.data || !response.data.authUrl) {
        throw new Error("Invalid response from initiateOAuth endpoint");
      }
      return { authUrl: response.data.authUrl }; // Return data for the route
    } catch (error) {
      console.error("Error initiating OAuth:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        payload: { sourceType, redirectUrl, workspaceId },
      });
      // Re-throw the error for the route handler
      throw error;
    }
  }

  // Refactored createSource method
  async createSource(
    sourceName,
    sourceType,
    sourceConfig,
    definitionId // Optional
  ) {
    // Removed req, res handling
    try {
      // Validation is now expected to happen in the route or middleware

      // Get authentication headers
      const headers = await this.getAuthorizedHeaders();

      // Get workspace ID
      const workspaceId = await this.getWorkspaceId();
      if (!workspaceId) {
        throw new Error("AIRBYTE_WORKSPACE_ID is not configured or fetchable");
      }

      // Create the payload for the Airbyte API
      const airbyteSourcePayload = {
        name: sourceName,
        workspaceId: workspaceId,
        configuration: {
          ...sourceConfig,
          // Ensure sourceType is included if required by the specific API endpoint/version
          // sourceType: sourceType,
        },
      };

      // Add definitionId if provided and required by the API
      if (definitionId) {
        airbyteSourcePayload.definitionId = definitionId;
      }

      // Make the API call to create the source
      // Assuming a general /sources endpoint for now
      const endpoint = "/sources";
      const response = await this.api.post(endpoint, airbyteSourcePayload, {
        headers,
      });

      // Validate response and return created source data
      if (!response.data || !response.data.sourceId) {
        throw new Error("Invalid create source response from Airbyte API");
      }

      console.log(
        `Successfully created Airbyte source ${response.data.sourceId}`
      );
      return response.data; // Return the created source details
    } catch (error) {
      // Log the error with context
      console.error(`Error creating Airbyte source '${sourceName}':`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        payload: { sourceName, sourceType, definitionId }, // Log input payload (excluding sensitive config)
      });

      // Re-throw the error for the route handler
      throw error;
    }
  }

  // Refactored deleteSource method (signature changed)
  async deleteSource(airbyteSourceId) {
    // Changed parameter name for clarity
    // Removed req, res handling
    try {
      const headers = await this.getAuthorizedHeaders();

      // Make the DELETE request to the Airbyte API
      // Note: Axios delete method signature is url, config
      // Airbyte API v1 uses POST for deletion
      const response = await this.api.post(
        `/sources/delete`,
        { sourceId: airbyteSourceId }, // Payload requires sourceId
        { headers }
      );

      // Airbyte API typically returns 204 No Content on successful deletion via POST
      // We don't need to return anything specific, but can log success
      console.log(`Successfully deleted Airbyte source ${airbyteSourceId}`);
      // No return value needed as the route handler sends 204
    } catch (error) {
      // Log the error with context
      console.error(`Error deleting Airbyte source ${airbyteSourceId}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Re-throw the error to be caught by the route handler's catch block
      // This allows the route handler to decide the response status/message
      throw error;
    }
  }

  // --- Connection Management ---
  // Refactored getConnections method
  async getConnections() {
    try {
      const headers = await this.getAuthorizedHeaders();
      const workspaceId = await this.getWorkspaceId();

      // List connections endpoint - GET request
      // Adjust endpoint if necessary based on Airbyte API version
      const response = await this.api.get(`/connections`, {
        params: { workspaceId },
        headers,
      });

      if (!response.data) {
        throw new Error("Invalid connections response from Airbyte API");
      }

      // Assuming response.data contains the list, e.g., { connections: [...] }
      // Adjust based on actual API response structure
      return response.data.connections || response.data; // Return the list
    } catch (error) {
      console.error("Error listing Airbyte connections:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error; // Re-throw for the route handler
    }
  }

  // Refactored getConnectionStatus method
  async getConnectionStatus(connectionId) {
    try {
      const headers = await this.getAuthorizedHeaders();

      // Get connection details/status endpoint - POST request in v1
      // Adjust endpoint if necessary based on Airbyte API version
      const response = await this.api.post(
        `/connections/get`,
        { connectionId }, // Payload requires connectionId
        { headers }
      );

      // Validate the response structure
      if (!response.data || !response.data.connectionId) {
        throw new Error("Invalid connection details response from Airbyte API");
      }

      // Return the relevant status information (or the whole object)
      // The full response often contains the latest sync job status
      return response.data; // Return the full connection details which includes status
    } catch (error) {
      console.error(
        `Error getting status for Airbyte connection ${connectionId}:`,
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        }
      );

      // Check for 404 specifically
      if (error.response?.status === 404) {
        const notFoundError = new Error(
          `Connection not found: ${connectionId}`
        );
        notFoundError.status = 404;
        throw notFoundError;
      }

      throw error; // Re-throw other errors for the route handler
    }
  }

  async createDefaultConnection(
    airbyteSourceId,
    airbyteDestinationId, // Keep this param for now, but fetch it internally
    etlJobId = null
  ) {
    // TODO: Fetch the predefined destination ID here instead of relying on the argument
    const PREDEFINED_DESTINATION_ID =
      process.env.AIRBYTE_POSTGRES_DESTINATION_ID; // Example: Fetch from env
    if (!PREDEFINED_DESTINATION_ID) {
      const errorMsg =
        "Predefined PostgreSQL Destination ID is not configured in environment variables (AIRBYTE_POSTGRES_DESTINATION_ID).";
      console.error(errorMsg);
      // Update ETL status if job ID exists
      if (etlJobId) {
        const etlStatusService = await getEtlStatusService();
        await etlStatusService
          .updateETLJobStatus(etlJobId, "failed", {
            stage: "config_error",
            message: errorMsg,
          })
          .catch((err) =>
            console.error("Failed to update ETL status on config error:", err)
          );
      }
      // Return failure status
      return { success: false, connectionId: null, message: errorMsg };
    }
    // Use the fetched predefined ID
    const destinationIdToUse = PREDEFINED_DESTINATION_ID;

    console.log(
      `Creating default connection between Source ${airbyteSourceId} and Predefined Destination ${destinationIdToUse}`
    );
    const etlStatusService = await getEtlStatusService(); // Use helper
    try {
      const workspaceId = await this.getWorkspaceId();
      const headers = await this.getAuthorizedHeaders();

      // 1. Discover schema to get catalog
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "discover_schema_start",
          message: "Discovering source schema for connection setup",
        });
      const schemaResult = await this.discoverSchema(airbyteSourceId, etlJobId); // Pass etlJobId
      if (!schemaResult || !schemaResult.catalog) {
        throw new Error("Failed to discover schema or schema is empty.");
      }
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "discover_schema_complete",
          message: "Schema discovered successfully",
        });

      // 2. Configure the connection payload using the predefined destination ID
      const connectionPayload = {
        name: `Connection: Source ${airbyteSourceId} -> Dest ${destinationIdToUse}`,
        namespaceDefinition: "source",
        namespaceFormat: "${SOURCE_NAMESPACE}",
        prefix: `src_${airbyteSourceId}_`,
        sourceId: airbyteSourceId,
        destinationId: destinationIdToUse, // Use the predefined ID
        status: "active",
        scheduleType: "manual",
        syncCatalog: schemaResult.catalog,
      };

      // 3. Create the connection via Airbyte API
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "airbyte_connection_create",
          message: "Sending request to create connection in Airbyte",
        });
      const response = await this.api.post(
        "/connections/create",
        connectionPayload,
        { headers }
      );
      const airbyteConnectionId = response.data.connectionId;

      if (!airbyteConnectionId) {
        throw new Error(
          "Airbyte API did not return a connectionId after creation."
        );
      }

      console.log(
        `Successfully created Airbyte connection ID: ${airbyteConnectionId}`
      );
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "airbyte_connection_created",
          message: `Connection created (ID: ${airbyteConnectionId})`,
        });

      // 4. Update local source record with the new connection ID
      const sourceService = await getSourceService(); // Use helper
      const localSource = await sourceService.getSourceByAirbyteId(
        airbyteSourceId
      );
      if (localSource && localSource.sourceId) {
        await sourceService.updateSourceConnectionId(
          localSource.sourceId,
          airbyteConnectionId
        );
        console.log(
          `Updated local source ${localSource.sourceId} with Airbyte connection ID ${airbyteConnectionId}`
        );
      } else {
        console.warn(
          `Could not find local source record for Airbyte source ID ${airbyteSourceId} to update connection ID.`
        );
      }

      return { success: true, connectionId: airbyteConnectionId };
    } catch (error) {
      // Log the error with context
      console.error(
        `Error creating default connection for source ${airbyteSourceId}:`,
        error.message
      );
      if (etlJobId) {
        await etlStatusService
          .updateETLJobStatus(etlJobId, "failed", {
            stage: "connection_creation_error",
            message: `Failed to create connection: ${error.message}`,
          })
          .catch((err) =>
            console.error(
              "Failed to update ETL status on connection error:",
              err
            )
          );
      }
      // Return failure status and message
      return {
        success: false,
        connectionId: null,
        message: `Failed to create connection: ${error.message}`,
      };
    }
  }

  // --- Sync and Schema ---

  // Renamed and refactored getSourceSchema to discoverSchema
  async discoverSchema(airbyteSourceId, etlJobId = null) {
    console.log(
      `Attempting schema discovery for Airbyte source ID: ${airbyteSourceId}`
    );
    const etlStatusService = await getEtlStatusService(); // Use helper
    try {
      const headers = await this.getAuthorizedHeaders();
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "discover_schema_api_call",
          message: "Calling Airbyte discover schema API",
        });

      // Standard Airbyte API v1 endpoint
      const response = await this.api.post(
        "/sources/discover_schema",
        { sourceId: airbyteSourceId },
        { headers }
      );

      if (!response.data || !response.data.catalog) {
        throw new Error("Schema discovery failed or returned empty catalog.");
      }

      console.log(
        `Schema discovered successfully for source ${airbyteSourceId}.`
      );
      if (etlJobId)
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "discover_schema_api_success",
          message: "Schema discovery API call successful",
        });

      // Optionally, update the local source record with the discovered schema/catalog if needed
      // const sourceService = await getSourceService();
      // await sourceService.updateSourceSchema(localSourceId, response.data.catalog);

      return {
        success: true,
        catalog: response.data.catalog,
        jobInfo: response.data.jobInfo,
      }; // Return catalog and job info
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error(
        `Error discovering schema for source ${airbyteSourceId}:`,
        errorMessage
      );
      if (etlJobId) {
        await etlStatusService
          .updateETLJobStatus(etlJobId, "failed", {
            stage: "discover_schema_error",
            message: `Schema discovery failed: ${errorMessage}`,
          })
          .catch((err) =>
            console.error(
              "Failed to update ETL status on schema discovery error:",
              err
            )
          );
      }
      // Re-throw or return error status
      // throw new Error(`Schema discovery failed: ${errorMessage}`);
      return { success: false, catalog: null, error: errorMessage };
    }
  }

  // Refactored triggerSync method
  async triggerSync(airbyteConnectionId, etlJobId = null) {
    // Removed req, res handling
    // Accepts airbyteConnectionId directly
    try {
      // Validation (e.g., ensuring connectionId exists) should ideally happen before calling this,
      // possibly in the route or a preceding service call.

      const etlStatusService = await getEtlStatusService(); // Use helper

      // Update ETL Job status if ID provided
      if (etlJobId) {
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "sync_api_call",
          message: `Calling Airbyte sync API for connection ${airbyteConnectionId}`,
        });
      }

      const headers = await this.getAuthorizedHeaders();
      // Standard Airbyte API v1 endpoint
      const syncResponse = await this.api.post(
        "/connections/sync",
        { connectionId: airbyteConnectionId },
        { headers }
      );

      const airbyteJobId = syncResponse.data?.job?.id; // Airbyte's job ID for the sync
      if (!airbyteJobId) {
        throw new Error(
          "Airbyte API did not return a job ID after triggering sync."
        );
      }

      console.log(
        `Sync triggered successfully for connection ${airbyteConnectionId}. Airbyte Job ID: ${airbyteJobId}`
      );

      // Update ETL Job status if ID provided
      if (etlJobId) {
        await etlStatusService.updateETLJobStatus(etlJobId, "running", {
          stage: "sync_triggered",
          message: `Sync successfully triggered in Airbyte. Airbyte Job ID: ${airbyteJobId}`,
          airbyteJobId: airbyteJobId, // Store Airbyte job ID for tracking
        });
      }

      // Return relevant info for the route handler
      return {
        success: true,
        message: "Sync triggered successfully.",
        airbyteJobId: airbyteJobId,
      };
    } catch (error) {
      console.error(
        `Error triggering sync for connection ${airbyteConnectionId}:`,
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        }
      );
      // Update ETL status if job ID provided
      if (etlJobId) {
        const etlStatusService = await getEtlStatusService(); // Use helper
        await etlStatusService
          .updateETLJobStatus(etlJobId, "failed", {
            stage: "sync_trigger_error",
            message: `Failed to trigger sync: ${error.message}`,
          })
          .catch((err) =>
            console.error(
              "Failed to update ETL status on sync trigger error:",
              err
            )
          );
      }
      // Re-throw the error for the route handler
      throw error;
    }
  }

  // --- Deletion Logic (Combined) ---
  // The deleteSource method remains simple, only deleting the source itself.
  // The route handler will orchestrate deleting connections first.

  // Refactored deleteSource method (signature changed)
  async deleteSource(airbyteSourceId) {
    // Changed parameter name for clarity
    // Removed req, res handling
    try {
      const headers = await this.getAuthorizedHeaders();

      // Make the DELETE request to the Airbyte API
      // Note: Axios delete method signature is url, config
      // Airbyte API v1 uses POST for deletion
      const response = await this.api.post(
        `/sources/delete`,
        { sourceId: airbyteSourceId }, // Payload requires sourceId
        { headers }
      );

      // Airbyte API typically returns 204 No Content on successful deletion via POST
      // We don't need to return anything specific, but can log success
      console.log(`Successfully deleted Airbyte source ${airbyteSourceId}`);
      // No return value needed as the route handler sends 204
    } catch (error) {
      // Log the error with context
      console.error(`Error deleting Airbyte source ${airbyteSourceId}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Re-throw the error to be caught by the route handler's catch block
      // This allows the route handler to decide the response status/message
      throw error;
    }
  }

  // Added: Delete a specific connection by ID
  async deleteConnection(airbyteConnectionId) {
    try {
      const headers = await this.getAuthorizedHeaders();
      // Standard Airbyte API v1 endpoint for deleting a connection
      await this.api.post(
        "/connections/delete",
        { connectionId: airbyteConnectionId },
        { headers }
      );
      console.log(
        `Successfully deleted Airbyte connection ID: ${airbyteConnectionId}`
      );
      return { success: true, connectionId: airbyteConnectionId }; // Indicate success
    } catch (error) {
      console.error(
        `Error deleting Airbyte connection ${airbyteConnectionId}:`,
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        }
      );
      // Throw the error but add context
      error.message = `Failed to delete connection ${airbyteConnectionId}: ${error.message}`;
      throw error;
    }
  }
}

// Helper function to avoid circular dependencies or complex instantiation
// This assumes sourceService and etlStatusService are singletons or easily accessible
// You might need to adjust this based on your actual service management (e.g., dependency injection)
let sourceServiceInstance;
let etlStatusServiceInstance;

async function getSourceService() {
  if (!sourceServiceInstance) {
    // Dynamically import or retrieve the instance
    const { default: SourceService } = await import("./sourceService.js");
    // Assuming SourceService doesn't need complex constructor args here
    sourceServiceInstance = new SourceService();
  }
  return sourceServiceInstance;
}

async function getEtlStatusService() {
  if (!etlStatusServiceInstance) {
    // Dynamically import or retrieve the instance
    const { default: EtlStatusService } = await import("./etlStatusService.js");
    // Assuming EtlStatusService doesn't need complex constructor args here
    etlStatusServiceInstance = new EtlStatusService();
  }
  return etlStatusServiceInstance;
}

export default new AirbyteService();
