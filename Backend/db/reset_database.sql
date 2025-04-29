-- Reset script for Datagage database
-- This will drop all tables with CASCADE to handle dependencies

-- Drop application tables first
DROP TABLE IF EXISTS etl_jobs CASCADE;
DROP TABLE IF EXISTS sources CASCADE;

-- Drop any other related tables if needed
-- DROP TABLE IF EXISTS other_tables CASCADE;

-- Reset will be complete and migrations can recreate tables with correct schema
