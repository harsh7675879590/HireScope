/**
 * HireScope — Rate Limiter Middleware
 */

import rateLimit from "express-rate-limit";

/** General API rate limit — 100 requests per 15 minutes per IP. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT",
    message: "Too many requests, please try again later.",
  },
});

/** Stricter limit for auth endpoints — 10 attempts per 15 minutes. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT",
    message: "Too many authentication attempts, please try again later.",
  },
});

/** Kit generation limit — 5 per hour (protects LLM rate limits). */
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT",
    message: "Generation limit reached. Please try again later.",
  },
});

export const kitGenLimiter = generationLimiter;

