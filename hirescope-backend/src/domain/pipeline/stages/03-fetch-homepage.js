/**
 * Stage 3: Fetch Company Homepage (Section F)
 * Through SSRF guard, with timeout + size cap.
 */

import { ok, err } from "../../../utils/result.js";
import logger from "../../../utils/logger.js";

export async function fetchHomepage(ctx, deps) {
  const { company_url } = ctx.input;

  try {
    // TODO: Use deps.fetcher.fetch(company_url) with SSRF guard
    logger.info("Stage 3: Fetch homepage — awaiting fetcher implementation", { company_url });

    ctx.homepageHtml = null; // Placeholder
    return ok(null);
  } catch (error) {
    // Non-fatal: pipeline continues with recorded gap
    logger.warn("Stage 3: Failed to fetch homepage", { error: error.message });
    ctx.homepageHtml = null;
    return err({ code: "FETCH_FAILED", message: error.message });
  }
}
