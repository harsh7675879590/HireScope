/**
 * Stage 5: Discover & Rank Links (Section F)
 *
 * Deterministic scoring — NOT an LLM call.
 * Parse <a href>, resolve relative URLs, score by anchor text + path tokens
 * against keyword set. No hard-coded paths like /careers or /jobs.
 */

import { ok } from "../../../utils/result.js";
import { LINK_DISCOVERY_KEYWORDS } from "../../types.js";

export async function discoverRankLinks(ctx, _deps) {
  if (!ctx.homepageHtml) {
    ctx.discoveredLinks = [];
    return ok(null);
  }

  // TODO: Implement with cheerio:
  // 1. Parse all <a href> from homepage
  // 2. Resolve relative URLs against company_url
  // 3. Score each link: anchor text + path tokens matched against LINK_DISCOVERY_KEYWORDS
  // 4. Sort descending by score
  // 5. Return top-N links

  ctx.discoveredLinks = [];
  return ok(null);
}
