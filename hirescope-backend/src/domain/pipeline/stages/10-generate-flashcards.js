/**
 * Stage 10: Generate Flashcards (Section F)
 * LLM call #5. One flashcard per key concept, requirement_ids populated.
 */
import { ok } from "../../../utils/result.js";

export async function generateFlashcards(ctx, deps) {
  // TODO: LLM call via deps.llmClient
  // - Derived from requirements + generated questions
  // - One flashcard per key concept
  // - Populate requirement_ids
  // - Validate with FlashcardSchema
  ctx.flashcards = [];
  return ok(null);
}
