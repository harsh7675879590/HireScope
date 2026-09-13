/**
 * HireScope — Flashcard Generator (Section F Stage 10)
 *
 * Generates flashcards for key concepts and technical definitions.
 * Each flashcard:
 * - id
 * - front (prompt / question)
 * - back (concise answer / explanation)
 * - requirement_ids
 * - _state
 */

import { generateId } from "../utils/ids.js";
import { llmClient } from "../llm/client.js";
import logger from "../utils/logger.js";

export async function generateFlashcards(
  { role, requirements, questions },
  customLlm = llmClient,
  batchNumber = 1
) {
  const prompt = `You are a technical interview coach creating flashcards for active recall practice.
Role: ${role || "Software Engineer"}

CRITICAL RULES:
1. Generate between 5 and 10 high-impact flashcards.
2. The "front" should be a focused technical query, definition check, or trade-off question.
3. The "back" should be a punchy, precise explanation or bullet points (under 80 words).
4. Each flashcard MUST link to one or more requirement IDs from the provided requirements.
5. Output strictly valid JSON matching this schema:
{
  "flashcards": [
    {
      "front": "Question / Prompt for card front",
      "back": "Answer / Key concepts for card back",
      "requirement_ids": ["req-1"]
    }
  ]
}

REQUIREMENTS:
${JSON.stringify((requirements || []).slice(0, 10), null, 2)}

KEY QUESTIONS GENERATED:
${JSON.stringify((questions || []).slice(0, 8).map((q) => ({ title: q.title, category: q.category, reqs: q.requirement_ids })), null, 2)}`;

  try {
    const res = await customLlm.completeJson(prompt, null, {
      operationName: "generate_flashcards"
    });

    const list = Array.isArray(res.flashcards) ? res.flashcards : [];
    return list.map((fc, i) => ({
      id: generateId("fc"),
      front: fc.front || `Core Concept ${i + 1}`,
      back: fc.back || "Key conceptual explanation.",
      requirement_ids: Array.isArray(fc.requirement_ids) && fc.requirement_ids.length > 0
        ? fc.requirement_ids
        : [requirements[0]?.id || "req-1"],
      _state: {
        origin: "generated",
        edited: false,
        pinned: false,
        deleted: false,
        generationBatch: batchNumber
      }
    }));
  } catch (err) {
    logger.warn(`Flashcard generation error: ${err.message}. Synthesizing fallback flashcards.`);
    return (requirements || []).slice(0, 5).map((req, idx) => ({
      id: generateId("fc"),
      front: `Core principles of ${req.text}`,
      back: `Understanding key architectural trade-offs, performance patterns, and implementation practices for ${req.text}.`,
      requirement_ids: [req.id],
      _state: {
        origin: "generated",
        edited: false,
        pinned: false,
        deleted: false,
        generationBatch: batchNumber
      }
    }));
  }
}
