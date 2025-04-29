-- Sources table migration
-- Transaction wrapper to ensure all operations succeed or fail as a unit
BEGIN;

-- Check if table exists first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sources') THEN    -- Create the table if it doesn't exist
    CREATE TABLE sources (
      source_id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      source_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      connection_configuration JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sync TIMESTAMP
    );
    
    -- Create indexes
    CREATE INDEX idx_sources_type ON sources(source_type);
    CREATE INDEX idx_sources_status ON sources(status);

    -- Insert sample data
    INSERT INTO sources (name, source_type, status, connection_configuration, created_at, last_sync)
    VALUES
      ('MySQL Sales Database', 'mysql', 'active', 
       '{"host": "mysql.example.com", "port": 3306, "database": "sales", "username": "dbuser", "password": "password123"}',
       '2025-03-15T14:30:00Z', '2025-03-30T08:45:22Z'),
      
      ('PostgreSQL Data Warehouse', 'postgres', 'active', 
       '{"host": "postgres.example.com", "port": 5432, "database": "warehouse", "username": "analyst", "password": "p@ssw0rd"}',
       '2025-02-10T09:20:15Z', '2025-03-29T22:18:05Z'),
      
      ('Google Sheets Marketing', 'google-sheets', 'inactive', 
       '{"spreadsheetId": "1XYZ123abc"}', 
       '2025-01-05T11:22:33Z', NULL);
      
    RAISE NOTICE 'Created sources table with sample data';
  ELSE
    -- Table exists, check if columns exist and add them if they don't
    DO $COLS$ 
    BEGIN
      -- Check for connection_configuration column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sources' AND column_name = 'connection_configuration'
      ) THEN
        ALTER TABLE sources ADD COLUMN connection_configuration JSONB;
        RAISE NOTICE 'Added connection_configuration column to existing sources table';
      END IF;

      -- Check for status column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sources' AND column_name = 'status'
      ) THEN
        ALTER TABLE sources ADD COLUMN status VARCHAR(50) DEFAULT 'active';
        RAISE NOTICE 'Added status column to existing sources table';
      END IF;
    END $COLS$;

    -- Create indexes if they don't exist
    DO $INDEXES$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sources' AND indexname = 'idx_sources_type'
      ) THEN
        CREATE INDEX idx_sources_type ON sources(source_type);
        RAISE NOTICE 'Created source_type index';
      END IF;
      
      IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sources' AND indexname = 'idx_sources_status'
      ) THEN
        CREATE INDEX idx_sources_status ON sources(status);
        RAISE NOTICE 'Created status index';
      END IF;
    END $INDEXES$;
    
    -- Insert sample data only if table is empty
    IF NOT EXISTS (SELECT 1 FROM sources LIMIT 1) THEN
      INSERT INTO sources (name, source_type, status, connection_configuration, created_at, last_sync)
      VALUES
        ('MySQL Sales Database', 'mysql', 'active', 
         '{"host": "mysql.example.com", "port": 3306, "database": "sales", "username": "dbuser", "password": "password123"}',
         '2025-03-15T14:30:00Z', '2025-03-30T08:45:22Z');
      
      RAISE NOTICE 'Added sample data to existing sources table';
    END IF;
  END IF;
END $$;

-- Ensure sequence is up-to-date (if source_id exists)
DO $$ 
BEGIN
  -- Only update sequence if source_id column exists and it uses a sequence
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sources' AND column_name = 'source_id'
  ) AND EXISTS (
    SELECT FROM pg_sequences WHERE sequencename = 'sources_source_id_seq'
  ) THEN
    EXECUTE 'SELECT setval(''sources_source_id_seq'', COALESCE((SELECT MAX(source_id) FROM sources), 0) + 1, false)';
    RAISE NOTICE 'Updated sources_source_id_seq sequence';
  ELSE
    RAISE NOTICE 'Either source_id column or sources_source_id_seq does not exist, skipping sequence update';
  END IF;
END $$;

COMMIT;
