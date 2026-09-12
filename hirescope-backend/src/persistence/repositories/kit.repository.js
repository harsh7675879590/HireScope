/**
 * HireScope — Kit Repository
 *
 * Every query is scoped by userId from the session — never trusted from request body.
 * Ownership enforced as defense in depth (Section D).
 */

import { KitModel } from "../models/kit.model.js";

export class KitRepository {
  /** List kits for a user, sorted by most recent. */
  async listByUser(userId) {
    return KitModel.find({ userId })
      .sort({ updatedAt: -1 })
      .select({ "kit.questions": 0, "kit.flashcards": 0 }) // Light listing
      .lean();
  }

  /** Get full kit detail — ownership enforced. */
  async findByIdForUser(kitId, userId) {
    return KitModel.findOne({ _id: kitId, userId }).lean();
  }

  /** Create a new kit draft. */
  async create({ userId, input, dedupeKey }) {
    const kit = new KitModel({
      userId,
      status: "draft",
      input,
      kit: null,
      meta: {
        generationLog: [],
        stateVersion: 0,
        dedupeKey,
      },
    });
    return kit.save();
  }

  /** Check for duplicate submission per user. */
  async findDuplicate(userId, dedupeKey) {
    return KitModel.findOne({
      userId,
      "meta.dedupeKey": dedupeKey,
      status: { $in: ["generating", "ready"] },
    }).lean();
  }

  /** Update kit status. */
  async updateStatus(kitId, userId, status) {
    return KitModel.findOneAndUpdate(
      { _id: kitId, userId },
      { status },
      { new: true }
    );
  }

  /** Update the full kit data with optimistic concurrency (stateVersion). */
  async updateKit(kitId, userId, expectedVersion, updates) {
    const result = await KitModel.findOneAndUpdate(
      {
        _id: kitId,
        userId,
        "meta.stateVersion": expectedVersion,
      },
      {
        ...updates,
        $inc: { "meta.stateVersion": 1 },
      },
      { new: true }
    );

    if (!result) {
      // Either not found, wrong user, or stale version
      const exists = await KitModel.findOne({ _id: kitId, userId });
      if (!exists) return { error: "NOT_FOUND" };
      return { error: "VERSION_CONFLICT" };
    }

    return { value: result };
  }

  /** Update generation log entries. */
  async updateGenerationLog(kitId, generationLog) {
    return KitModel.findByIdAndUpdate(
      kitId,
      { "meta.generationLog": generationLog },
      { new: true }
    );
  }

  /** Delete a kit — ownership enforced. */
  async deleteForUser(kitId, userId) {
    return KitModel.findOneAndDelete({ _id: kitId, userId });
  }
}

export const kitRepository = new KitRepository();
