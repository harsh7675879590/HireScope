/**
 * Stage 10: Generate Flashcards (Section F)
 * LLM call #5. One flashcard per key concept, requirement_ids populated.
 */

import { ok } from "../../../utils/result.js";
import { generateFlashcards as generateCards } from "../../../generation/flashcard-generator.js";
import logger from "../../../utils/logger.js";

export async function generateFlashcards(ctx, deps) {
  try {
    const flashcards = await generateCards(
      {
        role: ctx.role,
        requirements: ctx.requirements,
        questions: ctx.questions
      },
      deps.llmClient
    );

    ctx.flashcards = flashcards;
    logger.info(`Stage 10 completed: Generated ${flashcards.length} flashcards`);
  } catch (err) {
    logger.warn(`Stage 10 warning: Flashcards generation fallback (${err.message})`);
    ctx.flashcards = [];
  }

  return ok(null);
}
