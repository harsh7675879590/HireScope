/**
 * HireScope — Practice Repository
 *
 * Manages practice sessions and denormalized practice records.
 * All queries scoped by userId.
 */

import { PracticeSessionModel } from "../models/practice-session.model.js";
import { PracticeRecordModel } from "../models/practice-record.model.js";

export class PracticeRepository {
  // ─── Sessions ──────────────────────────────────────────────────────────────

  async createSession(userId, kitId) {
    const session = new PracticeSessionModel({ userId, kitId });
    return session.save();
  }

  async findSession(sessionId, userId) {
    return PracticeSessionModel.findOne({ _id: sessionId, userId });
  }

  async addCardResult(sessionId, userId, cardResult) {
    return PracticeSessionModel.findOneAndUpdate(
      { _id: sessionId, userId },
      { $push: { cardResults: cardResult } },
      { new: true }
    );
  }

  async finishSession(sessionId, userId) {
    return PracticeSessionModel.findOneAndUpdate(
      { _id: sessionId, userId },
      { finishedAt: new Date() },
      { new: true }
    );
  }

  // ─── Records (denormalized rolling state) ──────────────────────────────────

  async upsertRecord(userId, kitId, flashcardId, confidence) {
    return PracticeRecordModel.findOneAndUpdate(
      { userId, kitId, flashcardId },
      {
        $set: {
          lastConfidence: confidence,
          lastSeenAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  /** Recalculate avgConfidence after upsert. */
  async recalculateAvg(userId, kitId, flashcardId) {
    const record = await PracticeRecordModel.findOne({ userId, kitId, flashcardId });
    if (!record) return;

    // Get all confidence values from sessions for this card
    const sessions = await PracticeSessionModel.find({
      userId,
      kitId,
      "cardResults.flashcardId": flashcardId,
    });

    const confidences = sessions.flatMap((s) =>
      s.cardResults
        .filter((cr) => cr.flashcardId === flashcardId)
        .map((cr) => cr.confidence)
    );

    if (confidences.length > 0) {
      const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      record.avgConfidence = Math.round(avg * 100) / 100;
      await record.save();
    }
  }

  /** Get weak spots — cards with lowest avgConfidence, ordered ascending. */
  async getWeakSpots(userId, kitId, limit = 10) {
    return PracticeRecordModel.find({ userId, kitId })
      .sort({ avgConfidence: 1 })
      .limit(limit)
      .lean();
  }

  /** Get all practice records for a kit (for readiness calculation). */
  async getRecordsForKit(userId, kitId) {
    return PracticeRecordModel.find({ userId, kitId }).lean();
  }
}

export const practiceRepository = new PracticeRepository();
