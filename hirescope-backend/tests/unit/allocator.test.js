/**
 * HireScope — Unit Tests: Schedule Allocator (Section J)
 */

import { describe, test, expect } from "@jest/globals";
import { allocateSchedule } from "../../src/scheduling/allocator.js";

describe("Deterministic Schedule Allocator (Section H & J)", () => {
  const requirements = [
    { id: "r1", text: "Core Node.js", priority: "must" },
    { id: "r2", text: "System Architecture", priority: "must" },
    { id: "r3", text: "Cloud DevOps", priority: "nice" }
  ];

  const questions = [
    { id: "q1", category: "technical", difficulty: 3, estimated_minutes: 30, requirement_ids: ["r1"] },
    { id: "q2", category: "system-design", difficulty: 3, estimated_minutes: 30, requirement_ids: ["r2"] },
    { id: "q3", category: "behavioural", difficulty: 1, estimated_minutes: 15, requirement_ids: ["r1"] },
    { id: "q4", category: "company-fit", difficulty: 1, estimated_minutes: 15, requirement_ids: ["r3"] }
  ];

  test("produces exact day count for N=1, N=5, and N=60", () => {
    const sched1 = allocateSchedule(questions, requirements, 1);
    expect(sched1).toHaveLength(1);
    expect(sched1[0].day).toBe(1);

    const sched5 = allocateSchedule(questions, requirements, 5);
    expect(sched5).toHaveLength(5);
    expect(sched5.map((s) => s.day)).toEqual([1, 2, 3, 4, 5]);

    const sched60 = allocateSchedule(questions, requirements, 60);
    expect(sched60).toHaveLength(60);
    expect(sched60[59].day).toBe(60);
  });

  test("minutes per day is strictly an integer", () => {
    const sched = allocateSchedule(questions, requirements, 5);
    for (const day of sched) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(0);
    }
  });

  test("all scheduled question_ids reference existing valid questions", () => {
    const validQids = new Set(questions.map((q) => q.id));
    const sched = allocateSchedule(questions, requirements, 4);

    for (const day of sched) {
      for (const qid of day.question_ids) {
        expect(validQids.has(qid)).toBe(true);
      }
    }
  });

  test("must-have requirement questions are biased towards earlier days", () => {
    const sched = allocateSchedule(questions, requirements, 6);
    const earlyHalfDays = [sched[0], sched[1], sched[2]];
    const earlyQids = new Set(earlyHalfDays.flatMap((d) => d.question_ids));

    // q1 and q2 cover must-haves
    expect(earlyQids.has("q1") || earlyQids.has("q2")).toBe(true);
  });

  test("sparse days in large schedule (N=60) do not fabricate questions", () => {
    const sched = allocateSchedule(questions, requirements, 60);
    const day60 = sched[59];
    expect(day60.question_ids).toEqual([]);
    expect(day60.minutes).toBe(0);
    expect(day60.focus).toContain("review");
  });
});
