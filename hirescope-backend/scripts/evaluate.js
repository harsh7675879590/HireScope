/**
 * HireScope — Evaluate CLI Entry Point (Capability 18 & Section B)
 *
 * "The evaluate CLI and the HTTP API call the exact same pipeline module —
 * this is non-negotiable per the brief."
 *
 * Reads cases from cases.json, runs them through the identical runPipeline orchestrator,
 * and writes the result to kits.json conforming to Appendix B shape.
 */

import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { runPipeline } from "../src/domain/pipeline/orchestrator.js";
import { llmClient } from "../src/llm/client.js";
import { SafeFetcher } from "../src/retrieval/fetcher.js";
import { searchClient } from "../src/retrieval/search-client.js";
import logger from "../src/utils/logger.js";

async function main() {
  const casesPath = process.argv[2] || path.join(process.cwd(), "tests/fixtures/cases.json");
  const outputPath = process.argv[3] || path.join(process.cwd(), "kits.json");

  logger.info(`[Evaluate CLI] Reading test cases from: ${casesPath}`);

  let casesRaw;
  try {
    casesRaw = await fs.readFile(casesPath, "utf-8");
  } catch (err) {
    logger.error(`Failed to read cases file: ${err.message}`);
    process.exit(1);
  }

  const cases = JSON.parse(casesRaw);
  logger.info(`[Evaluate CLI] Found ${cases.length} cases to evaluate.`);

  // Dependency injection: allow localhost in evaluation mode
  const fetcher = new SafeFetcher({ allowPrivate: true });
  const deps = {
    llmClient,
    fetcher,
    searchClient
  };

  const results = [];

  for (let idx = 0; idx < cases.length; idx++) {
    const testCase = cases[idx];
    const caseId = testCase.id || `case-${idx + 1}`;
    console.log(`\n======================================================`);
    console.log(`[Evaluate CLI] Running Case ${idx + 1}/${cases.length}: ${caseId}`);
    console.log(`Company: ${testCase.company_url} | Days: ${testCase.days}`);
    console.log(`======================================================\n`);

    const input = {
      jd: testCase.jd,
      company_url: testCase.company_url,
      days: Number(testCase.days) || 5
    };

    const startTime = Date.now();

    try {
      const result = await runPipeline(input, deps, (prog) => {
        process.stdout.write(`  [Stage ${prog.stageIndex + 1}/16] ${prog.stage}: ${prog.status}\r`);
      });

      console.log("");
      const durationMs = Date.now() - startTime;

      if (result.ok) {
        logger.info(`[Evaluate CLI] Case ${caseId} SUCCESS in ${durationMs}ms`);
        results.push({
          id: caseId,
          status: "ready",
          input,
          kit: result.value.kit,
          meta: {
            durationMs,
            generationLog: result.value.generationLog
          }
        });
      } else {
        logger.warn(`[Evaluate CLI] Case ${caseId} FAILED in ${durationMs}ms: ${result.error?.message}`);
        results.push({
          id: caseId,
          status: "failed",
          input,
          error: {
            code: result.error?.code || "EVALUATION_FAILED",
            message: result.error?.message || "Pipeline execution failed",
            stage: result.error?.stage
          },
          meta: {
            durationMs,
            generationLog: result.error?.generationLog || []
          }
        });
      }
    } catch (unexpectedError) {
      console.log("");
      logger.error(`[Evaluate CLI] Case ${caseId} UNEXPECTED CRASH: ${unexpectedError.message}`);
      results.push({
        id: caseId,
        status: "failed",
        input,
        error: {
          code: "UNEXPECTED_ERROR",
          message: unexpectedError.message
        }
      });
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf-8");
  logger.info(`\n[Evaluate CLI] Evaluation complete. Output written to ${outputPath}`);
}

main().catch((err) => {
  logger.error(`CLI execution error: ${err.message}`);
  process.exit(1);
});
