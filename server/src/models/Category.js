import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  source: { type: String, enum: ["api", "custom"], default: "api" },
  externalId: { type: Number, default: null }, // Open Trivia DB category id, for re-syncing
});

export const Category = mongoose.model("Category", categorySchema);
