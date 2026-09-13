/**
 * Stage 3: Fetch Company Homepage (Section F)
 * Through SSRF guard, with timeout + size cap.
 */

import { ok } from "../../../utils/result.js";
import logger from "../../../utils/logger.js";
import { safeFetcher } from "../../../retrieval/fetcher.js";

export async function fetchHomepage(ctx, deps) {
  const { company_url } = ctx.input;
  const fetcher = deps?.fetcher || safeFetcher;

  try {
    const fetchResult = await fetcher.fetchPage(company_url);
    if (fetchResult.ok) {
      ctx.homepageHtml = fetchResult.value.html;
      logger.info(`Stage 3: Successfully fetched homepage (${company_url})`);
    } else {
      logger.warn(`Stage 3: Non-fatal homepage fetch issue: ${fetchResult.error?.message}`);
      ctx.homepageHtml = null;
      ctx.generationGaps = ctx.generationGaps || [];
      ctx.generationGaps.push(`Homepage fetch degraded: ${fetchResult.error?.message}`);
    }
  } catch (error) {
    logger.warn(`Stage 3: Failed to fetch homepage (${error.message}) - continuing pipeline`);
    ctx.homepageHtml = null;
  }

  return ok(null);
}
