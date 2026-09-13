/**
 * Stage 5: Discover & Rank Links (Section F)
 *
 * Deterministic scoring — NOT an LLM call.
 * Parse <a href>, resolve relative URLs, score by anchor text + path tokens
 * against keyword set. No hard-coded paths like /careers or /jobs.
 */

import { ok } from "../../../utils/result.js";
import { discoverAndRankLinks } from "../../../retrieval/link-discoverer.js";

export async function discoverRankLinks(ctx, _deps) {
  if (!ctx.homepageHtml) {
    ctx.rankedLinks = [];
    return ok(null);
  }

  const { company_url } = ctx.input;
  ctx.rankedLinks = discoverAndRankLinks(ctx.homepageHtml, company_url, 4);
  return ok(null);
}
