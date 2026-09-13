/**
 * HireScope — ID Generation
 *
 * Centralized ID generation using nanoid for collision-resistant,
 * URL-safe unique identifiers across kits, questions, flashcards, etc.
 */

import { nanoid } from "nanoid";
import { createHash } from "crypto";

/** Generate a unique ID with an optional prefix for readability. */
export function generateId(prefix) {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}

/** Generate a requirement ID: req_xxxx */
export function requirementId() {
  return generateId("req");
}

/** Generate a question ID: q_xxxx */
export function questionId() {
  return generateId("q");
}

/** Generate a flashcard ID: fc_xxxx */
export function flashcardId() {
  return generateId("fc");
}

/** Generate a session ID: sess_xxxx */
export function sessionId() {
  return generateId("sess");
}

/**
 * Generate a dedupe key from JD + company URL.
 * Used to detect duplicate submissions per user (Section D).
 */
export function dedupeKey(jd, companyUrl) {
  const hash = createHash("sha256");
  hash.update(jd.trim().toLowerCase());
  hash.update(companyUrl.trim().toLowerCase());
  return hash.digest("hex");
}

export const hashDedupeKey = dedupeKey;

