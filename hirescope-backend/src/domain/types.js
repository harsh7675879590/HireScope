/**
 * HireScope — Domain Types
 *
 * Pure domain types and constants used across the pipeline.
 * No I/O dependencies — this is the innermost layer.
 */

/** All 16 pipeline stage names in execution order. */
export const PIPELINE_STAGES = [
  "parse-input",
  "extract-requirements",
  "fetch-homepage",
  "clean-page",
  "discover-rank-links",
  "fetch-subpages",
  "search-discussions",
  "generate-brief",
  "generate-questions",
  "generate-flashcards",
  "coverage-pass-1",
  "gap-fill",
  "coverage-pass-2",
  "schedule-allocation",
  "schema-validation",
  "persist",
];

/** Question categories for per-category generation (Section F stage 9). */
export const QUESTION_CATEGORIES = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
];

/** Maximum coverage passes before failing (Section G). */
export const MAX_COVERAGE_PASSES = 3;

/** Maximum number of subpages to fetch (Section F stage 6). */
export const MAX_SUBPAGES = 5;

/** Maximum days for schedule sanity ceiling (Section H). */
export const MAX_SCHEDULE_DAYS = 90;

/** Default difficulty-to-minutes mapping (Section H). */
export const DIFFICULTY_MINUTES = {
  1: 10,
  2: 15,
  3: 20,
};

/**
 * Category weights for schedule scoring tie-breaking (Section H).
 * Higher = scheduled earlier.
 */
export const CATEGORY_WEIGHTS = {
  "system-design": 4,
  "technical": 3,
  "behavioural": 2,
  "company-fit": 1,
};

/**
 * Keywords for link discovery scoring (Section F stage 5).
 * Deterministic — NOT an LLM call.
 */
export const LINK_DISCOVERY_KEYWORDS = [
  "careers", "hiring", "jobs", "about", "culture",
  "interview", "engineering", "blog", "handbook",
  "team", "values", "work", "join", "opportunities",
];
