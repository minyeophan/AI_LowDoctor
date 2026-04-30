import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../schemas/user_db.js";
import { randomUUID } from "crypto";
import { signAccessToken } from "../service/auth_service.js";

const googleOAuthConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REDIRECT_URI;

if (googleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          let user = await User.findOne({ providerId: profile.id });

          if (!user && email) {
            user = await User.findOne({ email });
          }

          if (!user) {
            user = await User.create({
              userID: `user_${randomUUID()}`,
              name: profile.displayName || profile.username || "Google User",
              email,
              password: undefined,
              provider: "google",
              providerId: profile.id,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken || null,
              googleTokenExpiry: refreshToken
                ? new Date(Date.now() + 3600000)
                : null,
            });
          } else {
            user.provider = "google";
            user.providerId = profile.id;
            user.googleAccessToken = accessToken;
            if (refreshToken) {
              user.googleRefreshToken = refreshToken;
            }
            user.googleTokenExpiry = new Date(Date.now() + 3600000);
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

const requireGoogleOAuthConfig = (req, res) =>
  res.status(503).json({ message: "Google OAuth env vars are not configured." });

export const googleAuth = googleOAuthConfigured
  ? passport.authenticate("google", {
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
      accessType: "offline",
      prompt: "consent",
    })
  : requireGoogleOAuthConfig;

export const googleAuthCallback = googleOAuthConfigured
  ? passport.authenticate("google", {
      failureRedirect: "/api/auth/login",
      session: false,
    })
  : requireGoogleOAuthConfig;

export const googleAuthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect("/api/auth/login");
  }

  const token = signAccessToken(req.user);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return res.redirect(`${clientUrl}/auth/google/success?token=${token}`);
};
