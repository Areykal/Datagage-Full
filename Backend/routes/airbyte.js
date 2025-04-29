import express from "express";
import airbyteService from "../services/airbyte.js";

const router = express.Router();

// Middleware
router.use(express.json());

// Source routes
// Corrected route handler for GET /sources
router.get("/sources", async (req, res, next) => {
  // Make handler async
  try {
    const sourcesData = await airbyteService.getSources(); // Call service method and wait
    res.json(sourcesData); // Send successful response
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get Airbyte sources: ${error.message}`;
    next(error);
  }
});

// Corrected route handler for GET /sources/:sourceId
router.get("/sources/:sourceId", async (req, res, next) => {
  // Make handler async
  const { sourceId } = req.params;
  // Basic validation: Check if sourceId is provided in the path
  if (!sourceId) {
    return res
      .status(400)
      .json({ error: "Source ID is required in the URL path" });
  }
  try {
    // Call the service method with only the sourceId
    const sourceDetails = await airbyteService.getSourceDetail(sourceId);
    res.json(sourceDetails); // Send successful response
  } catch (error) {
    // Log the error for debugging
    console.error(
      `Error fetching details for source ${sourceId}:`,
      error.message
    );

    // Check if it's an Axios error with a response status
    if (error.response) {
      if (error.response.status === 404) {
        return res.status(404).json({ error: `Source not found: ${sourceId}` });
      } else {
        // Forward other Airbyte API errors
        return res.status(error.response.status).json({
          error: `Airbyte API error: ${
            error.response.data?.message || error.message
          }`,
          details: error.response.data,
        });
      }
    } else {
      // Handle other types of errors (e.g., network issues, service internal errors)
      error.message = `Failed to get Airbyte source details for ID ${sourceId}: ${error.message}`;
      next(error); // Pass to the generic error handler
    }
  }
});

import { validateSourceCreation } from "../middleware/sourceValidator.js";

// Refactored POST /create/sources route
router.post(
  "/create/sources",
  validateSourceCreation,
  async (req, res, next) => {
    try {
      // Extract necessary data from the request body
      const { sourceName, sourceType, sourceConfig, definitionId } = req.body;

      // Call the service method with extracted data
      // Service method should now return the created source data or throw an error
      const createdSource = await airbyteService.createSource(
        sourceName,
        sourceType,
        sourceConfig,
        definitionId // Pass definitionId if provided
      );

      // Send successful response (201 Created)
      res.status(201).json({
        success: true,
        source: createdSource, // Send back the created source details
      });
    } catch (error) {
      // Add context and pass error to the global error handler
      error.message = `Failed to create Airbyte source: ${error.message}`;
      next(error);
    }
  }
);

// Refactored DELETE /sources/:sourceId route (Option B: Delete connections first)
router.delete("/sources/:sourceId", async (req, res, next) => {
  const { sourceId } = req.params;
  if (!sourceId) {
    return res
      .status(400)
      .json({ error: "Source ID is required in the URL path" });
  }

  let connectionsToDelete = [];
  let deletionErrors = []; // To collect errors during connection deletion

  try {
    // 1. Find connections associated with this source
    console.log(`Finding connections associated with source ${sourceId}...`);
    const allConnections = await airbyteService.getConnections(); // Assuming this returns an array
    connectionsToDelete = allConnections.filter(
      (conn) => conn.sourceId === sourceId
    );
    console.log(`Found ${connectionsToDelete.length} connections to delete.`);

    // 2. Delete associated connections
    for (const connection of connectionsToDelete) {
      try {
        console.log(`Deleting connection ${connection.connectionId}...`);
        await airbyteService.deleteConnection(connection.connectionId);
        console.log(
          `Successfully deleted connection ${connection.connectionId}.`
        );
      } catch (connError) {
        // Log the error but continue trying to delete other connections and the source
        console.error(
          `Failed to delete connection ${connection.connectionId}: ${connError.message}`
        );
        deletionErrors.push({
          connectionId: connection.connectionId,
          error: connError.message,
        });
      }
    }

    // 3. Delete the source itself
    console.log(`Deleting source ${sourceId}...`);
    await airbyteService.deleteSource(sourceId);
    console.log(`Successfully deleted source ${sourceId}.`);

    // 4. Send success response (204 No Content)
    // Optionally include info about connection deletion attempts in headers or logs if needed
    if (deletionErrors.length > 0) {
      console.warn(
        `Encountered ${deletionErrors.length} errors while deleting associated connections. Source deletion proceeded.`
      );
      // You might choose a different status or response body if connection deletion failures are critical
    }
    res.status(204).send();
  } catch (error) {
    // Handle errors from getting connections or deleting the source itself
    error.message = `Failed during deletion process for source ${sourceId}: ${error.message}`;
    // Include connection deletion errors in the error passed to the handler if desired
    if (deletionErrors.length > 0) {
      error.connectionDeletionErrors = deletionErrors;
    }
    next(error);
  }
});

// Source type routes
// Refactored GET /source-types route
router.get("/source-types", async (req, res, next) => {
  try {
    // Service method should now return data or throw an error
    const sourceTypes = await airbyteService.getSourceTypes();
    res.json(sourceTypes); // Send successful response
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get Airbyte source types: ${error.message}`;
    next(error);
  }
});

