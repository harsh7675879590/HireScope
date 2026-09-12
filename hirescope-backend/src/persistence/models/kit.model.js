/**
 * HireScope — Kit Model (Section D)
 *
 * Stores the full kit with generation state, input, meta, and Appendix A structure.
 * Compound indexes for deduplication and dashboard listing.
 */

import { Schema, model } from "mongoose";

const generationLogEntrySchema = new Schema(
  {
    stage: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "skipped"],
      required: true,
    },
    startedAt: Date,
    finishedAt: Date,
    error: String,
  },
  { _id: false }
);

const kitSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "generating", "ready", "failed"],
      default: "draft",
      required: true,
    },
    input: {
      jd: { type: String, required: true },
      company_url: { type: String, required: true },
      days: { type: Number, required: true },
    },
    kit: {
      type: Schema.Types.Mixed,
      default: null,
    },
    meta: {
      generationLog: { type: [generationLogEntrySchema], default: [] },
      stateVersion: { type: Number, default: 0 },
      dedupeKey: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for duplicate-submission detection per user
kitSchema.index({ userId: 1, "meta.dedupeKey": 1 });
// Index for dashboard listing sorted by most recent
kitSchema.index({ userId: 1, updatedAt: -1 });

export const KitModel = model("Kit", kitSchema);
