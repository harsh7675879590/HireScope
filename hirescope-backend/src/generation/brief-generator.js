/**
 * HireScope — Company Brief Generator (Section F Stage 8)
 *
 * Matches CompanyBriefSchema:
 * { company_name, overview, culture, recent_news, interview_process, hiring_page_url, sources }
 */

import { llmClient } from "../llm/client.js";

export async function generateCompanyBrief({ companyName, homepageText, subpagesText = [], discussions = [], hiringPageUrl = null }, customLlm = llmClient) {
  const sources = [];
  if (homepageText) sources.push("Company Homepage");
  subpagesText.forEach((sp) => {
    if (sp && sp.url) sources.push(sp.url);
  });
  discussions.forEach((d) => {
    if (d && d.source) sources.push(d.source);
  });

  const prompt = `You are a research analyst preparing a factual Company Brief for an interview preparation kit.

CRITICAL INSTRUCTIONS:
1. Base your brief ONLY on the provided crawled page text and public interview discussions.
2. If certain information is missing or thin, state "Not publicly specified in scraped data" rather than inventing facts.
3. Output strictly valid JSON matching this schema:
{
  "company_name": "${companyName || "Target Company"}",
  "overview": "Summary of company mission and product focus",
  "culture": "Company values, working culture, and team structure",
  "recent_news": "Recent public milestones, blog highlights, or releases",
  "interview_process": "Expected interview stages, tone, and format",
  "hiring_page_url": null,
  "sources": ["source 1"]
}

COMPANY NAME: ${companyName || "Target Company"}

CRAWLED HOMEPAGE CONTENT:
"""
${(homepageText || "").slice(0, 4000)}
"""

SUBPAGES CONTENT:
"""
${subpagesText.map((s) => s.text || "").join("\n---\n").slice(0, 4000)}
"""

INTERVIEW DISCUSSIONS:
"""
${discussions.map((d) => `${d.title}: ${d.snippet}`).join("\n").slice(0, 3000)}
"""`;

  try {
    const result = await customLlm.completeJson(prompt, null, {
      operationName: "generate_company_brief"
    });

    return {
      company_name: result.company_name || companyName || "Target Company",
      overview: result.overview || "Company overview not publicly available from scraped sources.",
      culture: typeof result.culture === "string" ? result.culture : Array.isArray(result.culture) ? result.culture.join(". ") : "Collaborative engineering and high standards.",
      recent_news: result.recent_news || "No recent public press or updates found in scraped content.",
      interview_process: result.interview_process || "Technical screening followed by system architecture and behavioral rounds.",
      hiring_page_url: hiringPageUrl || (subpagesText.length > 0 ? subpagesText[0].url : null),
      sources: sources.length > 0 ? Array.from(new Set(sources)) : ["Scraped web content"]
    };
  } catch {
    return {
      company_name: companyName || "Target Company",
      overview: "Company overview not publicly available from scraped sources.",
      culture: "Collaborative engineering culture emphasizing accountability and ownership.",
      recent_news: "No recent updates found.",
      interview_process: "Standard technical problem-solving and domain evaluation.",
      hiring_page_url: hiringPageUrl || null,
      sources: sources.length > 0 ? Array.from(new Set(sources)) : ["Web crawl & public discussion insights"]
    };
  }
}
