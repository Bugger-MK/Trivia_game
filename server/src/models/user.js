import mongoose from "mongoose";

const authProviderSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true }, // e.g. 'google'
    providerUserId: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null }, // null for OAuth-only users
  displayName: { type: String, required: true },
  authProviders: { type: [authProviderSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Enforces one user per (provider, providerUserId) pair across the whole collection.
userSchema.index(
  { "authProviders.provider": 1, "authProviders.providerUserId": 1 },
  { unique: true }
);

export const User = mongoose.model("User", userSchema);
