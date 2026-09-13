/**
 * Stage 12: Gap-Fill Generation (Section G)
 * If uncovered_requirement_ids is non-empty, targeted LLM calls for uncovered must-haves.
 */

import { ok } from "../../../utils/result.js";
import { generateGapFillQuestions } from "../../../generation/question-generator.js";
import logger from "../../../utils/logger.js";

export async function gapFill(ctx, deps) {
  if (!ctx.coverage || ctx.coverage.uncovered_requirement_ids.length === 0) {
    return ok(null);
  }

  const uncoveredIds = new Set(ctx.coverage.uncovered_requirement_ids);
  const uncoveredReqs = (ctx.requirements || []).filter((r) => uncoveredIds.has(r.id));

  if (uncoveredReqs.length === 0) {
    return ok(null);
  }

  logger.info(`Stage 12: Gap-fill running for ${uncoveredReqs.length} uncovered must requirements`, {
    uncoveredIds: Array.from(uncoveredIds)
  });

  const gapQuestions = await generateGapFillQuestions(
    uncoveredReqs,
    ctx,
    deps.llmClient,
    (ctx.coverage.passes || 1) + 1
  );

  ctx.questions = [...(ctx.questions || []), ...gapQuestions];
  return ok(null);
}
