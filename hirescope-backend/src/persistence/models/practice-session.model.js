/**
 * HireScope — Practice Session Model (Section D)
 * { _id, userId, kitId, startedAt, finishedAt, cardResults[] }
 */

import { Schema, model } from "mongoose";

const cardResultSchema = new Schema(
  {
    flashcardId: { type: String, required: true },
    confidence: { type: Number, required: true, min: 1, max: 5 },
    answeredAt: { type: Date, required: true },
  },
  { _id: false }
);

const practiceSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  kitId: { type: Schema.Types.ObjectId, ref: "Kit", required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
  cardResults: { type: [cardResultSchema], default: [] },
});

export const PracticeSessionModel = model("PracticeSession", practiceSessionSchema);
