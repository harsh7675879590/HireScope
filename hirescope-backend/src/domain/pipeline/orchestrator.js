/**
 * HireScope — Pipeline Orchestrator (Section B core)
 *
 * THE SPINE OF THE ARCHITECTURE.
 *
 * Takes { jd, company_url, days } → returns { ok: true, value: Kit } or { ok: false, error }.
 * Has ZERO knowledge of Express or the CLI — both entry points call this.
 * This is non-negotiable per the brief (Section B).
 *
 * Dependencies (LlmClient, Fetcher, etc.) are injected — not imported directly.
 * This enables tests to inject fakes.
 */

import { ok, err } from "../../utils/result.js";
import { PIPELINE_STAGES } from "../types.js";
import logger from "../../utils/logger.js";

/**
 * Run the full 16-stage kit generation pipeline.
 *
 * @param {object} input - { jd, company_url, days }
 * @param {object} deps  - Injected dependencies: { llmClient, fetcher, searchClient, kitRepository }
 * @param {function} onProgress - Optional callback for stage progress updates
 * @returns {Promise<{ok: boolean, value?: object, error?: object}>}
 */
export async function runPipeline(input, deps, onProgress) {
  const ctx = {
    input,
    requirements: [],
    homepageHtml: null,
    cleanedPageText: null,
    discoveredLinks: [],
    subpageTexts: [],
    searchResults: [],
    companyBrief: null,
    questions: [],
    flashcards: [],
    coverage: null,
    schedule: [],
    kit: null,
  };

  const generationLog = PIPELINE_STAGES.map((stage) => ({
    stage,
    status: "pending",
    startedAt: null,
    finishedAt: null,
    error: null,
  }));

  // Import stages dynamically to keep this file clean
  const stages = await loadStages();

  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stageName = PIPELINE_STAGES[i];
    const stageFn = stages[stageName];

    if (!stageFn) {
      logger.warn(`Stage "${stageName}" not implemented yet — skipping`);
      generationLog[i].status = "skipped";
      reportProgress(onProgress, generationLog, i);
      continue;
    }

    generationLog[i].status = "running";
    generationLog[i].startedAt = new Date().toISOString();
    reportProgress(onProgress, generationLog, i);

    try {
      const result = await stageFn(ctx, deps);

      if (result && !result.ok) {
        // Retrieval failures degrade gracefully; validation failures are fatal
        const isFatal = isValidationStage(stageName);

        generationLog[i].status = "failed";
        generationLog[i].error = result.error?.message || String(result.error);
        generationLog[i].finishedAt = new Date().toISOString();

        if (isFatal) {
          logger.error(`Fatal stage failure: ${stageName}`, { error: result.error });
          reportProgress(onProgress, generationLog, i);
          return err({
            code: "PIPELINE_FAILED",
            stage: stageName,
            message: result.error?.message || `Stage ${stageName} failed`,
            generationLog,
          });
        }

        // Non-fatal — continue with recorded gap
        logger.warn(`Non-fatal stage failure: ${stageName}`, { error: result.error });
      } else {
        generationLog[i].status = "completed";
      }
    } catch (error) {
      generationLog[i].status = "failed";
      generationLog[i].error = error.message;
      generationLog[i].finishedAt = new Date().toISOString();

      if (isValidationStage(stageName)) {
        logger.error(`Fatal stage exception: ${stageName}`, { error: error.message });
        reportProgress(onProgress, generationLog, i);
        return err({
          code: "PIPELINE_FAILED",
          stage: stageName,
          message: error.message,
          generationLog,
        });
      }

      logger.warn(`Non-fatal stage exception: ${stageName}`, { error: error.message });
    }

    generationLog[i].finishedAt = new Date().toISOString();
    reportProgress(onProgress, generationLog, i);
  }

  return ok({
    kit: ctx.kit,
    generationLog,
  });
}

/**
 * Determine if a stage failure should be fatal (Section F).
 * Retrieval stages degrade gracefully; validation stages are fatal.
 */
function isValidationStage(stageName) {
  return [
    "parse-input",
    "schema-validation",
  ].includes(stageName);
}

/** Report progress to callback if provided. */
function reportProgress(onProgress, generationLog, currentIndex) {
  if (typeof onProgress === "function") {
    onProgress({
      stage: generationLog[currentIndex].stage,
      stageIndex: currentIndex,
      totalStages: PIPELINE_STAGES.length,
      status: generationLog[currentIndex].status,
      generationLog,
    });
  }
}

/**
 * Dynamically load all stage functions.
 * Each stage module exports a default function: (ctx, deps) => Result
 */
async function loadStages() {
  const stageModules = {};

  try {
    const { parseInput } = await import("./stages/01-parse-input.js");
    stageModules["parse-input"] = parseInput;
  } catch { /* not yet implemented */ }

  try {
    const { extractRequirements } = await import("./stages/02-extract-requirements.js");
    stageModules["extract-requirements"] = extractRequirements;
  } catch { /* not yet implemented */ }

  try {
    const { fetchHomepage } = await import("./stages/03-fetch-homepage.js");
    stageModules["fetch-homepage"] = fetchHomepage;
  } catch { /* not yet implemented */ }

  try {
    const { cleanPage } = await import("./stages/04-clean-page.js");
    stageModules["clean-page"] = cleanPage;
  } catch { /* not yet implemented */ }

  try {
    const { discoverRankLinks } = await import("./stages/05-discover-rank-links.js");
    stageModules["discover-rank-links"] = discoverRankLinks;
  } catch { /* not yet implemented */ }

  try {
    const { fetchSubpages } = await import("./stages/06-fetch-subpages.js");
    stageModules["fetch-subpages"] = fetchSubpages;
  } catch { /* not yet implemented */ }

  try {
    const { searchDiscussions } = await import("./stages/07-search-discussions.js");
    stageModules["search-discussions"] = searchDiscussions;
  } catch { /* not yet implemented */ }

  try {
    const { generateBrief } = await import("./stages/08-generate-brief.js");
    stageModules["generate-brief"] = generateBrief;
  } catch { /* not yet implemented */ }

  try {
    const { generateQuestions } = await import("./stages/09-generate-questions.js");
    stageModules["generate-questions"] = generateQuestions;
  } catch { /* not yet implemented */ }

  try {
    const { generateFlashcards } = await import("./stages/10-generate-flashcards.js");
    stageModules["generate-flashcards"] = generateFlashcards;
  } catch { /* not yet implemented */ }

  try {
    const { coveragePass1 } = await import("./stages/11-coverage-pass-1.js");
    stageModules["coverage-pass-1"] = coveragePass1;
  } catch { /* not yet implemented */ }

  try {
    const { gapFill } = await import("./stages/12-gap-fill.js");
    stageModules["gap-fill"] = gapFill;
  } catch { /* not yet implemented */ }

  try {
    const { coveragePass2 } = await import("./stages/13-coverage-pass-2.js");
    stageModules["coverage-pass-2"] = coveragePass2;
  } catch { /* not yet implemented */ }

  try {
    const { scheduleAllocation } = await import("./stages/14-schedule-allocation.js");
    stageModules["schedule-allocation"] = scheduleAllocation;
  } catch { /* not yet implemented */ }

  try {
    const { schemaValidation } = await import("./stages/15-schema-validation.js");
    stageModules["schema-validation"] = schemaValidation;
  } catch { /* not yet implemented */ }

  try {
    const { persist } = await import("./stages/16-persist.js");
    stageModules["persist"] = persist;
  } catch { /* not yet implemented */ }

  return stageModules;
}
