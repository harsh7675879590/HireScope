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
      .select({ "kit.questions": 0, "kit.flashcards": 0 })
      .lean();
  }

  /** Get full kit detail — ownership enforced. */
  async findByIdForUser(kitId, userId) {
    return KitModel.findOne({ _id: kitId, userId }).lean();
  }

  async findById(userId, kitId) {
    return KitModel.findOne({ _id: kitId, userId }).lean();
  }

  /** Create a new kit draft. */
  async create(data) {
    const kit = new KitModel({
      userId: data.userId,
      status: data.status || "draft",
      input: data.input,
      kit: data.kit || null,
      meta: {
        generationLog: data.meta?.generationLog || [],
        stateVersion: data.meta?.stateVersion || 0,
        dedupeKey: data.dedupeKey || data.meta?.dedupeKey,
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

  async findByDedupeKey(userId, dedupeKey) {
    return this.findDuplicate(userId, dedupeKey);
  }

  /** Update kit status. */
  async updateStatus(kitId, userId, status) {
    return KitModel.findOneAndUpdate(
      { _id: kitId, userId },
      { status },
      { new: true }
    );
  }

  /** Generic update for kit record. */
  async update(userId, kitId, updates) {
    return KitModel.findOneAndUpdate(
      { _id: kitId, userId },
      { $set: updates },
      { new: true }
    );
  }

  /** Update the full kit data with optimistic concurrency (stateVersion). */
  async updateKit(kitId, userId, expectedVersion, updates) {
    const query = { _id: kitId, userId };
    if (typeof expectedVersion === "number") {
      query["meta.stateVersion"] = expectedVersion;
    }

    const result = await KitModel.findOneAndUpdate(
      query,
      {
        ...updates,
        $inc: { "meta.stateVersion": 1 },
      },
      { new: true }
    );

    if (!result) {
      const exists = await KitModel.findOne({ _id: kitId, userId });
      if (!exists) return { error: "NOT_FOUND" };
      return { error: "VERSION_CONFLICT" };
    }

    return { value: result };
  }

  async updateKitData(userId, kitId, updatedKit, expectedVersion) {
    const query = { _id: kitId, userId };
    if (typeof expectedVersion === "number") {
      query["meta.stateVersion"] = expectedVersion;
    }

    return KitModel.findOneAndUpdate(
      query,
      {
        $set: { kit: updatedKit },
        $inc: { "meta.stateVersion": 1 }
      },
      { new: true }
    );
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

  async delete(userId, kitId) {
    return KitModel.findOneAndDelete({ _id: kitId, userId });
  }
}

export const kitRepository = new KitRepository();
