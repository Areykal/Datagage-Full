// Reset database utility for Datagage
// This script drops all tables and recreates the schema

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Reset database function
async function resetDatabase() {
  const pool = new Pool(dbConfig);
  let client;

  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    
    console.log('Connected. Reading reset script...');
    const resetScript = fs.readFileSync(path.join(__dirname, 'reset_database.sql'), 'utf8');
    
    console.log('Executing reset script...');
    await client.query(resetScript);
    console.log('All tables have been dropped successfully.');
    
    console.log('Database reset complete!');
    console.log('You can now restart your server to recreate the schema.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the reset function
resetDatabase().catch(console.error);
