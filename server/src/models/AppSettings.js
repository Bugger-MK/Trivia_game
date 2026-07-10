import mongoose from "mongoose";

const appSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const AppSetting = mongoose.model("AppSetting", appSettingSchema);
