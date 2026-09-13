/**
 * Stage 15: Full Kit Schema Validation (Section F)
 * Zod against Appendix A shape + internal invariants.
 */

import { ok, err } from "../../../utils/result.js";
import { validateKit } from "../../../validation/kit-schema.js";

export async function schemaValidation(ctx, _deps) {
  const brief = ctx.companyBrief || {};

  ctx.kit = {
    role: ctx.role || "Software Engineer",
    seniority: ctx.seniority || "Mid-Level",
    responsibilities: ctx.responsibilities || ["Design and build software"],
    requirements: ctx.requirements || [],
    company_brief: {
      company_name: brief.company_name || ctx.companyName || "Target Company",
      overview: brief.overview || "Overview not available",
      culture: brief.culture || "Engineering culture details not available",
      recent_news: brief.recent_news || "No recent updates available",
      interview_process: brief.interview_process || "Standard interview process",
      hiring_page_url: brief.hiring_page_url || null,
      sources: Array.isArray(brief.sources) ? brief.sources : ["Web retrieval"]
    },
    questions: (ctx.questions || []).filter((q) => !q._state?.deleted),
    flashcards: (ctx.flashcards || []).filter((f) => !f._state?.deleted),
    schedule: ctx.schedule || [],
    coverage: ctx.coverage || { uncovered_requirement_ids: [], passes: 1 }
  };

  const result = validateKit(ctx.kit);
  if (!result.ok) {
    return err({
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Kit failed schema validation",
      details: result.error
    });
  }

  return ok(null);
}
