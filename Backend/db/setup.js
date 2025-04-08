import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

/**
 * Verify database connection and create database if it doesn't exist
 */
async function verifyConnection() {
  console.log("Using database configuration:", {
    host: process.env.DB_HOST || "localhost",
    database: "postgres", // Initial connection to postgres database
    dbTarget: process.env.DB_NAME, // Target database we'll be connecting to
    user: process.env.DB_USER,
    port: process.env.DB_PORT || 5432
  });

  const client = new pg.Client({
    host: process.env.DB_HOST || "localhost",
    database: "postgres", // Connect to default postgres database first
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL server");

    // Check if our target database exists
    const dbName = process.env.DB_NAME;
    console.log(`Checking if database '${dbName}' exists...`);
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Database ${dbName} does not exist, creating...`);
      // Need to escape the identifier properly to prevent SQL injection
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (err) {
    console.error("Error verifying database connection:", err);
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Run all migration files in the migrations directory
 */
async function runMigrations() {
  console.log("Starting database migrations...");

  try {
    // Create migrations directory if it doesn't exist
    const migrationsDir = path.join(__dirname, "migrations");
    try {
      await fs.access(migrationsDir);
    } catch (err) {
      console.log("Creating migrations directory...");
      await fs.mkdir(migrationsDir, { recursive: true });
    }

    // Read all SQL files in migrations directory
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql"));

    if (sqlFiles.length === 0) {
      console.log("No migration files found. Skipping migrations.");
      return;
    }

    // Sort files to ensure consistent order
    sqlFiles.sort();

    // Execute each migration file
    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf8");

      // Execute the SQL file
      const client = await pool.connect();
      try {
        console.log(`Executing SQL from ${file}...`);
        // No need for explicit BEGIN/COMMIT here as our migration file handles transactions
        await client.query(sql);
        console.log(`Migration ${file} completed successfully.`);
      } catch (error) {
        console.error(`Error in migration ${file}:`, error);

        // Print more detailed error information
        if (error.position) {
          const errorPosition = parseInt(error.position);
          const startPos = Math.max(0, errorPosition - 100);
          const endPos = Math.min(sql.length, errorPosition + 100);
          const errorContext = sql.substring(startPos, endPos);

          console.error(`Error context (around position ${errorPosition}):`);
          console.error(`...${errorContext}...`);
          console.error(
            "Error indicator: " +
              " ".repeat(Math.min(100, errorPosition - startPos)) +
              "^"
          );
        }

        throw error;
      } finally {
        client.release();
      }
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

/**
 * Main function to set up the database
 */
async function setupDatabase() {
  try {
    // First ensure the database exists
    await verifyConnection();

    // Then run migrations
    await runMigrations();

    console.log("Database setup complete");
  } catch (err) {
    console.error("Database setup failed:", err);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the database setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase, pool };
