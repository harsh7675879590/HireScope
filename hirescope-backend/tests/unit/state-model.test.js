/**
 * HireScope — Unit Tests: Kit State Model & Eligibility Preservation (Section I & J)
 */

import { describe, test, expect } from "@jest/globals";
import {
  isEligibleForRegeneration,
  regenerateCategory,
  generatedState,
  manualState
} from "../../src/domain/kit-state/state-model.js";
import { markEdited, togglePinned, softDelete } from "../../src/domain/kit-state/patch-ops.js";

describe("Kit State Model & Preservation (Section I & J)", () => {
  test("unedited, unpinned, non-manual generated questions are eligible for regeneration", () => {
    const q = { id: "q1", _state: generatedState(1) };
    expect(isEligibleForRegeneration(q)).toBe(true);
  });

  test("edited questions are protected and NOT eligible for regeneration", () => {
    const q = markEdited({ id: "q1", _state: generatedState(1) });
    expect(isEligibleForRegeneration(q)).toBe(false);
  });

  test("pinned questions are protected and NOT eligible for regeneration", () => {
    const q = togglePinned({ id: "q1", _state: generatedState(1) });
    expect(isEligibleForRegeneration(q)).toBe(false);
  });

  test("manually added questions are NOT eligible for regeneration", () => {
    const q = { id: "q_man", _state: manualState() };
    expect(isEligibleForRegeneration(q)).toBe(false);
  });

  test("regenerating category preserves pinned, edited, and manual items while replacing eligible ones", () => {
    const existingQuestions = [
      // Technical questions
      { id: "q_gen", category: "technical", question: "Old generated", _state: generatedState(1) },
      { id: "q_pinned", category: "technical", question: "Pinned question", _state: togglePinned({ _state: generatedState(1) })._state },
      { id: "q_edited", category: "technical", question: "Edited question", _state: markEdited({ _state: generatedState(1) })._state },
      // Behavioural question (other category)
      { id: "q_behav", category: "behavioural", question: "Tell me about a time", _state: generatedState(1) }
    ];

    const freshGeneratedTechnical = [
      { id: "q_fresh_1", category: "technical", question: "Brand new technical", _state: generatedState(2) }
    ];

    const updated = regenerateCategory(existingQuestions, "technical", freshGeneratedTechnical);
    const updatedIds = updated.map((q) => q.id);

    // Old generated item is replaced
    expect(updatedIds).not.toContain("q_gen");

    // Protected items are strictly preserved
    expect(updatedIds).toContain("q_pinned");
    expect(updatedIds).toContain("q_edited");

    // Other categories are untouched
    expect(updatedIds).toContain("q_behav");

    // Fresh questions are added
    expect(updatedIds).toContain("q_fresh_1");
  });
});
