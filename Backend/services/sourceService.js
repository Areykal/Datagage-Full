import { pool } from "../db/setup.js";
import { v4 as uuidv4 } from "uuid";

class SourceService {
  /**
   * Get all data sources from the database
   * @returns {Promise<Array>} List of sources
   */
  async getAllSources() {
    try {
      const result = await pool.query(`
        SELECT 
          source_id as "sourceId",
          name,
          source_type as "sourceType",
          status,
          connection_configuration as "connectionConfiguration",
          created_at as "createdAt",
          last_sync as "lastSync"
        FROM 
          sources
        ORDER BY 
          created_at DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching sources:", error);
      throw new Error(`Failed to fetch sources: ${error.message}`);
    }
  }

  /**
   * Get source details by ID
   * @param {string} sourceId - ID of the source
   * @returns {Promise<Object>} Source details
   */
  async getSourceById(sourceId) {
    try {
      const result = await pool.query(`
        SELECT 
          source_id as "sourceId",
          name,
          source_type as "sourceType",
          status,
          connection_configuration as "connectionConfiguration",
          created_at as "createdAt",
          last_sync as "lastSync"
        FROM 
          sources
        WHERE 
          source_id = $1
      `, [sourceId]);

      if (result.rows.length === 0) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching source ${sourceId}:`, error);
      throw new Error(`Failed to fetch source: ${error.message}`);
    }
  }

  /**
   * Create a new data source
   * @param {Object} sourceData - Data for the new source
   * @returns {Promise<Object>} Created source
   */
  async createSource(sourceData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const sourceId = uuidv4();
      const { name, sourceType, status, connectionConfiguration } = sourceData;
      
      const result = await client.query(`
        INSERT INTO sources(
          source_id,
          name,
          source_type,
          status,
          connection_configuration,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING 
          source_id as "sourceId",
          name,
          source_type as "sourceType",
          status,
          connection_configuration as "connectionConfiguration",
          created_at as "createdAt",
          last_sync as "lastSync"
      `, [sourceId, name, sourceType, status, connectionConfiguration]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error creating source:", error);
      throw new Error(`Failed to create source: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing data source
   * @param {string} sourceId - ID of the source to update
   * @param {Object} updateData - New data for the source
   * @returns {Promise<Object>} Updated source
   */
  async updateSource(sourceId, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { name, status, connectionConfiguration } = updateData;
      
      // Build dynamic update query
      let updateFields = [];
      let params = [sourceId];
      let paramCounter = 2;
      
      if (name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        params.push(name);
      }
      
      if (status !== undefined) {
        updateFields.push(`status = $${paramCounter++}`);
        params.push(status);
      }
      
      if (connectionConfiguration !== undefined) {
        updateFields.push(`connection_configuration = $${paramCounter++}`);
        params.push(connectionConfiguration);
      }
      
      if (updateFields.length === 0) {
        throw new Error("No fields to update");
      }
      
      const query = `
        UPDATE sources
        SET ${updateFields.join(', ')}
        WHERE source_id = $1
        RETURNING 
          source_id as "sourceId",
          name,
          source_type as "sourceType",
          status,
          connection_configuration as "connectionConfiguration",
          created_at as "createdAt",
          last_sync as "lastSync"
      `;
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error updating source ${sourceId}:`, error);
      throw new Error(`Failed to update source: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update last sync timestamp for a source
   * @param {string} sourceId - ID of the source
   * @returns {Promise<Object>} Updated source
   */
  async updateSourceSyncTime(sourceId) {
    try {
      const result = await pool.query(`
        UPDATE sources
        SET last_sync = NOW()
        WHERE source_id = $1
        RETURNING 
          source_id as "sourceId",
          name,
          source_type as "sourceType",
          status,
          connection_configuration as "connectionConfiguration",
          created_at as "createdAt",
          last_sync as "lastSync"
      `, [sourceId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating sync time for source ${sourceId}:`, error);
      throw new Error(`Failed to update sync time: ${error.message}`);
    }
  }

  /**
   * Delete a source by ID
   * @param {string} sourceId - ID of the source to delete
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteSource(sourceId) {
    try {
      const result = await pool.query(`
        DELETE FROM sources
        WHERE source_id = $1
        RETURNING source_id
      `, [sourceId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting source ${sourceId}:`, error);
      throw new Error(`Failed to delete source: ${error.message}`);
    }
  }
}

export default new SourceService();
