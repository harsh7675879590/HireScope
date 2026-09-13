/**
 * Stage 4: Clean Page (Section F)
 * Strip nav/scripts/styles, collapse whitespace, cap length before LLM context.
 */

import { ok } from "../../../utils/result.js";
import { cleanHtmlToText } from "../../../retrieval/page-cleaner.js";

export async function cleanPage(ctx, _deps) {
  if (!ctx.homepageHtml) {
    ctx.homepageCleanText = "";
    return ok(null);
  }

  ctx.homepageCleanText = cleanHtmlToText(ctx.homepageHtml, 12000);
  return ok(null);
}
