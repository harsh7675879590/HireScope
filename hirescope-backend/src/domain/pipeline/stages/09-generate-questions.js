/**
 * Stage 9: Generate Questions Per Category (Section F)
 *
 * 4 SEPARATE LLM calls — one per category (technical, behavioural,
 * system-design, company-fit). "Should not come from the same call."
 * Each scoped to relevant requirements and schema-validated independently.
 */
import { ok } from "../../../utils/result.js";
import { QUESTION_CATEGORIES } from "../../types.js";

export async function generateQuestions(ctx, deps) {
  // TODO: For each category in QUESTION_CATEGORIES:
  //   1. Filter requirements relevant to this category
  //   2. Make separate LLM call via deps.llmClient
  //   3. Validate each response independently with QuestionSchema
  //   4. Assign unique IDs via questionId()
  //   5. Set _state: { origin: "generated", edited: false, pinned: false, deleted: false, generationBatch: 1 }
  ctx.questions = [];
  return ok(null);
}
