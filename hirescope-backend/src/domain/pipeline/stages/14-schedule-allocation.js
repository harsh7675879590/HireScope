/**
 * Stage 14: Schedule Allocation (Section H)
 * Pure deterministic function — no LLM.
 */
import { ok } from "../../../utils/result.js";
import { allocateSchedule } from "../../../scheduling/allocator.js";

export async function scheduleAllocation(ctx, _deps) {
  ctx.schedule = allocateSchedule(
    ctx.questions,
    ctx.requirements,
    ctx.input.days
  );
  return ok(null);
}
