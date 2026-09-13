/**
 * HireScope — Unit Tests: Requirement Extractor & Lexical Pre-Pass (Section J)
 */

import { describe, test, expect } from "@jest/globals";
import { lexicalPrePass, extractRequirementsFromJd } from "../../src/generation/requirement-extractor.js";

describe("Requirement Extractor & Lexical Pre-Pass (Section J)", () => {
  const sampleJd = `
Senior Node.js Developer
- Must have 5+ years building backend microservices
- Required: Deep expertise in MongoDB and indexing
- Essential: Experience with high-traffic REST APIs
- Bonus points for knowledge of Kubernetes and Docker
- Preferred: Familiarity with Next.js or React
`;

  test("lexicalPrePass detects must and nice cues deterministically", () => {
    const { detectedMust, detectedNice } = lexicalPrePass(sampleJd);
    expect(detectedMust.length).toBeGreaterThanOrEqual(3);
    expect(detectedNice.length).toBeGreaterThanOrEqual(2);

    expect(detectedMust.some((l) => l.includes("Must have"))).toBe(true);
    expect(detectedNice.some((l) => l.includes("Bonus points"))).toBe(true);
  });

  test("extractRequirementsFromJd produces valid structured output with mock LLM", async () => {
    const fakeLlm = {
      completeJson: async () => ({
        role: "Senior Node.js Developer",
        seniority: "Senior",
        responsibilities: ["Build backend APIs"],
        requirements: [
          { id: "req-1", text: "5+ years backend microservices", priority: "must", kind: "technical" },
          { id: "req-2", text: "MongoDB expertise", priority: "must", kind: "technical" },
          { id: "req-3", text: "Kubernetes knowledge", priority: "nice", kind: "technical" }
        ]
      })
    };

    const result = await extractRequirementsFromJd(sampleJd, fakeLlm);
    expect(result.role).toBe("Senior Node.js Developer");
    expect(result.requirements).toHaveLength(3);
    expect(result.requirements[0].priority).toBe("must");
    expect(result.requirements[2].priority).toBe("nice");
  });
});
