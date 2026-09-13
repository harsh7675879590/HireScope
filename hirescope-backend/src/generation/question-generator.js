/**
 * HireScope — Question Generator (Section F Stage 9 & Stage 12)
 *
 * 4 SEPARATE LLM calls — one per category:
 * - technical
 * - behavioural
 * - system-design
 * - company-fit
 *
 * Matches QuestionSchema:
 * { id, category, question, why_relevant, difficulty, estimated_minutes, requirement_ids, _state }
 */

import { generateId } from "../utils/ids.js";
import { llmClient } from "../llm/client.js";
import logger from "../utils/logger.js";

const CATEGORIES = ["technical", "system-design", "behavioural", "company-fit"];

export async function generateQuestionsForCategory(
  category,
  { role, seniority, requirements, companyBrief },
  customLlm = llmClient,
  batchNumber = 1
) {
  const targetReqs = requirements && requirements.length > 0 ? requirements : [{ id: "req-1", text: "Software design" }];

  const prompt = `You are a principal technical interviewer designing in-depth evaluation questions for:
Role: ${role || "Software Engineer"}
Seniority: ${seniority || "Mid-Level"}
Category: ${category}

CRITICAL RULES:
1. Generate between 2 and 4 realistic, high-signal interview questions strictly belonging to the "${category}" category.
2. Every question MUST explicitly tie to one or more requirement IDs from the provided list.
3. Difficulty must be an integer between 1 and 3 (1=junior/foundational, 2=mid-level/applied, 3=senior/complex trade-offs).
4. estimated_minutes must be an integer between 10 and 45.
5. Provide a clear explanation of why this question is relevant.
6. Output strictly valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Clear descriptive question prompt",
      "why_relevant": "Explanation of why this assesses the candidate effectively",
      "difficulty": 1 | 2 | 3,
      "estimated_minutes": 15 | 20 | 30,
      "requirement_ids": ["req-1"]
    }
  ]
}

AVAILABLE REQUIREMENTS TO COVER:
${JSON.stringify(targetReqs, null, 2)}

COMPANY CONTEXT:
Overview: ${companyBrief?.overview || "Modern tech environment"}
Culture: ${(companyBrief?.culture || companyBrief?.culture_and_values || []).toString()}`;

  try {
    const res = await customLlm.completeJson(prompt, null, {
      operationName: `generate_questions_${category}`
    });

    const list = Array.isArray(res.questions) ? res.questions : [];
    return list.map((q, idx) => {
      const diff = [1, 2, 3].includes(Number(q.difficulty)) ? Number(q.difficulty) : 2;
      return {
        id: generateId("q"),
        category,
        question: q.question || q.title || `${category.toUpperCase()} assessment question ${idx + 1}`,
        why_relevant: q.why_relevant || q.rubric || "Validates core competencies for the role.",
        difficulty: diff,
        estimated_minutes: Number.isInteger(q.estimated_minutes) && q.estimated_minutes > 0 ? q.estimated_minutes : diff * 10,
        requirement_ids: Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0
          ? q.requirement_ids
          : [targetReqs[0]?.id || "req-1"],
        _state: {
          origin: "generated",
          edited: false,
          pinned: false,
          deleted: false,
          generationBatch: batchNumber
        }
      };
    });
  } catch (err) {
    logger.error(`Error generating questions for category ${category}: ${err.message}`);
    return [
      {
        id: generateId("q"),
        category,
        question: `Core ${category} interview evaluation for ${role}`,
        why_relevant: `Validates foundational knowledge and applied skills in ${category}.`,
        difficulty: 2,
        estimated_minutes: 20,
        requirement_ids: [targetReqs[0]?.id || "req-1"],
        _state: {
          origin: "generated",
          edited: false,
          pinned: false,
          deleted: false,
          generationBatch: batchNumber
        }
      }
    ];
  }
}

export async function generateAllQuestions(context, customLlm = llmClient) {
  const allQuestions = [];

  for (const cat of CATEGORIES) {
    const catQuestions = await generateQuestionsForCategory(
      cat,
      {
        role: context.requirementsData?.role || context.role,
        seniority: context.requirementsData?.seniority || context.seniority,
        requirements: context.requirementsData?.requirements || context.requirements,
        companyBrief: context.companyBrief
      },
      customLlm,
      1
    );
    allQuestions.push(...catQuestions);
  }

  return allQuestions;
}

export async function generateGapFillQuestions(uncoveredReqs, context, customLlm = llmClient, batchNumber = 2) {
  if (!uncoveredReqs || uncoveredReqs.length === 0) return [];

  const prompt = `You are a senior technical interviewer generating targeted gap-fill interview questions.
The following MUST-HAVE requirements have zero interview questions covering them currently.
Generate exactly 1 high-quality question per uncovered requirement to achieve 100% must-have coverage.

UNCOVERED MUST REQUIREMENTS:
${JSON.stringify(uncoveredReqs, null, 2)}

Output strictly valid JSON:
{
  "questions": [
    {
      "question": "Targeted question prompt",
      "category": "technical" | "system-design" | "behavioural" | "company-fit",
      "why_relevant": "Why this question tests this specific requirement",
      "difficulty": 1 | 2 | 3,
      "estimated_minutes": 15 | 20 | 30,
      "requirement_ids": ["req-id-covered"]
    }
  ]
}`;

  try {
    const res = await customLlm.completeJson(prompt, null, {
      operationName: "generate_gap_fill_questions"
    });

    const list = Array.isArray(res.questions) ? res.questions : [];
    return list.map((q) => {
      const diff = [1, 2, 3].includes(Number(q.difficulty)) ? Number(q.difficulty) : 2;
      return {
        id: generateId("q"),
        category: CATEGORIES.includes(q.category) ? q.category : "technical",
        question: q.question || "Targeted technical assessment",
        why_relevant: q.why_relevant || "Addresses identified requirement gap.",
        difficulty: diff,
        estimated_minutes: Number.isInteger(q.estimated_minutes) && q.estimated_minutes > 0 ? q.estimated_minutes : diff * 10,
        requirement_ids: Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0
          ? q.requirement_ids
          : [uncoveredReqs[0]?.id],
        _state: {
          origin: "generated",
          edited: false,
          pinned: false,
          deleted: false,
          generationBatch: batchNumber
        }
      };
    });
  } catch (err) {
    logger.warn(`Gap-fill LLM fallback: ${err.message}`);
    return uncoveredReqs.map((req) => ({
      id: generateId("q"),
      category: "technical",
      question: `Assessment of ${req.text}`,
      why_relevant: `Directly assesses ${req.text}`,
      difficulty: 2,
      estimated_minutes: 20,
      requirement_ids: [req.id],
      _state: {
        origin: "generated",
        edited: false,
        pinned: false,
        deleted: false,
        generationBatch: batchNumber
      }
    }));
  }
}
