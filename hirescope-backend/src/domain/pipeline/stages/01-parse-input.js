/**
 * Stage 1: Parse & Validate Input (Section F)
 * Zod schema on { jd, company_url, days }. Reject empty JD, malformed URL,
 * non-positive/non-integer days early with a clear error code.
 */

import { ok, err } from "../../../utils/result.js";
import { KitInputSchema } from "../../../shared/types/kit.js";

export async function parseInput(ctx, _deps) {
  const parsed = KitInputSchema.safeParse(ctx.input);

  if (!parsed.success) {
    return err({
      code: "INVALID_INPUT",
      message: "Input validation failed",
      details: parsed.error.flatten(),
    });
  }

  ctx.input = parsed.data;
  return ok(null);
}
