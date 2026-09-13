/**
 * HireScope — Server Entry Point
 */

import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./persistence/mongo/client.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database connection
    await connectDatabase();
  } catch (err) {
    logger.warn(`Database connection deferred: ${err.message}`);
  }

  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`HireScope Backend server running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

startServer().catch((err) => {
  logger.error(`Fatal server error: ${err.message}`);
  process.exit(1);
});
