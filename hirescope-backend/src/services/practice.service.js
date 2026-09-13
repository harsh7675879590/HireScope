/**
 * HireScope — Practice Service (Section D & Capabilities 15 & 19)
 *
 * Manages:
 * - Practice sessions with weak-card prioritization
 * - Per-card rolling confidence tracking
 * - Creative feature: "Interview Weak Spots" analysis and readiness scoring
 */

import { practiceRepository } from "../persistence/repositories/practice.repository.js";
import { kitRepository } from "../persistence/repositories/kit.repository.js";
import { ok, err } from "../utils/result.js";

export class PracticeService {
  constructor(practiceRepo = practiceRepository, kitRepo = kitRepository) {
    this.practiceRepo = practiceRepo;
    this.kitRepo = kitRepo;
  }

  /**
   * Start a new practice session for a kit.
   * Prioritizes cards with lower confidence ratings or never-practiced cards.
   */
  async startSession(userId, kitId) {
    const kitRecord = await this.kitRepo.findById(userId, kitId);
    if (!kitRecord || !kitRecord.kit) {
      return err({ code: "NOT_FOUND", message: "Kit not found" });
    }

    const flashcards = (kitRecord.kit.flashcards || []).filter((f) => !f._state?.deleted);
    if (flashcards.length === 0) {
      return err({ code: "NO_FLASHCARDS", message: "No active flashcards in this kit" });
    }

    // Fetch existing records to order cards by weak spots
    const existingRecords = await this.practiceRepo.getRecordsForKit(userId, kitId);
    const recordMap = new Map(existingRecords.map((r) => [r.flashcardId, r]));

    // Sort: unpracticed first, then lowest avgConfidence first
    const orderedCards = [...flashcards].sort((a, b) => {
      const recA = recordMap.get(a.id);
      const recB = recordMap.get(b.id);

      if (!recA && !recB) return 0;
      if (!recA) return -1; // unpracticed first
      if (!recB) return 1;

      return (recA.avgConfidence || 3) - (recB.avgConfidence || 3);
    });

    const session = await this.practiceRepo.createSession(userId, kitId);

    return ok({
      sessionId: session._id.toString(),
      cards: orderedCards,
      totalCards: orderedCards.length
    });
  }

  /**
   * Record answer confidence rating (1-5) for a flashcard during a session.
   */
  async recordCardResult(userId, sessionId, flashcardId, confidence) {
    const validConf = Math.max(1, Math.min(5, Math.round(Number(confidence) || 3)));

    const session = await this.practiceRepo.recordCardResult(userId, sessionId, flashcardId, validConf);
    if (!session) {
      return err({ code: "SESSION_NOT_FOUND", message: "Practice session not found" });
    }

    // Update denormalized rolling practice record
    const record = await this.practiceRepo.upsertRecord(userId, session.kitId, flashcardId, validConf);

    return ok({
      session,
      record
    });
  }

  /**
   * Creative Feature: "Interview Weak Spots" report (Capability 19).
   */
  async getWeakSpots(userId, kitId) {
    const kitRecord = await this.kitRepo.findById(userId, kitId);
    if (!kitRecord || !kitRecord.kit) {
      return err({ code: "NOT_FOUND", message: "Kit not found" });
    }

    const flashcards = (kitRecord.kit.flashcards || []).filter((f) => !f._state?.deleted);
    const cardMap = new Map(flashcards.map((f) => [f.id, f]));
    const reqMap = new Map((kitRecord.kit.requirements || []).map((r) => [r.id, r]));

    const records = await this.practiceRepo.getRecordsForKit(userId, kitId);

    // Identify weak cards (avgConfidence < 3.0)
    const weakCards = [];
    const requirementStats = new Map();

    let totalScore = 0;
    let practicedCount = 0;

    for (const rec of records) {
      const card = cardMap.get(rec.flashcardId);
      if (!card) continue;

      practicedCount++;
      totalScore += rec.avgConfidence;

      if (rec.avgConfidence < 3.2) {
        weakCards.push({
          flashcardId: rec.flashcardId,
          front: card.front,
          back: card.back,
          avgConfidence: Number(rec.avgConfidence.toFixed(1)),
          attempts: rec.attempts,
          lastSeenAt: rec.lastSeenAt,
          requirements: (card.requirement_ids || []).map((rid) => reqMap.get(rid)?.text).filter(Boolean)
        });
      }

      // Aggregate by requirement
      for (const rid of card.requirement_ids || []) {
        const req = reqMap.get(rid);
        if (!req) continue;
        const current = requirementStats.get(rid) || {
          requirementId: rid,
          text: req.text,
          priority: req.priority,
          kind: req.kind,
          totalConfidence: 0,
          count: 0
        };
        current.totalConfidence += rec.avgConfidence;
        current.count++;
        requirementStats.set(rid, current);
      }
    }

    // Calculate overall interview readiness percentage
    const totalPossibleCards = flashcards.length || 1;
    const avgRating = practicedCount > 0 ? totalScore / practicedCount : 0;
    // Readiness formula: 50% based on coverage practiced, 50% based on average score (normalized to 100%)
    const coverageWeight = (practicedCount / totalPossibleCards) * 50;
    const scoreWeight = (avgRating / 5) * 50;
    const readinessScore = Math.round(coverageWeight + scoreWeight);

    const weakRequirements = Array.from(requirementStats.values())
      .map((stat) => ({
        requirementId: stat.requirementId,
        text: stat.text,
        priority: stat.priority,
        avgConfidence: Number((stat.totalConfidence / stat.count).toFixed(1)),
        practicedCards: stat.count
      }))
      .filter((stat) => stat.avgConfidence < 3.2)
      .sort((a, b) => a.avgConfidence - b.avgConfidence);

    return ok({
      readinessScore,
      practicedCount,
      totalFlashcards: flashcards.length,
      averageConfidence: Number(avgRating.toFixed(1)),
      weakCards: weakCards.sort((a, b) => a.avgConfidence - b.avgConfidence),
      weakRequirements,
      recommendation:
        readinessScore > 80
          ? "Strong interview readiness! Focus on mock timing and polish."
          : readinessScore > 50
          ? "Good progress. Prioritize the flagged weak technical concepts below."
          : "Early preparation stage. Run through initial active recall sessions."
    });
  }
}

export const practiceService = new PracticeService();
