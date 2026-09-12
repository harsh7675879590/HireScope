/**
 * HireScope — Kit State Model (Section I)
 *
 * Manages the _state lifecycle for questions and flashcards:
 *   generated → edited | pinned | deleted
 *   manual (user-created)
 *
 * Manual/edited/pinned items are NEVER touched by regeneration.
 */

/**
 * Create a default generated state for new items.
 */
export function generatedState(batch = 1) {
  return {
    origin: "generated",
    edited: false,
    pinned: false,
    deleted: false,
    generationBatch: batch,
  };
}

/**
 * Create a state for manually added items.
 */
export function manualState() {
  return {
    origin: "manual",
    edited: false,
    pinned: false,
    deleted: false,
    generationBatch: 0,
  };
}

/**
 * Check if an item is eligible for regeneration.
 * Only unedited, unpinned, non-manual, non-deleted generated items.
 */
export function isEligibleForRegeneration(item) {
  if (!item._state) return true; // Legacy items without state
  return (
    item._state.origin === "generated" &&
    !item._state.edited &&
    !item._state.pinned &&
    !item._state.deleted
  );
}

/**
 * Filter items to keep only those NOT eligible for regeneration (preserved items).
 */
export function getPreservedItems(items) {
  return items.filter((item) => !isEligibleForRegeneration(item));
}

/**
 * Apply regeneration to a category: remove eligible items, keep preserved ones.
 */
export function regenerateCategory(existingQuestions, category, newQuestions) {
  const preserved = existingQuestions.filter(
    (q) => q.category !== category || !isEligibleForRegeneration(q)
  );
  const otherCategories = existingQuestions.filter((q) => q.category !== category);

  return [...otherCategories, ...preserved.filter((q) => q.category === category), ...newQuestions];
}
