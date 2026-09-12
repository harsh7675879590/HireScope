/**
 * Stage 8: Generate Company Brief (Section F)
 * LLM call #2. Says "not found" when sources are thin — never invents.
 */
import { ok } from "../../../utils/result.js";

export async function generateBrief(ctx, deps) {
  // TODO: LLM call via deps.llmClient
  // - Input: cleaned page text + search snippets
  // - Explicitly instructed to say "not found" rather than invent
  // - Validate response with CompanyBriefSchema
  ctx.companyBrief = null;
  return ok(null);
}
