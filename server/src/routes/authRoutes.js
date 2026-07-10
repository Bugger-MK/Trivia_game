import { Router } from "express";
import passport, { isGoogleAuthConfigured } from "../config/passport.js";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

function requireGoogleConfigured(req, res, next) {
  if (!isGoogleAuthConfigured) {
    return res.status(503).json({
      error: "Google OAuth is not configured on this server yet.",
    });
  }
  next();
}

router.get(
  "/google",
  requireGoogleConfigured,
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  requireGoogleConfigured,
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback
);

export default router;
