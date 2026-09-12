/**
 * Stage 15: Full Kit Schema Validation (Section F)
 * Zod against Appendix A shape + internal invariants.
 */
import { ok, err } from "../../../utils/result.js";
import { validateKit } from "../../../validation/kit-schema.js";

export async function schemaValidation(ctx, _deps) {
  // Assemble the full kit object
  ctx.kit = {
    role: ctx.role || "",
    seniority: ctx.seniority || "",
    responsibilities: ctx.responsibilities || [],
    requirements: ctx.requirements,
    company_brief: ctx.companyBrief || {
      company_name: "",
      overview: "Not available",
      culture: "Not available",
      recent_news: "Not available",
      interview_process: "Not available",
      hiring_page_url: null,
      sources: [],
    },
    questions: ctx.questions.filter((q) => !q._state?.deleted),
    flashcards: ctx.flashcards.filter((f) => !f._state?.deleted),
    schedule: ctx.schedule,
    coverage: ctx.coverage || { uncovered_requirement_ids: [], passes: 0 },
  };

  const result = validateKit(ctx.kit);
  if (!result.ok) {
    return err({
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Kit failed schema validation",
      details: result.error,
    });
  }

  return ok(null);
}
