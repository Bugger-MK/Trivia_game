import passport from "../config/passport.js";
import * as authService from "../services/authService.js";
import * as userModel from "../models/userModel.js";
import { signToken } from "../utils/jwt.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  const { passwordHash, __v, ...safe } = obj;
  return safe;
}

export async function signup(req, res) {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password, and displayName are required" });
  }
  try {
    const user = await authService.signup({ email, password, displayName });
    const token = signToken({ sub: user.id });
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

export function login(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
    const token = signToken({ sub: user.id });
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ user: sanitizeUser(user) });
  })(req, res, next);
}

export function logout(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ success: true });
}

export async function me(req, res) {
  const user = await userModel.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: sanitizeUser(user) });
}

// Called after passport's Google strategy succeeds (req.user is set)
export function googleCallback(req, res) {
  const token = signToken({ sub: req.user.id });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
}
