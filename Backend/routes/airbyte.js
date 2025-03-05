import express from "express";
import airbyteService from "../services/airbyte.js";

const router = express.Router();

// Middleware
router.use(express.json());

// Source routes
router.get("/sources", (req, res) => airbyteService.getSources(req, res));

router.get(
  "/sources/:sourceId",
  (req, res, next) => {
    if (!req.params.sourceId) {
      return res.status(400).json({ error: "Source ID is required" });
    }
    next();
  },
  (req, res) => airbyteService.getSourceDetails(req, res)
);

router.post(
  "/create/sources",
  (req, res, next) => {
    const { sourceName, sourceType, sourceConfig } = req.body;
    if (!sourceName || !sourceType || !sourceConfig) {
      return res.status(400).json({
        error: "Source name, type, and configuration are required",
      });
    }
    next();
  },
  (req, res) => airbyteService.createSource(req, res)
);

router.delete("/sources/:sourceId", (req, res) =>
  airbyteService.deleteSource(req, res)
);

// Source type routes
router.get("/source-types", (req, res) =>
  airbyteService.getSourceTypes(req, res)
);

router.get("/source-types/:sourceType", (req, res) =>
  airbyteService.getSourceTypeDetails(req, res)
);

// Destination routes
router.get("/destinations", (req, res) =>
  airbyteService.getDestinations(req, res)
);

router.get(
  "/destinations/:destinationId",
  (req, res, next) => {
    if (!req.params.destinationId) {
      return res.status(400).json({ error: "Destination ID is required" });
    }
    next();
  },
  (req, res) => airbyteService.getDestinationDetails(req, res)
);

router.post(
  "/create/destinations",
  (req, res, next) => {
    const { destinationName } = req.body;
    if (!destinationName) {
      return res.status(400).json({
        error: "Destination name is required",
      });
    }
    next();
  },
  (req, res) => airbyteService.createDestination(req, res)
);

// Connection routes
router.get("/connections", (req, res) =>
  airbyteService.getConnections(req, res)
);

router.post(
  "/create/connection",
  (req, res, next) => {
    const { sourceId, destinationId, syncCatalog } = req.body;
    if (!sourceId || !destinationId || !syncCatalog) {
      return res.status(400).json({
        error: "Source ID, destination ID, and sync catalog are required",
      });
    }
    next();
  },
  (req, res) => airbyteService.createConnection(req, res)
);

router.get(
  "/connections/:connectionId/status",
  (req, res, next) => {
    if (!req.params.connectionId) {
      return res.status(400).json({ error: "Connection ID is required" });
    }
    next();
  },
  (req, res) => airbyteService.getConnectionStatus(req, res)
);

export default router;
