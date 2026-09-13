/**
 * HireScope — Retry Policy with Exponential Backoff and Jitter
 */

import logger from "../utils/logger.js";

/**
 * Execute a promise-returning function with exponential backoff and jitter.
 *
 * @param {Function} fn - Async function to execute
 * @param {object} options
 * @param {number} options.maxRetries - Maximum number of retries (default 3)
 * @param {number} options.baseDelayMs - Base delay in ms (default 1000)
 * @param {number} options.maxDelayMs - Cap for delay in ms (default 10000)
 * @param {string} options.operationName - Name for logging
 * @returns {Promise<any>}
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    operationName = "operation"
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        logger.error(`[Retry] ${operationName} failed after ${maxRetries} retries: ${error.message}`);
        throw error;
      }

      // Check if error is non-retryable (e.g., authentication error)
      const isAuthError = error.status === 401 || error.status === 403;
      if (isAuthError) {
        throw error;
      }

      // Exponential backoff with full jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const cappedDelay = Math.min(maxDelayMs, exponentialDelay);
      const jitterDelay = Math.floor(Math.random() * cappedDelay);

      logger.warn(
        `[Retry] ${operationName} failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${jitterDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, jitterDelay));
    }
  }
}
