/**
 * HireScope — Coverage Checker (Section G)
 *
 * Pure function, no I/O, trivially unit-testable.
 * Checks that every must-have requirement is covered by at least one question.
 * Nice-to-have requirements are tracked but never block the pipeline.
 */

/**
 * @param {Array} requirements - Array of requirement objects with { id, priority }
 * @param {Array} questions    - Array of question objects with { requirement_ids }
 * @returns {{ uncovered_requirement_ids: string[], passes: number }}
 */
export function checkCoverage(requirements, questions) {
  const mustIds = new Set(
    requirements
      .filter((r) => r.priority === "must")
      .map((r) => r.id)
  );

  const covered = new Set(
    questions
      .filter((q) => !q._state?.deleted) // Ignore soft-deleted questions
      .flatMap((q) => q.requirement_ids)
  );

  const uncovered = [...mustIds].filter((id) => !covered.has(id));

  return {
    uncovered_requirement_ids: uncovered,
    passes: 0, // Set by the calling stage
  };
}
