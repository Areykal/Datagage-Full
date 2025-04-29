// Update implementation for source definitions in airbyte.js

// This is a partial file that shows how to modify the existing airbyte.js

// --- Source Definitions ---
async listSourceDefinitions() {
  // Return cached definitions if available
  if (this.sourceDefinitions) return this.sourceDefinitions;
  
  try {
    console.log("Using static source definitions from local config");
    // Use static source definitions from the local config
    this.sourceDefinitions = Object.entries(SOURCE_TYPE_DETAILS).map(([type, details]) => ({
      sourceDefinitionId: `local-${type}`, // Generate a local ID
      name: details.name,
      dockerRepository: `airbyte/${type}`,
      dockerImageTag: "latest",
      documentationUrl: details.documentationUrl || "",
      icon: details.icon || "",
      sourceType: type
    }));
    
    return this.sourceDefinitions;
    
    /* If API access is restored later, use this code instead:
    const workspaceId = await this.getWorkspaceId();
    const headers = await this.getAuthorizedHeaders();
    
    // Using the correct endpoint for Airbyte API
    const response = await this.api.get(
      `/workspaces/${workspaceId}/definitions/sources`,
      { headers }
    );
    
    if (!response.data || !response.data.data) {
      throw new Error("Invalid source definitions response from Airbyte API");
    }
    
    this.sourceDefinitions = response.data.data;
    console.log(`Retrieved ${this.sourceDefinitions.length} source definitions from Airbyte`);
    return this.sourceDefinitions;
    */
  } catch (error) {
    console.error("Error listing source definitions:", error);
    throw new Error(`Failed to list source definitions: ${error.message}`);
  }
}

// Implement proper source details retrieval
async getAirbyteSource(airbyteSourceId) {
  try {
    const headers = await this.getAuthorizedHeaders();
    
    // Using the proper GET endpoint for source details
    const response = await this.api.get(
      `/sources/${airbyteSourceId}`,
      { headers }
    );
    
    if (!response.data || !response.data.sourceId) {
      throw new Error("Invalid source response from Airbyte API");
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error getting Airbyte source ${airbyteSourceId}:`, error);
    throw error;
  }
}

// Updated method to get source details (combines local DB and Airbyte API)
async getSourceDetails(req, res) {
  try {
    const { sourceId } = req.params; // This is the LOCAL DB ID
    const sourceService = await getSourceService();
    const source = await sourceService.getSourceById(sourceId);
    
    if (!source) {
      return res.status(404).json({ error: "Source not found in local database" });
    }
    
    // If we have an Airbyte source ID, also fetch from Airbyte for complete details
    if (source.airbyte_source_id) {
      try {
        const airbyteDetails = await this.getAirbyteSource(source.airbyte_source_id);
        // Merge Airbyte details with local details
        return res.json({
          ...source,
          airbyteDetails
        });
      } catch (airbyteError) {
        console.warn(`Could not fetch Airbyte details for source ${sourceId}:`, airbyteError.message);
        // Fall back to just returning local details
        return res.json(source);
      }
    } else {
      // Just return local details if no Airbyte ID
      return res.json(source);
    }
  } catch (error) {
    this.handleError(error, res, "getSourceDetails (local DB and Airbyte)");
  }
}
