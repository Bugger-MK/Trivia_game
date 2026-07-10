import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  questionText: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  correctAnswer: { type: String, required: true },
  incorrectAnswers: { type: [String], required: true },
  source: { type: String, enum: ["api", "custom"], default: "api" },
  createdAt: { type: Date, default: Date.now },
});

questionSchema.index({ categoryId: 1 });

export const Question = mongoose.model("Question", questionSchema);
