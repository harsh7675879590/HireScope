/**
 * HireScope — Kit Service (Section E, F, I)
 *
 * Handles:
 * - Async generation initiation
 * - Deduplication checking (dedupeKey = sha256(jd + company_url))
 * - Kit mutations (add/edit/delete/pin/reorder)
 * - Partial section regeneration with eligibility preservation
 */

import { kitRepository } from "../persistence/repositories/kit.repository.js";
import { runPipeline } from "../domain/pipeline/orchestrator.js";
import { llmClient } from "../llm/client.js";
import { safeFetcher } from "../retrieval/fetcher.js";
import { searchClient } from "../retrieval/search-client.js";
import { hashDedupeKey, generateId } from "../utils/ids.js";
import { ok, err } from "../utils/result.js";
import logger from "../utils/logger.js";
import {
  isEligibleForRegeneration,
  regenerateCategory,
  manualState
} from "../domain/kit-state/state-model.js";
import { markEdited, togglePinned, softDelete } from "../domain/kit-state/patch-ops.js";
import { generateQuestionsForCategory } from "../generation/question-generator.js";
import { generateFlashcards } from "../generation/flashcard-generator.js";
import { generateCompanyBrief } from "../generation/brief-generator.js";
import { checkCoverage } from "../validation/coverage-checker.js";
import { allocateSchedule } from "../scheduling/allocator.js";

// In-memory progress tracking for real-time SSE/polling before DB updates
const progressMap = new Map();

export class KitService {
  constructor(repo = kitRepository) {
    this.repo = repo;
  }

  async createKit(userId, input) {
    const dedupeKey = hashDedupeKey(input.jd, input.company_url);

    // Check for existing duplicate
    const existing = await this.repo.findByDedupeKey(userId, dedupeKey);
    if (existing && existing.status !== "failed") {
      logger.info(`Duplicate kit found for user ${userId}, returning existing kit ${existing._id}`);
      return ok({
        kitId: existing._id.toString(),
        status: existing.status,
        isExisting: true
      });
    }

    // Create initial kit in "generating" status
    const created = await this.repo.create({
      userId,
      status: "generating",
      input,
      kit: null,
      meta: {
        generationLog: [],
        stateVersion: 1,
        dedupeKey
      }
    });

    const kitId = created._id.toString();

    // Trigger async pipeline in background
    this.startAsyncGeneration(userId, kitId, input);

    return ok({
      kitId,
      status: "generating",
      isExisting: false
    });
  }

  startAsyncGeneration(userId, kitId, input) {
    const deps = {
      llmClient,
      fetcher: safeFetcher,
      searchClient,
      kitRepository: this.repo
    };

    runPipeline(
      input,
      deps,
      (progress) => {
        progressMap.set(kitId, progress);
      }
    )
      .then(async (result) => {
        progressMap.delete(kitId);
        if (result.ok) {
          await this.repo.update(userId, kitId, {
            status: "ready",
            kit: result.value.kit,
            "meta.generationLog": result.value.generationLog
          });
          logger.info(`Async generation completed successfully for kit ${kitId}`);
        } else {
          await this.repo.update(userId, kitId, {
            status: "failed",
            "meta.generationLog": result.error.generationLog || []
          });
          logger.error(`Async generation failed for kit ${kitId}: ${result.error?.message}`);
        }
      })
      .catch(async (error) => {
        progressMap.delete(kitId);
        logger.error(`Async generation error for kit ${kitId}: ${error.message}`);
        await this.repo.update(userId, kitId, {
          status: "failed"
        });
      });
  }

  async getKit(userId, kitId) {
    const kit = await this.repo.findById(userId, kitId);
    if (!kit) {
      return err({ code: "NOT_FOUND", message: "Kit not found" });
    }
    return ok(kit);
  }

  async listKits(userId) {
    const kits = await this.repo.listByUser(userId);
    return ok(kits);
  }

  async deleteKit(userId, kitId) {
    const deleted = await this.repo.delete(userId, kitId);
    if (!deleted) {
      return err({ code: "NOT_FOUND", message: "Kit not found" });
    }
    return ok({ success: true });
  }

  async getProgress(kitId) {
    const progress = progressMap.get(kitId);
    return ok(progress || { status: "unknown" });
  }

  // ─── Partial Section Regeneration (Section I) ──────────────────────────────────