// Refactored GET /source-types/:sourceType route
router.get("/source-types/:sourceType", async (req, res, next) => {
  const { sourceType } = req.params;
  // Validation remains
  if (!sourceType) {
    return res
      .status(400)
      .json({ error: "Source type is required in the URL path" });
  }
  try {
    // Call service method with sourceType, await result
    const details = await airbyteService.getSourceTypeDetails(sourceType);
    res.json(details); // Send successful response
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get details for Airbyte source type ${sourceType}: ${error.message}`;
    // Handle potential 404 from service
    if (error.message.includes("not found")) {
      // Simple check, might need refinement
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// Source definition routes
// Refactored GET /source-definitions route
router.get("/source-definitions", async (req, res, next) => {
  try {
    // Service method should now return data or throw an error
    const definitions = await airbyteService.getSourceDefinitions();
    res.json(definitions); // Send successful response
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get Airbyte source definitions: ${error.message}`;
    next(error);
  }
});

// Refactored GET /source-definitions/:definitionId route
router.get("/source-definitions/:definitionId", async (req, res, next) => {
  // Make handler async
  const { definitionId } = req.params;
  // Basic validation
  if (!definitionId) {
    return res
      .status(400)
      .json({ error: "Source definition ID is required in the URL path" });
  }
  try {
    // Call the service method with definitionId
    const definitionDetails = await airbyteService.getSourceDefinitionById(
      definitionId
    );
    res.json(definitionDetails); // Send successful response
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get Airbyte source definition details for ID ${definitionId}: ${error.message}`;
    // Handle potential 404 from service
    if (error.status === 404) {
      // Check for specific 404 status
      return res.status(404).json({ error: error.message });
    }
    next(error); // Pass other errors to the generic handler
  }
});

// Connection routes
// Refactored GET /connections route
router.get("/connections", async (req, res, next) => {
  try {
    const connections = await airbyteService.getConnections();
    res.json(connections);
  } catch (error) {
    error.message = `Failed to get Airbyte connections: ${error.message}`;
    next(error);
  }
});

// Refactored POST /create/connection route
// Creates a connection between a given source and the predefined PostgreSQL destination
router.post("/create/connection", async (req, res, next) => {
  try {
    const { sourceId } = req.body; // Only sourceId is needed from the client

    // Basic validation
    if (!sourceId) {
      return res
        .status(400)
        .json({ error: "Airbyte source ID (sourceId) is required" });
    }

    // Call the service method (assuming it's renamed/refactored to handle the default destination)
    // Pass only the airbyteSourceId. The service will handle getting the destinationId.
    const connectionResult = await airbyteService.createDefaultConnection(
      sourceId
      // We can potentially pass an ETL Job ID here if needed for tracking
      // etlJobId: req.body.etlJobId // Example if tracking ID is sent
    );

    // Check if the service method indicated success
    if (!connectionResult || !connectionResult.success) {
      // Use the message from the service if available, otherwise provide a generic one
      const errorMessage =
        connectionResult?.message || "Failed to create connection in Airbyte.";
      // Determine appropriate status code (e.g., 500 for internal errors, 400/404 if source/dest issue)
      // For simplicity, using 500 here, but could be refined based on service error details.
      return res.status(500).json({ error: errorMessage });
    }

    // Send successful response (201 Created)
    res.status(201).json({
      success: true,
      message: "Airbyte connection created successfully.",
      connectionId: connectionResult.connectionId,
    });
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to create Airbyte connection: ${error.message}`;
    next(error);
  }
});

// Refactored GET /connections/:connectionId/status route
router.get("/connections/:connectionId/status", async (req, res, next) => {
  const { connectionId } = req.params;

  // Basic validation
  if (!connectionId) {
    return res
      .status(400)
      .json({ error: "Connection ID is required in the URL path" });
  }

  try {
    // Call the service method with connectionId
    const status = await airbyteService.getConnectionStatus(connectionId);
    res.json(status); // Send the status back
  } catch (error) {
    // Add context and pass error to the global error handler
    error.message = `Failed to get status for Airbyte connection ${connectionId}: ${error.message}`;
    // Handle potential 404 from service
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// --- OAuth Initiation Route ---
// POST /sources/oauth/initiate
router.post("/sources/oauth/initiate", async (req, res, next) => {
  const { sourceType, redirectUrl } = req.body;

  // Basic validation
  if (!sourceType || !redirectUrl) {
    return res.status(400).json({
      error: "sourceType and redirectUrl are required in the request body",
    });
  }

  try {
    // Workspace ID will be fetched within the service method
    const workspaceId = await airbyteService.getWorkspaceId();
    const result = await airbyteService.initiateSourceOAuth(
      sourceType,
      redirectUrl,
      workspaceId
    );
    // Send back the auth URL provided by Airbyte
    res.json(result); // Should contain { authUrl: '...' }
  } catch (error) {
    error.message = `Failed to initiate OAuth for source type ${sourceType}: ${error.message}`;
    next(error);
  }
});

// --- Sync Trigger Route ---
// POST /connections/:connectionId/sync
router.post("/connections/:connectionId/sync", async (req, res, next) => {
  const { connectionId } = req.params;

  // Basic validation
  if (!connectionId) {
    return res
      .status(400)
      .json({ error: "Connection ID is required in the URL path" });
  }

  try {
    const result = await airbyteService.triggerSync(connectionId);
    // Send back the job info provided by Airbyte
    res.status(202).json({
      // 202 Accepted is suitable for async operations
      success: true,
      message: "Sync triggered successfully.",
      jobInfo: result, // Contains job details like jobId
    });
  } catch (error) {
    error.message = `Failed to trigger sync for connection ${connectionId}: ${error.message}`;
    // Handle specific errors like 404 if the connection doesn't exist
    if (error.response?.status === 404) {
      return res
        .status(404)
        .json({ error: `Connection not found: ${connectionId}` });
    }
    next(error);
  }
});

export default router;
