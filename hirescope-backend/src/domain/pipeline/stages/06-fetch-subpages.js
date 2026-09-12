/**
 * Stage 6: Fetch Top-N Ranked Subpages (Section F)
 * Same fetcher/guard pipeline, robots.txt checked per-host.
 */
import { ok } from "../../../utils/result.js";
import { MAX_SUBPAGES } from "../../types.js";

export async function fetchSubpages(ctx, deps) {
  // TODO: Fetch top MAX_SUBPAGES links from ctx.discoveredLinks
  // - Use deps.fetcher for each, with SSRF guard
  // - Check robots.txt per host via deps.robotsChecker
  // - Clean each page via page-cleaner logic
  ctx.subpageTexts = [];
  return ok(null);
}
