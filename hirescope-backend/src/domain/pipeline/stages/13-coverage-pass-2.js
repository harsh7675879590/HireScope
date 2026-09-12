/**
 * Stage 13: Coverage Pass 2 (Section G)
 * Re-run the same pure function after gap-fill.
 */
import { ok, err } from "../../../utils/result.js";
import { checkCoverage } from "../../../validation/coverage-checker.js";
import { MAX_COVERAGE_PASSES } from "../../types.js";

export async function coveragePass2(ctx, _deps) {
  ctx.coverage = checkCoverage(ctx.requirements, ctx.questions);
  ctx.coverage.passes = 2;

  // If still uncovered after max passes, fail validation (Section G)
  if (
    ctx.coverage.passes >= MAX_COVERAGE_PASSES &&
    ctx.coverage.uncovered_requirement_ids.length > 0
  ) {
    // Kit is saved as "failed" with partial kit retained for manual completion
    return err({
      code: "COVERAGE_INCOMPLETE",
      message: `Coverage incomplete after ${MAX_COVERAGE_PASSES} passes. Uncovered: ${ctx.coverage.uncovered_requirement_ids.join(", ")}`,
    });
  }

  return ok(null);
}
