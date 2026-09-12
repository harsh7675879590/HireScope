/**
 * Stage 2: Extract Requirements from JD (Section F)
 *
 * LLM call #1 with deterministic must/nice lexical pre-pass.
 * Zod-validated response: { role, seniority, responsibilities, requirements[] }
 */

import { ok, err } from "../../../utils/result.js";
import logger from "../../../utils/logger.js";

/**
 * Deterministic lexical pre-pass for must/nice classification hints.
 * Scans JD text for phrasing cues before passing to LLM.
 */
function classifyPhrasing(text) {
  const mustPatterns = /\b(must|required|essential|mandatory|minimum|at least|\d\+\s*years?)\b/gi;
  const nicePatterns = /\b(nice to have|preferred|bonus|ideally|plus|advantageous|desirable)\b/gi;

  return {
    mustHints: (text.match(mustPatterns) || []).length,
    niceHints: (text.match(nicePatterns) || []).length,
  };
}

export async function extractRequirements(ctx, deps) {
  const { jd } = ctx.input;

  // Deterministic pre-pass for phrasing cues
  const phrasingHints = classifyPhrasing(jd);

  // TODO: Implement LLM call via deps.llmClient
  // - Use narrow prompt from prompts/requirement-extraction.js
  // - Pass phrasingHints as constraints
  // - Validate response with Zod schema
  // - Sanity check: can't have zero requirements from a non-trivial JD
  // - LLM classifies, but code does final sanity pass

  logger.info("Stage 2: Extract requirements — awaiting LLM implementation", {
    jdLength: jd.length,
    phrasingHints,
  });

  // Placeholder until LLM integration
  ctx.requirements = [];
  ctx.role = "";
  ctx.seniority = "";
  ctx.responsibilities = [];

  return ok(null);
}
