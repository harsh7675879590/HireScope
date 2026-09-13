/**
 * HireScope — Express App Configuration
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";

export function createApp(options = {}) {
  const app = express();

  app.set("trust proxy", 1);

  // Security Headers
  app.use(helmet());

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    })
  );

  // Body parser
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request Logging
  app.use(requestLogger);

  // Session Management
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "hirescope-super-secure-session-secret-key-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
  };

  // If MongoDB URI is provided and not testing with in-memory session
  if (process.env.MONGODB_URI && !options.inMemorySession) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60
    });
  }

  app.use(session(sessionConfig));

  // Rate Limiter on API
  app.use("/api/", apiLimiter);

  // API Routes
  app.use("/api/v1", routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
