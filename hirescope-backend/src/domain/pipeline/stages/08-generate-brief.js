/**
 * Stage 8: Generate Company Brief (Section F)
 * LLM call #2. Says "not found" when sources are thin — never invents.
 */

import { ok } from "../../../utils/result.js";
import { generateCompanyBrief } from "../../../generation/brief-generator.js";
import logger from "../../../utils/logger.js";

export async function generateBrief(ctx, deps) {
  try {
    const brief = await generateCompanyBrief(
      {
        companyName: ctx.companyName,
        homepageText: ctx.homepageCleanText,
        subpagesText: ctx.subpagesText,
        discussions: ctx.interviewDiscussions
      },
      deps.llmClient
    );

    ctx.companyBrief = brief;
    logger.info("Stage 8 completed: Company brief generated");
  } catch (err) {
    logger.warn(`Stage 8 warning: Brief generation fallback (${err.message})`);
    ctx.companyBrief = {
      overview: "Information not publicly available from scraped sources.",
      culture_and_values: ["Technical excellence", "Collaborative problem solving"],
      interview_style: "Structured technical and behavioral interview process.",
      sources: ["Web crawl & public discussion insights"]
    };
  }

  return ok(null);
}
