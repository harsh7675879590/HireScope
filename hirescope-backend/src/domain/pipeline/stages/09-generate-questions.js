/**
 * Stage 9: Generate Questions Per Category (Section F)
 *
 * 4 SEPARATE LLM calls — one per category (technical, behavioural,
 * system-design, company-fit). "Should not come from the same call."
 * Each scoped to relevant requirements and company brief context.
 */

import { ok, err } from "../../../utils/result.js";
import { generateAllQuestions } from "../../../generation/question-generator.js";
import logger from "../../../utils/logger.js";

export async function generateQuestions(ctx, deps) {
  try {
    const questions = await generateAllQuestions(ctx, deps.llmClient);
    ctx.questions = questions;
    logger.info(`Stage 9 completed: Generated ${questions.length} questions across 4 categories`);
    return ok(null);
  } catch (error) {
    logger.error(`Stage 9 failure: ${error.message}`);
    return err({
      code: "QUESTION_GENERATION_FAILED",
      message: `Failed to generate questions: ${error.message}`
    });
  }
}
