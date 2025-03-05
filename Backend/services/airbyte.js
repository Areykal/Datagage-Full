import axios from "axios";
import "dotenv/config.js";
import {
  SOURCE_TYPE_DETAILS,
  SOURCE_TYPES,
  getSourceConfig,
} from "../config/sourceConfigs.js";

class AirbyteService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.AIRBYTE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    this.token = null;
    this.workspaceId = null;
  }

  handleError(error, res) {
    const response = error.response?.data || error.message;
    const status = error.response?.status || 500;
    return res.status(status).json({ error: response });
  }

  async getToken() {
    try {
      if (this.token) return this.token;

      const response = await this.api.post(`/applications/token`, {
        client_id: process.env.AIRBYTE_CLIENT_ID,
        client_secret: process.env.AIRBYTE_CLIENT_SECRET,
      });
      this.token = response.data.access_token;
      return this.token;
    } catch (error) {
      throw new Error("Failed to get access token");
    }
  }

  async getWorkspaceId() {
    try {
      if (this.workspaceId) return this.workspaceId;

      const token = await this.getToken();
      const response = await this.api.get("/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.workspaceId = response.data.data[0].workspaceId;
      return this.workspaceId;
    } catch (error) {
      console.error("Workspace Error:", {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to get workspace ID: ${error.message}`);
    }
  }

  async getAuthorizedRequest() {
    const token = await this.getToken();
    const workspaceId = await this.getWorkspaceId();
    return { token, workspaceId };
  }

  // API Methods
  async getSources(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();
      const response = await this.api.get("/sources", {
        params: { workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getSourceDetails(req, res) {
    try {
      const { token } = await this.getAuthorizedRequest();
      const { sourceId } = req.params;
      const response = await this.api.get(`/sources/${sourceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getSourceTypes(req, res) {
    try {
      if (!SOURCE_TYPE_DETAILS) {
        throw new Error("Source types configuration is not available");
      }

      const sourceTypes = Object.entries(SOURCE_TYPE_DETAILS).map(
        ([type, details]) => ({
          type,
          name: details.name,
          description: details.description,
          icon: details.icon || null,
          formFields: details.formFields || [],
        })
      );

      res.json({
        success: true,
        sourceTypes: sourceTypes,
      });
    } catch (error) {
      console.error("Error in getSourceTypes:", error);
      this.handleError(error, res);
    }
  }

  async getSourceTypeDetails(req, res) {
    try {
      const { sourceType } = req.params;
      const typeDetails = SOURCE_TYPE_DETAILS[sourceType];

      if (!typeDetails) {
        return res.status(404).json({ error: "Source type not found" });
      }

      res.json({ success: true, typeDetails });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async createSource(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();
      const { sourceName, sourceType, sourceConfig } = req.body;

      if (!sourceName || !sourceType || !sourceConfig) {
        return res.status(400).json({
          error: "Source name, type, and configuration are required",
        });
      }

      // Convert frontend source type to the right format for Airbyte
      const sourceDefinitionId = this.getSourceDefinitionId(sourceType);
      const sourceTypeConfig = getSourceConfig(sourceType, sourceConfig);

      if (!sourceTypeConfig) {
        return res.status(400).json({
          error: "Invalid source type or configuration",
        });
      }

      const requestData = {
        name: sourceName,
        sourceDefinitionId: sourceDefinitionId,
        workspaceId: workspaceId,
        connectionConfiguration: sourceTypeConfig,
      };

      const response = await this.api.post("/sources", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // After creating the source, automatically create a connection to PostgreSQL
      if (response.data && response.data.sourceId) {
        await this.createDefaultConnection(response.data.sourceId);
      }

      res.json({ success: true, source: response.data });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // Helper to get Airbyte source definition ID from our simpler source type
  getSourceDefinitionId(sourceType) {
    // This would come from your Airbyte configuration
    const definitionMap = {
      mysql: "435bb9a5-7887-4809-aa58-28c27df0d7ad",
      postgres: "2168e9f4-19ca-4019-adf5-354350c5dbef",
      "google-sheets": "71607ba1-1d4f-4494-a784-63d33e0a2673",
      file: "0d7b5d7f-e04b-4684-b0d1-5baef1b16a76",
      salesforce: "d9c135ee-0acb-4101-b996-1a1cfca10536",
    };
    return definitionMap[sourceType] || sourceType;
  }

  async createDefaultConnection(sourceId) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();

      // Use the default PostgreSQL destination from environment variable
      const destinationId = process.env.POSTGRES_DESTINATION_ID;

      const requestData = {
        name: `${sourceId}_to_postgres`,
        namespaceDefinition: "source",
        namespaceFormat: "${SOURCE_NAMESPACE}",
        prefix: "",
        sourceId,
        destinationId,
        operationIds: [],
        syncCatalog: await this.getSourceSchema(sourceId),
        schedule: {
          schedule_type: "basic",
          basic_schedule: {
            timeUnit: "hours",
            units: 24,
          },
        },
        status: "active",
      };

      await this.api.post("/connections", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return true;
    } catch (error) {
      console.error("Error creating default connection:", error);
      return false;
    }
  }

  async getSourceSchema(sourceId) {
    try {
      const { token } = await this.getAuthorizedRequest();
      const response = await this.api.get(`/sources/${sourceId}/schema`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.catalog;
    } catch (error) {
      console.error("Error getting source schema:", error);
      throw error;
    }
  }

  async getDestinations(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();
      const response = await this.api.get("/destinations", {
        params: { workspaceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getDestinationDetails(req, res) {
    try {
      const { token } = await this.getAuthorizedRequest();
      const { destinationId } = req.params;

      const response = await this.api.get(`/destinations/${destinationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async createDestination(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();
      const { destinationName, postgresDetails } = req.body;

      const requestData = {
        configuration: {
          destinationType: "postgres",
          ssl: false,
          database: postgresDetails.database,
          host: postgresDetails.host,
          password: postgresDetails.password,
          port: postgresDetails.port,
          schema: postgresDetails.schema,
          username: postgresDetails.username,
        },
        name: destinationName,
        workspaceId: workspaceId,
      };

      const response = await this.api.post("/destinations", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getConnections(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();

      const response = await this.api.get("/connections", {
        params: {
          workspaceId: workspaceId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async createConnection(req, res) {
    try {
      const { token, workspaceId } = await this.getAuthorizedRequest();
      const { sourceId, destinationId, syncCatalog } = req.body;

      const requestData = {
        name: `${sourceId}_to_postgres`,
        namespaceDefinition: "source",
        namespaceFormat: "${SOURCE_NAMESPACE}",
        prefix: "",
        sourceId,
        destinationId,
        operationIds: [],
        syncCatalog,
        schedule: {
          schedule_type: "basic",
          basic_schedule: {
            timeUnit: "hours",
            units: 24,
          },
        },
        status: "active",
      };

      const response = await this.api.post("/connections", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getConnectionStatus(req, res) {
    try {
      const { token } = await this.getAuthorizedRequest();
      const { connectionId } = req.params;

      const response = await this.api.get(
        `/connections/${connectionId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      res.json(response.data);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteSource(req, res) {
    try {
      const { token } = await this.getAuthorizedRequest();
      const { sourceId } = req.params;

      // Delete the source
      await this.api.delete(`/sources/${sourceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      res.json({ success: true, message: "Source deleted successfully" });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

export default new AirbyteService();
