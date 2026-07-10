import { User } from "./User.js";

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export async function findUserById(id) {
  return User.findById(id);
}

export async function createUser({ email, passwordHash, displayName }) {
  return User.create({ email, passwordHash, displayName });
}

export async function linkAuthProvider({ userId, provider, providerUserId }) {
  const user = await User.findById(userId);
  if (!user) return null;

  const alreadyLinked = user.authProviders.some(
    (p) => p.provider === provider && p.providerUserId === providerUserId
  );
  if (!alreadyLinked) {
    user.authProviders.push({ provider, providerUserId });
    await user.save();
  }
  return user;
}

export async function findUserByProvider(provider, providerUserId) {
  return User.findOne({
    authProviders: { $elemMatch: { provider, providerUserId } },
  });
}
