import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import * as userModel from "../models/userModel.js";
import * as authService from "../services/authService.js";

// Local strategy: used by the /auth/login route
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await userModel.findUserByEmail(email);
      if (!user || !user.passwordHash) {
        return done(null, false, { message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return done(null, false, { message: "Invalid email or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Google strategy: used by /auth/google and /auth/google/callback.
// Only registered if credentials are present, so the server can still boot
// for local email/password testing before Google OAuth is configured.
export const isGoogleAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL
);

if (isGoogleAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || email;
          const user = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            displayName,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth is not configured (missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL) — /auth/google routes will return an error until it is."
  );
}

// We're stateless (JWT-based), so no session serialization is needed.
// passport.authenticate(..., { session: false }) is used on every route.

export default passport;
