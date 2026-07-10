// Seeds the database from Open Trivia DB (https://opentdb.com).
// Run with: npm run seed  (from the server/ directory)
//
// What it does:
// 1. Fetches all categories from Open Trivia DB, upserts them into the
//    `categories` collection with source = 'api' and externalId set to
//    OTDB's category id (so this script can be safely re-run later).
// 2. For each category, fetches a batch of questions and upserts them into
//    the `questions` collection with source = 'api'.
//
// Open Trivia DB rate-limits to 1 request per 5 seconds per IP, so we wait
// between category requests rather than firing them all in parallel.

import axios from "axios";
import he from "he";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/db/connection.js";
import { Category } from "../src/models/Category.js";
import { Question } from "../src/models/Question.js";

dotenv.config();

const BASE_URL = process.env.OPEN_TRIVIA_DB_BASE_URL || "https://opentdb.com";
const QUESTIONS_PER_CATEGORY = 50;
const DELAY_MS = 5500; // stay safely above OTDB's 5s rate limit window

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCategories() {
  const { data } = await axios.get(`${BASE_URL}/api_category.php`);
  return data.trivia_categories; // [{ id, name }]
}

async function fetchQuestionsForCategory(externalId) {
  const { data } = await axios.get(`${BASE_URL}/api.php`, {
    params: { amount: QUESTIONS_PER_CATEGORY, category: externalId },
  });
  // response_code: 0 = success, 1 = no results for that category/amount combo
  if (data.response_code !== 0) return [];
  return data.results;
}

async function upsertCategory(name, externalId) {
  const category = await Category.findOneAndUpdate(
    { name },
    { name, source: "api", externalId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return category._id;
}

async function upsertQuestion(categoryId, q) {
  const questionText = he.decode(q.question);
  const correctAnswer = he.decode(q.correct_answer);
  const incorrectAnswers = q.incorrect_answers.map((a) => he.decode(a));

  // Avoid duplicate inserts on re-run: skip if this exact question text
  // already exists for this category.
  const existing = await Question.findOne({ categoryId, questionText });
  if (existing) return;

  await Question.create({
    categoryId,
    questionText,
    difficulty: q.difficulty,
    correctAnswer,
    incorrectAnswers,
    source: "api",
  });
}

async function run() {
  await connectDB();

  console.log("Fetching category list from Open Trivia DB...");
  const categories = await fetchCategories();
  console.log(`Found ${categories.length} categories.`);

  for (const [index, cat] of categories.entries()) {
    console.log(`\n[${index + 1}/${categories.length}] ${cat.name}`);

    const categoryId = await upsertCategory(cat.name, cat.id);

    const questions = await fetchQuestionsForCategory(cat.id);
    console.log(`  fetched ${questions.length} questions`);

    for (const q of questions) {
      await upsertQuestion(categoryId, q);
    }

    // Respect OTDB's rate limit before the next category request
    if (index < categories.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\nSeeding complete.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Seed script failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
