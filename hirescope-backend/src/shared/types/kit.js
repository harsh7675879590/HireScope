/**
 * HireScope — Shared Kit Types (Zod Schemas)
 *
 * Canonical Zod schemas for the Kit data structure (Appendix A shape).
 * These provide runtime validation AND serve as the single source of truth
 * for data shapes across the entire app. No TypeScript needed — Zod validates at runtime.
 */

import { z } from "zod";

// ─── Requirement ───────────────────────────────────────────────────────────────

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  priority: z.enum(["must", "nice"]),
  kind: z.enum(["technical", "behavioural", "system-design", "company-fit", "general"]),
});

// ─── Question ──────────────────────────────────────────────────────────────────

export const QuestionStateSchema = z.object({
  origin: z.enum(["generated", "manual"]),
  edited: z.boolean(),
  pinned: z.boolean(),
  deleted: z.boolean(),
  generationBatch: z.number().int(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]),
  question: z.string().min(1),
  why_relevant: z.string(),
  difficulty: z.number().int().min(1).max(3),
  estimated_minutes: z.number().int().min(1),
  requirement_ids: z.array(z.string()),
  _state: QuestionStateSchema.optional(),
});

// ─── Flashcard ─────────────────────────────────────────────────────────────────

export const FlashcardStateSchema = QuestionStateSchema;

export const FlashcardSchema = z.object({
  id: z.string(),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  _state: FlashcardStateSchema.optional(),
});

// ─── Schedule ──────────────────────────────────────────────────────────────────

export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().min(0),
});

// ─── Company Brief ─────────────────────────────────────────────────────────────

export const CompanyBriefSchema = z.object({
  company_name: z.string(),
  overview: z.string(),
  culture: z.string(),
  recent_news: z.string(),
  interview_process: z.string(),
  hiring_page_url: z.string().nullable(),
  sources: z.array(z.string()),
});

// ─── Coverage Result ───────────────────────────────────────────────────────────

export const CoverageResultSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int(),
});

// ─── Full Kit ──────────────────────────────────────────────────────────────────

export const KitSchema = z.object({
  role: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
  company_brief: CompanyBriefSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: z.array(ScheduleDaySchema),
  coverage: CoverageResultSchema,
});

// ─── Kit Status ────────────────────────────────────────────────────────────────

export const KitStatusSchema = z.enum(["draft", "generating", "ready", "failed"]);

// ─── Kit Input ─────────────────────────────────────────────────────────────────

export const KitInputSchema = z.object({
  jd: z.string().min(1, "Job description is required"),
  company_url: z.string().url("Must be a valid URL"),
  days: z.number().int().min(1, "Must be at least 1 day").max(90, "Maximum 90 days"),
});

// ─── Generation Log Entry ──────────────────────────────────────────────────────

export const GenerationLogEntrySchema = z.object({
  stage: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

// ─── Kit Meta ──────────────────────────────────────────────────────────────────

export const KitMetaSchema = z.object({
  generationLog: z.array(GenerationLogEntrySchema),
  stateVersion: z.number().int().min(0),
  dedupeKey: z.string(),
});
