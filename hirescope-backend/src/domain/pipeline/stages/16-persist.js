/**
 * Stage 16: Persist (Section F)
 * Write to Mongo. Only now is status flipped to "ready".
 */

import { ok } from "../../../utils/result.js";
import logger from "../../../utils/logger.js";

export async function persist(ctx, deps) {
  if (ctx.kitId && ctx.userId && deps?.kitRepository) {
    try {
      await deps.kitRepository.update(ctx.userId, ctx.kitId, {
        status: "ready",
        kit: ctx.kit
      });
      logger.info(`Stage 16: Kit ${ctx.kitId} successfully persisted and marked ready`);
    } catch (err) {
      logger.error(`Stage 16 persistence error: ${err.message}`);
    }
  }

  return ok(null);
}
