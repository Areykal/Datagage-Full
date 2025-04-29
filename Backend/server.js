import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import airbyteRoute from "./routes/airbyte.js";
import analyticsRoute from "./routes/analytics.js";
import corsOptions from "./config/cors.js";
import { setupDatabase } from "./db/setup.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.AIRBYTE_URL],
      },
    },
  })
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Logging
app.use(morgan("combined"));

// Apply rate limiter
app.use("/api/", limiter);

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Datagage API Server is running",
    version: "1.0.0",
  });
});

app.use("/api/airbyte", airbyteRoute);
app.use("/api/analytics", analyticsRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const startServer = async () => {
  try {
    // First setup the database
    await setupDatabase(); // Then start the server
    app.listen(port, () => {
      console.log(
        `Server is running on port ${port} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
      console.log(
        `Connected to database: ${process.env.DB_NAME || "datagage_db"}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

export default app;
