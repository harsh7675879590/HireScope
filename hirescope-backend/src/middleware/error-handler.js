/**
 * HireScope — Error Handler Middleware
 *
 * Central error-to-HTTP-status mapper. All uncaught errors in routes/controllers
 * flow through here for consistent API error responses.
 */

import logger from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  // Log the full error
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: err.errors,
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: err.message,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      code: "DUPLICATE",
      message: "Resource already exists",
    });
  }

  // Custom app errors with status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.code || "ERROR",
      message: err.message,
    });
  }

  // Default: 500
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
  });
}

/**
 * Custom error class with HTTP status code.
 */
export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}