  async regenerateSection(userId, kitId, { section }) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord || !kitRecord.kit) {
      return err({ code: "NOT_FOUND", message: "Kit not found or not ready" });
    }

    const kit = kitRecord.kit;
    let updatedKit = { ...kit };

    if (section.startsWith("questions:")) {
      const category = section.split(":")[1];
      const newQuestions = await generateQuestionsForCategory(
        category,
        {
          role: kit.role,
          seniority: kit.seniority,
          requirements: kit.requirements,
          companyBrief: kit.company_brief
        },
        llmClient,
        (kitRecord.meta?.stateVersion || 1) + 1
      );

      updatedKit.questions = regenerateCategory(kit.questions, category, newQuestions);

      // Re-run coverage and re-schedule
      updatedKit.coverage = checkCoverage(updatedKit.requirements, updatedKit.questions);
      updatedKit.schedule = allocateSchedule(updatedKit.questions, updatedKit.requirements, kitRecord.input?.days || 5);
    } else if (section === "flashcards") {
      const preservedCards = kit.flashcards.filter((f) => !isEligibleForRegeneration(f));
      const freshCards = await generateFlashcards(
        {
          role: kit.role,
          requirements: kit.requirements,
          questions: kit.questions
        },
        llmClient,
        (kitRecord.meta?.stateVersion || 1) + 1
      );
      updatedKit.flashcards = [...preservedCards, ...freshCards];
    } else if (section === "brief") {
      const newBrief = await generateCompanyBrief(
        {
          companyName: kit.company_brief?.company_name,
          homepageText: "",
          subpagesText: [],
          discussions: []
        },
        llmClient
      );
      updatedKit.company_brief = newBrief;
    } else if (section === "schedule") {
      updatedKit.schedule = allocateSchedule(
        updatedKit.questions,
        updatedKit.requirements,
        kitRecord.input?.days || 5
      );
    } else {
      return err({ code: "INVALID_SECTION", message: `Unknown regeneration section: ${section}` });
    }

    const updated = await this.repo.updateKitData(
      userId,
      kitId,
      updatedKit,
      kitRecord.meta?.stateVersion || 1
    );

    if (!updated) {
      return err({ code: "CONFLICT", message: "Kit was modified concurrently. Please refresh." });
    }

    return ok(updated);
  }

  // ─── Question Mutations (Section I) ──────────────────────────────────────────

  async patchQuestion(userId, kitId, questionId, patch) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const questions = kitRecord.kit.questions.map((q) => {
      if (q.id === questionId) {
        return markEdited({ ...q, ...patch });
      }
      return q;
    });

    const updatedKit = { ...kitRecord.kit, questions };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async addQuestion(userId, kitId, questionData) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const newQuestion = {
      id: generateId("q"),
      category: questionData.category || "technical",
      question: questionData.question,
      why_relevant: questionData.why_relevant || "User added question.",
      difficulty: Number(questionData.difficulty) || 2,
      estimated_minutes: Number(questionData.estimated_minutes) || 20,
      requirement_ids: questionData.requirement_ids || [],
      _state: manualState()
    };

    const questions = [...kitRecord.kit.questions, newQuestion];
    const updatedCoverage = checkCoverage(kitRecord.kit.requirements, questions);
    const updatedSchedule = allocateSchedule(questions, kitRecord.kit.requirements, kitRecord.input?.days || 5);

    const updatedKit = {
      ...kitRecord.kit,
      questions,
      coverage: updatedCoverage,
      schedule: updatedSchedule
    };

    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async deleteQuestion(userId, kitId, questionId) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const questions = kitRecord.kit.questions.map((q) => {
      if (q.id === questionId) {
        return softDelete(q);
      }
      return q;
    });

    const activeQuestions = questions.filter((q) => !q._state?.deleted);
    const updatedCoverage = checkCoverage(kitRecord.kit.requirements, activeQuestions);
    const updatedSchedule = allocateSchedule(activeQuestions, kitRecord.kit.requirements, kitRecord.input?.days || 5);

    const updatedKit = {
      ...kitRecord.kit,
      questions,
      coverage: updatedCoverage,
      schedule: updatedSchedule
    };

    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async togglePinQuestion(userId, kitId, questionId) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const questions = kitRecord.kit.questions.map((q) => {
      if (q.id === questionId) {
        return togglePinned(q);
      }
      return q;
    });

    const updatedKit = { ...kitRecord.kit, questions };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async reorderQuestions(userId, kitId, { orderedIds }) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const qMap = new Map(kitRecord.kit.questions.map((q) => [q.id, q]));
    const reordered = [];

    for (const id of orderedIds) {
      if (qMap.has(id)) {
        reordered.push(qMap.get(id));
        qMap.delete(id);
      }
    }
    // Append any leftover questions
    for (const remaining of qMap.values()) {
      reordered.push(remaining);
    }

    const updatedKit = { ...kitRecord.kit, questions: reordered };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  // ─── Flashcard Mutations ──────────────────────────────────────────────────────

  async patchFlashcard(userId, kitId, cardId, patch) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const flashcards = kitRecord.kit.flashcards.map((f) => {
      if (f.id === cardId) {
        return markEdited({ ...f, ...patch });
      }
      return f;
    });

    const updatedKit = { ...kitRecord.kit, flashcards };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async addFlashcard(userId, kitId, cardData) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const newCard = {
      id: generateId("fc"),
      front: cardData.front,
      back: cardData.back,
      requirement_ids: cardData.requirement_ids || [],
      _state: manualState()
    };

    const flashcards = [...kitRecord.kit.flashcards, newCard];
    const updatedKit = { ...kitRecord.kit, flashcards };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async deleteFlashcard(userId, kitId, cardId) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const flashcards = kitRecord.kit.flashcards.map((f) => {
      if (f.id === cardId) {
        return softDelete(f);
      }
      return f;
    });

    const updatedKit = { ...kitRecord.kit, flashcards };
    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }

  async patchBrief(userId, kitId, briefUpdates) {
    const kitRecord = await this.repo.findById(userId, kitId);
    if (!kitRecord) return err({ code: "NOT_FOUND", message: "Kit not found" });

    const updatedKit = {
      ...kitRecord.kit,
      company_brief: {
        ...kitRecord.kit.company_brief,
        ...briefUpdates
      }
    };

    const updated = await this.repo.updateKitData(userId, kitId, updatedKit, kitRecord.meta?.stateVersion);
    return ok(updated);
  }
}

export const kitService = new KitService();
