/**
 * HireScope — API Contract Definitions
 *
 * Zod schemas for request validation on all REST endpoints (Section E).
 * These validate incoming request bodies at runtime.
 */

import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// ─── Kit Creation ──────────────────────────────────────────────────────────────

export const CreateKitRequestSchema = z.object({
  jd: z.string().min(1, "Job description is required"),
  company_url: z.string().url("Must be a valid URL"),
  days: z.number().int().min(1).max(90),
});

// ─── Regeneration ──────────────────────────────────────────────────────────────

export const RegenerateSectionSchema = z.enum([
  "brief",
  "role",
  "questions:technical",
  "questions:behavioural",
  "questions:system-design",
  "questions:company-fit",
  "flashcards",
  "schedule",
]);

export const RegenerateRequestSchema = z.object({
  section: RegenerateSectionSchema,
  forceOverwrite: z.boolean().optional(),
  stateVersion: z.number().int(),
});

// ─── Question CRUD ─────────────────────────────────────────────────────────────

export const UpdateQuestionRequestSchema = z.object({
  question: z.string().min(1).optional(),
  why_relevant: z.string().optional(),
  difficulty: z.number().int().min(1).max(3).optional(),
  estimated_minutes: z.number().int().min(1).optional(),
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]).optional(),
  stateVersion: z.number().int(),
});

export const CreateQuestionRequestSchema = z.object({
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]),
  question: z.string().min(1),
  why_relevant: z.string(),
  difficulty: z.number().int().min(1).max(3),
  estimated_minutes: z.number().int().min(1),
  requirement_ids: z.array(z.string()),
  stateVersion: z.number().int(),
});

export const ReorderQuestionsRequestSchema = z.object({
  orderedIds: z.array(z.string()),
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]).optional(),
  stateVersion: z.number().int(),
});

// ─── Flashcard CRUD ────────────────────────────────────────────────────────────

export const UpdateFlashcardRequestSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  stateVersion: z.number().int(),
});

export const CreateFlashcardRequestSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  stateVersion: z.number().int(),
});

// ─── Brief ─────────────────────────────────────────────────────────────────────

export const UpdateBriefRequestSchema = z.object({
  overview: z.string().optional(),
  culture: z.string().optional(),
  recent_news: z.string().optional(),
  interview_process: z.string().optional(),
  stateVersion: z.number().int(),
});

// ─── Practice ──────────────────────────────────────────────────────────────────

export const RecordAnswerRequestSchema = z.object({
  flashcardId: z.string(),
  confidence: z.number().int().min(1).max(5),
});
