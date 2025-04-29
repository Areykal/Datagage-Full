-- Sources table for Datagage
-- This migration creates a table to store data sources

BEGIN;

-- Create the sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS sources (
  source_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  connection_configuration JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);

-- Insert sample data if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sources LIMIT 1) THEN
    INSERT INTO sources (source_id, name, source_type, status, connection_configuration, created_at, last_sync)
    VALUES
      ('1', 'MySQL Sales Database', 'mysql', 'active', 
       '{"host": "mysql.example.com", "port": 3306, "database": "sales", "username": "dbuser", "password": "password123"}',
       '2025-03-15 14:30:00', '2025-03-30 08:45:22'),
      
      ('2', 'PostgreSQL Data Warehouse', 'postgres', 'active', 
       '{"host": "postgres.example.com", "port": 5432, "database": "warehouse", "username": "analyst", "password": "p@ssw0rd"}',
       '2025-02-10 09:20:15', '2025-03-29 22:18:05'),
      
      ('3', 'Google Sheets Marketing', 'google-sheets', 'inactive', 
       '{"spreadsheetId": "1XYZ123abc"}', 
       '2025-01-05 11:22:33', NULL);
  END IF;
END $$;

COMMIT;
