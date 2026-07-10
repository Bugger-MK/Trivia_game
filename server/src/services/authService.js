import bcrypt from "bcrypt";
import * as userModel from "../models/userModel.js";

const SALT_ROUNDS = 10;

export async function signup({ email, password, displayName }) {
  const existing = await userModel.findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser({ email, passwordHash, displayName });
  return user;
}

export async function login({ email, password }) {
  const user = await userModel.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  return user;
}

// Called from the Google OAuth strategy. Matches an existing linked account,
// or an existing account by email (so signing in with Google links to an
// account originally created with a password), or creates a brand new user.
export async function findOrCreateGoogleUser({ googleId, email, displayName }) {
  const existingLink = await userModel.findUserByProvider("google", googleId);
  if (existingLink) return existingLink;

  let user = await userModel.findUserByEmail(email);
  if (!user) {
    user = await userModel.createUser({ email, passwordHash: null, displayName });
  }
  await userModel.linkAuthProvider({ userId: user.id, provider: "google", providerUserId: googleId });
  return user;
}
