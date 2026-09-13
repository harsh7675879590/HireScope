/**
 * HireScope — Unit Tests: Coverage Checker (Section J)
 */

import { describe, test, expect } from "@jest/globals";
import { checkCoverage } from "../../src/validation/coverage-checker.js";

describe("Coverage Checker (Pure Deterministic Function)", () => {
  const requirements = [
    { id: "r1", text: "5+ years Node.js", priority: "must", kind: "technical" },
    { id: "r2", text: "PostgreSQL and MongoDB", priority: "must", kind: "technical" },
    { id: "r3", text: "Distributed systems", priority: "must", kind: "system-design" },
    { id: "r4", text: "Kubernetes experience", priority: "nice", kind: "technical" }
  ];

  test("returns empty uncovered list when all must requirements are covered", () => {
    const questions = [
      { id: "q1", requirement_ids: ["r1", "r2"] },
      { id: "q2", requirement_ids: ["r3"] }
    ];

    const result = checkCoverage(requirements, questions);
    expect(result.uncovered_requirement_ids).toEqual([]);
  });

  test("accurately reports uncovered must requirements", () => {
    const questions = [
      { id: "q1", requirement_ids: ["r1"] }
    ];

    const result = checkCoverage(requirements, questions);
    expect(result.uncovered_requirement_ids).toEqual(["r2", "r3"]);
  });

  test("nice-to-have requirements are never marked as uncovered failures", () => {
    const questions = [
      { id: "q1", requirement_ids: ["r1"] },
      { id: "q2", requirement_ids: ["r2"] },
      { id: "q3", requirement_ids: ["r3"] }
    ];

    // r4 (nice) is NOT covered, but should NOT appear in uncovered_requirement_ids
    const result = checkCoverage(requirements, questions);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.uncovered_requirement_ids.includes("r4")).toBe(false);
  });

  test("handles empty questions array gracefully", () => {
    const result = checkCoverage(requirements, []);
    expect(result.uncovered_requirement_ids).toEqual(["r1", "r2", "r3"]);
  });
});
