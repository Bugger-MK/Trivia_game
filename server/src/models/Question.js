import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  mode: { type: String, default: "standard" }, // room for future game modes
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  questionIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Question", default: [] }, // ordered — determines what "next question" means
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  answers: { type: [answerSchema], default: [] },
});

quizSessionSchema.index({ userId: 1 });
quizSessionSchema.index({ completedAt: 1 });

export const QuizSession = mongoose.model("QuizSession", quizSessionSchema);