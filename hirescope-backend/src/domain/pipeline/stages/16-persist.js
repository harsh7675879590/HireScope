/**
 * Stage 16: Persist (Section F)
 * Write to Mongo. Only now is status flipped to "ready".
 */
import { ok } from "../../../utils/result.js";

export async function persist(ctx, deps) {
  // TODO: Use deps.kitRepository.updateKit() to save the kit
  // - Flip status to "ready"
  // - Save the full kit object
  // - This is the only stage that touches the database
  return ok(null);
}
