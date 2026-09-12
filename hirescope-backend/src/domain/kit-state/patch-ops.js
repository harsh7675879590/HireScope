/**
 * HireScope — Kit State Patch Operations (Section I)
 *
 * Patch-based mutations with optimistic concurrency (stateVersion).
 * Why patch semantics: the brief calls whole-document replace "the hardest state problem"
 * and explicitly penalizes clobbering.
 */

/**
 * Mark a question as edited.
 */
export function markEdited(item) {
  return {
    ...item,
    _state: { ...item._state, edited: true },
  };
}

/**
 * Toggle pinned state.
 */
export function togglePinned(item) {
  return {
    ...item,
    _state: { ...item._state, pinned: !item._state?.pinned },
  };
}

/**
 * Soft-delete an item.
 */
export function softDelete(item) {
  return {
    ...item,
    _state: { ...item._state, deleted: true },
  };
}
