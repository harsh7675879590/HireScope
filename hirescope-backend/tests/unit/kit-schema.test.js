/**
 * HireScope — Unit Tests: Kit Schema Validator (Section J)
 */

import { describe, test, expect } from "@jest/globals";
import { validateKit } from "../../src/validation/kit-schema.js";

describe("Kit Schema Validator (Section F & J)", () => {
  const validKit = {
    role: "Senior Backend Engineer",
    seniority: "Senior",
    responsibilities: ["Lead API architecture", "Optimize database performance"],
    requirements: [
      { id: "r1", text: "Node.js proficiency", priority: "must", kind: "technical" },
      { id: "r2", text: "Postgres or Mongo", priority: "must", kind: "technical" }
    ],
    company_brief: {
      company_name: "TechCorp",
      overview: "High scale infrastructure",
      culture: "Autonomous engineering teams",
      recent_news: "Series B expansion",
      interview_process: "Three technical stages",
      hiring_page_url: "https://example.com/careers",
      sources: ["https://example.com"]
    },
    questions: [
      {
        id: "q1",
        category: "technical",
        question: "Explain the Node.js event loop in depth",
        why_relevant: "Critical for non-blocking I/O",
        difficulty: 2,
        estimated_minutes: 20,
        requirement_ids: ["r1"]
      },
      {
        id: "q2",
        category: "system-design",
        question: "Design a distributed caching tier",
        why_relevant: "Scalability test",
        difficulty: 3,
        estimated_minutes: 30,
        requirement_ids: ["r2"]
      }
    ],
    flashcards: [
      {
        id: "fc1",
        front: "What is libuv?",
        back: "Multi-platform asynchronous I/O support library",
        requirement_ids: ["r1"]
      }
    ],
    schedule: [
      { day: 1, focus: "Event loop fundamentals", question_ids: ["q1"], minutes: 20 },
      { day: 2, focus: "Distributed caching", question_ids: ["q2"], minutes: 30 }
    ],
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1
    }
  };

  test("valid kit passes validation cleanly", () => {
    const result = validateKit(validKit);
    expect(result.ok).toBe(true);
    expect(result.value).toBeDefined();
  });

  test("fails when a schedule references a nonexistent question ID", () => {
    const invalidKit = {
      ...validKit,
      schedule: [
        { day: 1, focus: "Broken ref", question_ids: ["nonexistent-q"], minutes: 20 }
      ]
    };
    const result = validateKit(invalidKit);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result.error)).toContain("nonexistent-q");
  });

  test("fails when question difficulty is outside 1..3 range", () => {
    const invalidKit = {
      ...validKit,
      questions: [
        {
          ...validKit.questions[0],
          difficulty: 5 // Out of range!
        }
      ]
    };
    const result = validateKit(invalidKit);
    expect(result.ok).toBe(false);
  });

  test("fails when a question references a nonexistent requirement ID", () => {
    const invalidKit = {
      ...validKit,
      questions: [
        {
          ...validKit.questions[0],
          requirement_ids: ["req-does-not-exist"]
        }
      ]
    };
    const result = validateKit(invalidKit);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result.error)).toContain("req-does-not-exist");
  });
});
