-- ETL Jobs table for tracking ETL process status
CREATE TABLE IF NOT EXISTS etl_jobs (
    job_id SERIAL PRIMARY KEY,
    source_id VARCHAR(255) REFERENCES sources(source_id),
    connection_id VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    details JSONB DEFAULT '{}',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_etl_jobs_source_id ON etl_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_etl_jobs_status ON etl_jobs(status);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger to call the function on row update
DROP TRIGGER IF EXISTS update_etl_jobs_updated_at ON etl_jobs;
CREATE TRIGGER update_etl_jobs_updated_at
BEFORE UPDATE ON etl_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
