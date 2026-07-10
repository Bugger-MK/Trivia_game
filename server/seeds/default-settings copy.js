// Seeds the default admin-configurable settings.
// Run with: npm run seed:settings  (from the server/ directory)
// Safe to re-run — uses upsert so it won't overwrite values you've already changed.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/db/connection.js";
import { AppSetting } from "../src/models/AppSetting.js";

dotenv.config();

const DEFAULTS = [
  { key: "questions_per_round", value: "3" },
  { key: "timer_enabled", value: "false" },
  { key: "timer_seconds", value: "30" },
];

async function run() {
  await connectDB();

  for (const setting of DEFAULTS) {
    const existing = await AppSetting.findOne({ key: setting.key });
    if (existing) {
      console.log(`Skipping "${setting.key}" — already set to "${existing.value}"`);
      continue;
    }
    await AppSetting.create(setting);
    console.log(`Set "${setting.key}" = "${setting.value}"`);
  }

  console.log("Default settings seeded.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Failed to seed settings:", err);
  await mongoose.disconnect();
  process.exit(1);
});
