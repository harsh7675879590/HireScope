/**
 * HireScope — Safe HTTP Fetcher
 *
 * Outbound fetcher with:
 * - SSRF guard
 * - Robots.txt check
 * - Timeout handling
 * - Content-length capping
 * - User-Agent identification
 */

import { validateSafeUrl } from "./ssrf-guard.js";
import { isRobotsAllowed } from "./robots.js";
import { ok, err } from "../utils/result.js";
import logger from "../utils/logger.js";

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2 MB

export class SafeFetcher {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.maxBytes = options.maxBytes || MAX_CONTENT_LENGTH;
    this.allowPrivate = options.allowPrivate || false;
  }

  /**
   * Safe fetch a web page.
   * @param {string} urlString
   * @returns {Promise<{ ok: boolean, value?: { html: string, url: string, status: number }, error?: object }>}
   */
  async fetchPage(urlString) {
    // 1. SSRF Check
    const ssrfResult = await validateSafeUrl(urlString, this.allowPrivate);
    if (!ssrfResult.valid) {
      logger.warn(`SSRF Blocked: ${urlString} — ${ssrfResult.error}`);
      return err({ code: "SSRF_BLOCKED", message: ssrfResult.error, url: urlString });
    }

    const safeUrl = ssrfResult.normalizedUrl;

    // 2. Robots.txt Check (non-blocking if dev/test)
    if (process.env.NODE_ENV !== "test" && !this.allowPrivate) {
      const allowed = await isRobotsAllowed(safeUrl);
      if (!allowed) {
        logger.warn(`Robots.txt Disallowed: ${safeUrl}`);
        return err({ code: "ROBOTS_DISALLOWED", message: "Path blocked by robots.txt", url: safeUrl });
      }
    }

    // 3. Fetch with timeout and size cap
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(safeUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HireScopeBot/1.0; +https://hirescope.internal)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        },
        redirect: "follow"
      });

      clearTimeout(timer);

      if (!response.ok) {
        return err({
          code: "HTTP_ERROR",
          message: `HTTP ${response.status} ${response.statusText}`,
          status: response.status,
          url: safeUrl
        });
      }

      // Check Content-Type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml+xml")) {
        return err({
          code: "INVALID_CONTENT_TYPE",
          message: `Unexpected content type: ${contentType}`,
          url: safeUrl
        });
      }

      // Read text with size limit
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedBytes = 0;
      let html = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedBytes += value.length;
        if (receivedBytes > this.maxBytes) {
          reader.cancel();
          logger.warn(`Fetch exceeded byte limit (${this.maxBytes}) on ${safeUrl}`);
          break;
        }
        html += decoder.decode(value, { stream: true });
      }

      html += decoder.decode();

      return ok({
        html,
        url: response.url || safeUrl,
        status: response.status
      });
    } catch (error) {
      clearTimeout(timer);
      if (error.name === "AbortError") {
        return err({ code: "TIMEOUT", message: `Request timed out after ${this.timeoutMs}ms`, url: safeUrl });
      }
      return err({ code: "FETCH_FAILED", message: error.message, url: safeUrl });
    }
  }
}

export const safeFetcher = new SafeFetcher();
