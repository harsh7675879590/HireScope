/**
 * HireScope — Practice Controller
 */

import { practiceService } from "../services/practice.service.js";
import { RecordAnswerRequestSchema } from "../shared/types/api-contracts.js";

export async function startSession(req, res, next) {
  try {
    const result = await practiceService.startSession(req.session.userId, req.params.id);
    if (!result.ok) {
      return res.status(400).json(result.error);
    }
    return res.status(201).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function recordCardAnswer(req, res, next) {
  try {
    const validated = RecordAnswerRequestSchema.parse(req.body);
    const result = await practiceService.recordCardResult(
      req.session.userId,
      req.params.sid,
      validated.flashcardId,
      validated.confidence
    );

    if (!result.ok) {
      return res.status(404).json(result.error);
    }

    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function getWeakSpotsReport(req, res, next) {
  try {
    const result = await practiceService.getWeakSpots(req.session.userId, req.params.id);
    if (!result.ok) {
      return res.status(404).json(result.error);
    }
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}
