/**
 * Stage 11: Coverage Pass 1 (Section G)
 * Pure deterministic function — no I/O, no LLM.
 */
import { ok } from "../../../utils/result.js";
import { checkCoverage } from "../../../validation/coverage-checker.js";

export async function coveragePass1(ctx, _deps) {
  ctx.coverage = checkCoverage(ctx.requirements, ctx.questions);
  ctx.coverage.passes = 1;
  return ok(null);
}
