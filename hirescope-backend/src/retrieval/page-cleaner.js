/**
 * HireScope — Page Cleaner
 *
 * Cleans HTML to readable text for LLM ingestion:
 * - Strips scripts, styles, headers, footers, navs, svgs, forms
 * - Collapses excessive whitespace
 * - Caps maximum character length
 */

import * as cheerio from "cheerio";

export function cleanHtmlToText(html, maxLength = 15000) {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    const $ = cheerio.load(html);

    // Remove noise elements
    $(
      "script, style, noscript, nav, header, footer, svg, iframe, form, button, input, select, textarea, [aria-hidden='true']"
    ).remove();

    // Extract text from main content or body
    const mainContent = $("main, article, #content, .content, body").first();
    const text = (mainContent.length ? mainContent.text() : $.text()) || "";

    // Normalize whitespace
    const cleaned = text
      .replace(/\r\n|\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.slice(0, maxLength) + "\n\n[Content truncated for length...]";
  } catch {
    // Fallback regex cleaner
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }
}
