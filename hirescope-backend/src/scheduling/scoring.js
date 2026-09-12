/**
 * HireScope — Scoring Function (Section H)
 *
 * Pure deterministic scoring for schedule allocation.
 * Higher score = more urgent = scheduled earlier.
 *
 * score(q) =
 *   (requirement.priority === "must" ? 100 : 0)
 *   + difficulty(q) * 10
 *   + categoryWeight(q.category)
 *   + q.requirement_ids.length
 */

import { CATEGORY_WEIGHTS } from "../domain/types.js";

/**
 * Score a question for scheduling priority.
 *
 * @param {object} question - Question with { difficulty, category, requirement_ids }
 * @param {Array}  requirements - All requirements (to check priority of linked ones)
 * @returns {number} Score (higher = more urgent)
 */
export function scoreQuestion(question, requirements) {
  const reqMap = new Map(requirements.map((r) => [r.id, r]));

  // Check if any linked requirement is must-have
  const hasMust = question.requirement_ids.some((rid) => {
    const req = reqMap.get(rid);
    return req && req.priority === "must";
  });

  const priorityScore = hasMust ? 100 : 0;
  const difficultyScore = (question.difficulty || 1) * 10;
  const categoryScore = CATEGORY_WEIGHTS[question.category] || 0;
  const coverageScore = question.requirement_ids.length;

  return priorityScore + difficultyScore + categoryScore + coverageScore;
}
