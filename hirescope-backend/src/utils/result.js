/**
 * HireScope — Result Type Helpers
 *
 * Simple result pattern for typed error handling across the pipeline.
 * Avoids throwing exceptions for expected failures so stages degrade gracefully.
 */

export function ok(value) {
  return { ok: true, value };
}

export function err(error) {
  return { ok: false, error };
}

export function isOk(result) {
  return result.ok === true;
}

export function isErr(result) {
  return result.ok === false;
}

/** Unwrap a Result — throws if it's an error. Use only when certain or in tests. */
export function unwrap(result) {
  if (result.ok) return result.value;
  throw result.error instanceof Error
    ? result.error
    : new Error(String(result.error));
}

/** Map over the success value of a Result. */
export function mapResult(result, fn) {
  if (result.ok) return ok(fn(result.value));
  return result;
}
