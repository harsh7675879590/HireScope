/**
 * HireScope — Practice Record Model (Section D)
 * Denormalized per-card rolling state for fast weak-spot queries.
 * Compound unique index: { kitId, flashcardId, userId }
 */

import { Schema, model } from "mongoose";

const practiceRecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  kitId: { type: Schema.Types.ObjectId, ref: "Kit", required: true },
  flashcardId: { type: String, required: true },
  lastConfidence: { type: Number, required: true, min: 1, max: 5 },
  attempts: { type: Number, required: true, default: 0 },
  avgConfidence: { type: Number, required: true, default: 0 },
  lastSeenAt: { type: Date, required: true },
});

practiceRecordSchema.index(
  { kitId: 1, flashcardId: 1, userId: 1 },
  { unique: true }
);

export const PracticeRecordModel = model("PracticeRecord", practiceRecordSchema);
