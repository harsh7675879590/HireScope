/**
 * HireScope — Link Discoverer and Ranker (Section F Stage 5)
 *
 * Deterministically discovers and ranks links from an HTML page.
 * Scored by anchor text and path tokens against keywords.
 * No hardcoded paths like /careers or /jobs.
 */

import * as cheerio from "cheerio";
import { URL } from "url";

const KEYWORD_WEIGHTS = {
  // Hiring / careers
  interview: 40,
  hiring: 35,
  careers: 30,
  career: 30,
  jobs: 25,
  positions: 20,
  openings: 20,

  // Culture / values
  culture: 25,
  values: 20,
  handbook: 25,
  team: 15,
  life: 15,

  // Engineering / tech
  engineering: 25,
  tech: 15,
  blog: 15,
  architecture: 20,

  // Company info
  about: 15,
  mission: 15
};

export function scoreUrlMatch(text, path) {
  const normalizedText = (text || "").toLowerCase();
  const normalizedPath = (path || "").toLowerCase();

  let score = 0;
  for (const [kw, weight] of Object.entries(KEYWORD_WEIGHTS)) {
    if (normalizedText.includes(kw)) {
      score += weight * 1.5; // Anchor text match carries higher weight
    }
    if (normalizedPath.includes(kw)) {
      score += weight;
    }
  }
  return score;
}

/**
 * Discover and rank links found within the HTML of baseUrl.
 *
 * @param {string} html - Raw HTML of the page
 * @param {string} baseUrl - Base URL to resolve relative paths
 * @param {number} maxResults - Max number of top links to return
 * @returns {Array<{ url: string, text: string, score: number }>}
 */
export function discoverAndRankLinks(html, baseUrl, maxResults = 5) {
  if (!html || typeof html !== "string") return [];

  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const $ = cheerio.load(html);
  const discovered = new Map();

  $("a[href]").each((_, el) => {
    const rawHref = $(el).attr("href");
    const anchorText = $(el).text().trim().replace(/\s+/g, " ");

    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:")) {
      return;
    }

    let resolved;
    try {
      resolved = new URL(rawHref, base.href);
    } catch {
      return;
    }

    // Must be same origin or same root domain (avoid off-site tracking / social media links)
    if (resolved.hostname !== base.hostname && !resolved.hostname.endsWith(`.${base.hostname}`)) {
      return;
    }

    // Strip hash and query parameters for deduplication
    resolved.hash = "";
    resolved.search = "";
    const cleanUrl = resolved.href;

    // Do not link back to identical root page
    if (cleanUrl === base.href || cleanUrl === `${base.origin}/`) {
      return;
    }

    const score = scoreUrlMatch(anchorText, resolved.pathname);

    if (score > 0) {
      if (!discovered.has(cleanUrl) || discovered.get(cleanUrl).score < score) {
        discovered.set(cleanUrl, {
          url: cleanUrl,
          text: anchorText,
          score
        });
      }
    }
  });

  const sorted = Array.from(discovered.values()).sort((a, b) => b.score - a.score);
  return sorted.slice(0, maxResults);
}
