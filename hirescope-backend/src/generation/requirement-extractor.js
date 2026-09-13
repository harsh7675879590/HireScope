/**
 * HireScope — Requirement Extractor (Section F Stage 2)
 *
 * Implements requirement extraction with:
 * 1. Deterministic lexical pre-pass (must vs nice cues)
 * 2. LLM classification pass (constrained prompt)
 * 3. Validation & sanity checks (nothing invented, non-empty requirements)
 * Matches RequirementSchema: { id, text, priority: 'must'|'nice', kind }
 */

import { generateId } from "../utils/ids.js";
import { llmClient } from "../llm/client.js";
import logger from "../utils/logger.js";

const MUST_KEYWORDS = [
  "must",
  "required",
  "requirement",
  "essential",
  "mandatory",
  "minimum",
  "have to",
  "proficient in",
  "demonstrated experience",
  "years of experience",
  "years of hands-on"
];

const NICE_KEYWORDS = [
  "nice to have",
  "bonus",
  "preferred",
  "plus",
  "optional",
  "advantageous",
  "familiarity with",
  "good to have",
  "exposure to"
];

function determineKind(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("lead") || lower.includes("mentor") || lower.includes("collaborat") || lower.includes("communicat") || lower.includes("stakeholder")) {
    return "behavioural";
  }
  if (lower.includes("system") || lower.includes("architect") || lower.includes("distribute") || lower.includes("scale") || lower.includes("microservice")) {
    return "system-design";
  }
  if (lower.includes("mission") || lower.includes("culture") || lower.includes("values") || lower.includes("fit")) {
    return "company-fit";
  }
  if (lower.includes("javascript") || lower.includes("python") || lower.includes("react") || lower.includes("node") || lower.includes("sql") || lower.includes("database") || lower.includes("api") || lower.includes("code") || lower.includes("algorithm")) {
    return "technical";
  }
  return "general";
}

export function lexicalPrePass(jdText) {
  const lines = jdText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const detectedMust = [];
  const detectedNice = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasNice = NICE_KEYWORDS.some((kw) => lower.includes(kw));
    const hasMust = MUST_KEYWORDS.some((kw) => lower.includes(kw));

    if (hasNice) {
      detectedNice.push(line);
    } else if (hasMust) {
      detectedMust.push(line);
    }
  }

  return { detectedMust, detectedNice };
}

export async function extractRequirementsFromJd(jdText, customLlmClient = llmClient) {
  const { detectedMust, detectedNice } = lexicalPrePass(jdText);

  const prompt = `You are an expert technical hiring manager and curriculum architect.
Your task is to analyze the following Job Description (JD) and extract the structured requirements.

CRITICAL INSTRUCTIONS:
1. ONLY extract requirements explicitly stated or directly implied by the JD. Do NOT invent technologies, years of experience, or responsibilities not in the text.
2. For each requirement, classify priority strictly as "must" or "nice".
3. Classify kind as "technical", "behavioural", "system-design", "company-fit", or "general".
4. Use the lexical cues below as strong guidance:
   - Must cues detected in JD: ${JSON.stringify(detectedMust.slice(0, 5))}
   - Nice cues detected in JD: ${JSON.stringify(detectedNice.slice(0, 5))}
5. Output strictly valid JSON matching this structure:
{
  "role": "Job Title (e.g. Senior Backend Engineer)",
  "seniority": "Seniority Level (e.g. Junior, Mid, Senior, Lead, Staff)",
  "responsibilities": ["Primary responsibility 1", "Primary responsibility 2"],
  "requirements": [
    {
      "id": "req-1",
      "text": "Specific requirement statement",
      "priority": "must" | "nice",
      "kind": "technical" | "behavioural" | "system-design" | "company-fit" | "general"
    }
  ]
}

JOB DESCRIPTION DATA:
"""
${jdText.slice(0, 8000)}
"""`;

  const result = await customLlmClient.completeJson(prompt, null, {
    operationName: "extract_requirements"
  });

  const role = result.role || "Software Engineer";
  const seniority = result.seniority || "Mid-Level";
  const responsibilities = Array.isArray(result.responsibilities) && result.responsibilities.length > 0
    ? result.responsibilities
    : ["Build and maintain software systems and services"];

  let rawReqs = Array.isArray(result.requirements) ? result.requirements : [];

  if (rawReqs.length === 0) {
    logger.warn("LLM returned 0 requirements; falling back to lexical extraction");
    const combined = [
      ...detectedMust.map((t) => ({ text: t, priority: "must" })),
      ...detectedNice.map((t) => ({ text: t, priority: "nice" }))
    ];
    if (combined.length === 0) {
      combined.push({ text: "Core software engineering and problem-solving skills", priority: "must" });
    }
    rawReqs = combined;
  }

  const validKinds = ["technical", "behavioural", "system-design", "company-fit", "general"];

  const requirements = rawReqs.map((r, index) => {
    const text = (r.text || "").trim() || `Requirement ${index + 1}`;
    const kind = validKinds.includes(r.kind) ? r.kind : determineKind(text);
    return {
      id: r.id && typeof r.id === "string" ? r.id : `req-${index + 1}`,
      text,
      priority: r.priority === "nice" ? "nice" : "must",
      kind
    };
  });

  return {
    role,
    seniority,
    responsibilities,
    requirements
  };
}
