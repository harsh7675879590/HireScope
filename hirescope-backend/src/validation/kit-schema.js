/**
 * HireScope — Kit Schema Validator (Section F stage 15)
 *
 * Full Zod validation against Appendix A shape + internal invariants:
 * - question_ids in schedule reference real questions
 * - difficulty 1–3, integer minutes
 * - requirement_ids reference real requirements
 */

import { KitSchema } from "../shared/types/kit.js";

/**
 * Validate a kit object against the full schema + cross-reference invariants.
 *
 * @param {object} kit
 * @returns {{ ok: boolean, value?: object, error?: object }}
 */
export function validateKit(kit) {
  // Step 1: Zod shape validation
  const parsed = KitSchema.safeParse(kit);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten() };
  }

  // Step 2: Cross-reference invariants
  const errors = [];

  const questionIds = new Set(kit.questions.map((q) => q.id));
  const requirementIds = new Set(kit.requirements.map((r) => r.id));

  // Schedule question_ids must reference existing questions
  for (const day of kit.schedule) {
    for (const qid of day.question_ids) {
      if (!questionIds.has(qid)) {
        errors.push(`Schedule day ${day.day} references nonexistent question "${qid}"`);
      }
    }
  }

  // Question requirement_ids must reference existing requirements
  for (const q of kit.questions) {
    for (const rid of q.requirement_ids) {
      if (!requirementIds.has(rid)) {
        errors.push(`Question "${q.id}" references nonexistent requirement "${rid}"`);
      }
    }
  }

  // Flashcard requirement_ids must reference existing requirements
  for (const f of kit.flashcards) {
    for (const rid of f.requirement_ids) {
      if (!requirementIds.has(rid)) {
        errors.push(`Flashcard "${f.id}" references nonexistent requirement "${rid}"`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: { invariantErrors: errors } };
  }

  return { ok: true, value: parsed.data };
}
