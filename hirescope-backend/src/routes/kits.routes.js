/**
 * HireScope — Kits Routes
 */

import { Router } from "express";
import {
  createKit,
  listKits,
  getKit,
  deleteKit,
  getProgress,
  regenerateSection,
  patchQuestion,
  addQuestion,
  deleteQuestion,
  togglePinQuestion,
  reorderQuestions,
  patchFlashcard,
  addFlashcard,
  deleteFlashcard,
  patchBrief
} from "../controllers/kit.controller.js";
import {
  startSession,
  recordCardAnswer,
  getWeakSpotsReport
} from "../controllers/practice.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { kitGenLimiter } from "../middleware/rate-limit.js";

const router = Router();

// All kit routes require authentication
router.use(requireAuth);

router.get("/", listKits);
router.post("/", kitGenLimiter, createKit);
router.get("/:id", getKit);
router.delete("/:id", deleteKit);
router.get("/:id/progress", getProgress);
router.post("/:id/regenerate", regenerateSection);

// Question operations
router.patch("/:id/questions/reorder", reorderQuestions);
router.post("/:id/questions", addQuestion);
router.patch("/:id/questions/:qid", patchQuestion);
router.delete("/:id/questions/:qid", deleteQuestion);
router.post("/:id/questions/:qid/pin", togglePinQuestion);

// Flashcard operations
router.post("/:id/flashcards", addFlashcard);
router.patch("/:id/flashcards/:fid", patchFlashcard);
router.delete("/:id/flashcards/:fid", deleteFlashcard);

// Brief operations
router.patch("/:id/brief", patchBrief);

// Practice & Weak Spots operations
router.post("/:id/practice/sessions", startSession);
router.patch("/:id/practice/sessions/:sid", recordCardAnswer);
router.get("/:id/practice/weak-spots", getWeakSpotsReport);

export default router;
