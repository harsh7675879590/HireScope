/**
 * HireScope — User Model (Section D)
 * { _id, email (unique idx), passwordHash, createdAt }
 */

import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const UserModel = model("User", userSchema);
