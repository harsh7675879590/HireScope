/**
 * Stage 7: Search Public Interview-Process Discussions (Section F)
 * Via search API, results treated as untrusted data.
 */

import { ok } from "../../../utils/result.js";
import { searchClient } from "../../../retrieval/search-client.js";

export async function searchDiscussions(ctx, deps) {
  const client = deps?.searchClient || searchClient;
  let companyName = "Company";
  try {
    const parsed = new URL(ctx.input.company_url);
    const hostParts = parsed.hostname.replace(/^www\./, "").split(".");
    if (hostParts.length > 0 && hostParts[0]) {
      companyName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
    }
  } catch {}

  const result = await client.searchInterviewExperiences(companyName, ctx.role || "Software Engineer");
  ctx.interviewDiscussions = result.ok ? result.value : [];
  ctx.companyName = companyName;

  return ok(null);
}
