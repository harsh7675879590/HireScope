/**
 * HireScope — Kit Controller
 */

import { kitService } from "../services/kit.service.js";
import {
  CreateKitRequestSchema,
  RegenerateSectionRequestSchema,
  AddQuestionRequestSchema,
  EditQuestionRequestSchema,
  ReorderQuestionsRequestSchema,
  AddFlashcardRequestSchema,
  EditFlashcardRequestSchema,
  EditBriefRequestSchema
} from "../shared/types/api-contracts.js";

export async function createKit(req, res, next) {
  try {
    const validated = CreateKitRequestSchema.parse(req.body);
    const result = await kitService.createKit(req.session.userId, validated);

    if (!result.ok) {
      return res.status(400).json(result.error);
    }

    return res.status(202).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function listKits(req, res, next) {
  try {
    const result = await kitService.listKits(req.session.userId);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function getKit(req, res, next) {
  try {
    const result = await kitService.getKit(req.session.userId, req.params.id);
    if (!result.ok) {
      return res.status(404).json(result.error);
    }
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function deleteKit(req, res, next) {
  try {
    const result = await kitService.deleteKit(req.session.userId, req.params.id);
    if (!result.ok) {
      return res.status(404).json(result.error);
    }
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req, res, next) {
  try {
    const result = await kitService.getProgress(req.params.id);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function regenerateSection(req, res, next) {
  try {
    const validated = RegenerateSectionRequestSchema.parse(req.body);
    const result = await kitService.regenerateSection(req.session.userId, req.params.id, validated);
    if (!result.ok) {
      const status = result.error.code === "CONFLICT" ? 409 : 400;
      return res.status(status).json(result.error);
    }
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

// ─── Question Endpoints ────────────────────────────────────────────────────────

export async function patchQuestion(req, res, next) {
  try {
    const validated = EditQuestionRequestSchema.parse(req.body);
    const result = await kitService.patchQuestion(req.session.userId, req.params.id, req.params.qid, validated);
    if (!result.ok) return res.status(404).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req, res, next) {
  try {
    const validated = AddQuestionRequestSchema.parse(req.body);
    const result = await kitService.addQuestion(req.session.userId, req.params.id, validated);
    if (!result.ok) return res.status(400).json(result.error);
    return res.status(201).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const result = await kitService.deleteQuestion(req.session.userId, req.params.id, req.params.qid);
    if (!result.ok) return res.status(404).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function togglePinQuestion(req, res, next) {
  try {
    const result = await kitService.togglePinQuestion(req.session.userId, req.params.id, req.params.qid);
    if (!result.ok) return res.status(404).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function reorderQuestions(req, res, next) {
  try {
    const validated = ReorderQuestionsRequestSchema.parse(req.body);
    const result = await kitService.reorderQuestions(req.session.userId, req.params.id, validated);
    if (!result.ok) return res.status(400).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

// ─── Flashcard Endpoints ───────────────────────────────────────────────────────

export async function patchFlashcard(req, res, next) {
  try {
    const validated = EditFlashcardRequestSchema.parse(req.body);
    const result = await kitService.patchFlashcard(req.session.userId, req.params.id, req.params.fid, validated);
    if (!result.ok) return res.status(404).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function addFlashcard(req, res, next) {
  try {
    const validated = AddFlashcardRequestSchema.parse(req.body);
    const result = await kitService.addFlashcard(req.session.userId, req.params.id, validated);
    if (!result.ok) return res.status(400).json(result.error);
    return res.status(201).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function deleteFlashcard(req, res, next) {
  try {
    const result = await kitService.deleteFlashcard(req.session.userId, req.params.id, req.params.fid);
    if (!result.ok) return res.status(404).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

// ─── Brief Endpoints ──────────────────────────────────────────────────────────

export async function patchBrief(req, res, next) {
  try {
    const validated = EditBriefRequestSchema.parse(req.body);
    const result = await kitService.patchBrief(req.session.userId, req.params.id, validated);
    if (!result.ok) return res.status(400).json(result.error);
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}
