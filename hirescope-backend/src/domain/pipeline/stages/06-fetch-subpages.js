/**
 * Stage 6: Fetch Top-N Ranked Subpages (Section F)
 * Same fetcher/guard pipeline, robots.txt checked per-host.
 */

import { ok } from "../../../utils/result.js";
import { safeFetcher } from "../../../retrieval/fetcher.js";
import { cleanHtmlToText } from "../../../retrieval/page-cleaner.js";
import logger from "../../../utils/logger.js";

export async function fetchSubpages(ctx, deps) {
  const fetcher = deps?.fetcher || safeFetcher;
  const links = ctx.rankedLinks || [];
  const fetchedSubpages = [];

  for (const link of links.slice(0, 3)) {
    try {
      const res = await fetcher.fetchPage(link.url);
      if (res.ok) {
        const cleaned = cleanHtmlToText(res.value.html, 6000);
        fetchedSubpages.push({
          url: link.url,
          title: link.text,
          text: cleaned
        });
      }
    } catch (err) {
      logger.warn(`Failed subpage fetch for ${link.url}: ${err.message}`);
    }
  }

  ctx.subpagesText = fetchedSubpages;
  return ok(null);
}
