/**
 * Stage 4: Clean Page (Section F)
 * Strip nav/scripts/styles, collapse whitespace, cap length before LLM context.
 */

import { ok } from "../../../utils/result.js";

export async function cleanPage(ctx, _deps) {
  if (!ctx.homepageHtml) {
    ctx.cleanedPageText = "";
    return ok(null);
  }

  // TODO: Use cheerio to strip scripts, styles, nav, footer
  // - Collapse whitespace
  // - Cap at max length (e.g., 8000 chars) for LLM context window
  ctx.cleanedPageText = "";
  return ok(null);
}
