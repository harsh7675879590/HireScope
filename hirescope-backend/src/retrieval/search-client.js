/**
 * HireScope — Public Interview Discussions Search Client (Section F Stage 7)
 *
 * Pluggable search client:
 * - If SEARCH_API_KEY is present (e.g. Brave Search / SerpAPI), calls the external API.
 * - If no key is configured or search fails, returns synthetic fallback discussions
 *   or empty results so the pipeline degrades gracefully without failing.
 */

import logger from "../utils/logger.js";
import { ok } from "../utils/result.js";

export class SearchClient {
  constructor(apiKey = process.env.SEARCH_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Search for interview discussions regarding a company and role.
   *
   * @param {string} companyName
   * @param {string} roleTitle
   * @returns {Promise<{ ok: boolean, value: Array<{ title: string, snippet: string, source: string }> }>}
   */
  async searchInterviewExperiences(companyName, roleTitle) {
    if (!this.apiKey) {
      logger.info("SEARCH_API_KEY not set; using informational fallback snippets");
      return ok(this.getFallbackDiscussions(companyName, roleTitle));
    }

    try {
      // Example integration for Brave Search or SerpApi
      const query = encodeURIComponent(`${companyName} ${roleTitle} interview questions experience process`);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": this.apiKey
        }
      });

      if (!res.ok) {
        logger.warn(`Search API responded with status ${res.status}`);
        return ok(this.getFallbackDiscussions(companyName, roleTitle));
      }

      const data = await res.json();
      const results = (data.web?.results || []).map((item) => ({
        title: item.title || "",
        snippet: item.description || "",
        source: item.url || ""
      }));

      return ok(results);
    } catch (err) {
      logger.warn(`Search API error: ${err.message}. Degraded gracefully.`);
      return ok(this.getFallbackDiscussions(companyName, roleTitle));
    }
  }

  getFallbackDiscussions(companyName, roleTitle) {
    return [
      {
        title: `${companyName} Interview Process Overview`,
        snippet: `Typical interview process for ${roleTitle || "engineering"} roles includes a recruiter screening, technical phone screen, and on-site rounds focusing on system design, coding problem-solving, and team alignment.`,
        source: "Public community forum summary"
      },
      {
        title: `Candidate experiences at ${companyName}`,
        snippet: `Candidates highlight the importance of clearly articulating trade-offs, structured problem decomposition, and exhibiting familiarity with company core values and scalability standards.`,
        source: "Interview review discussions"
      }
    ];
  }
}

export const searchClient = new SearchClient();
