/**
 * Stage 2: Extract Requirements from JD (Section F)
 *
 * LLM call #1 with deterministic must/nice lexical pre-pass.
 * Zod-validated response: { role, seniority, responsibilities, requirements[] }
 */

import { ok, err } from "../../../utils/result.js";
import logger from "../../../utils/logger.js";
import { extractRequirementsFromJd } from "../../../generation/requirement-extractor.js";

export async function extractRequirements(ctx, deps) {
  const { jd } = ctx.input;

  try {
    const extracted = await extractRequirementsFromJd(jd, deps.llmClient);

    ctx.requirements = extracted.requirements;
    ctx.role = extracted.role;
    ctx.seniority = extracted.seniority;
    ctx.responsibilities = extracted.responsibilities;
    ctx.requirementsData = extracted;

    logger.info("Stage 2 completed: Requirements extracted", {
      role: ctx.role,
      requirementsCount: ctx.requirements.length
    });

    return ok(null);
  } catch (error) {
    logger.error(`Stage 2 failure: ${error.message}`);
    return err({
      code: "REQUIREMENT_EXTRACTION_FAILED",
      message: `Failed to extract requirements: ${error.message}`
    });
  }
}
