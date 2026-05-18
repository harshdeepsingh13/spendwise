import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import { User } from "../models/User.model.js";
import { env } from "./env.js";

const GoogleOAuth2Strategy = GoogleStrategy.Strategy;

passport.use(
  new GoogleOAuth2Strategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Find by googleId first
        let user = await User.findOne({ googleId: profile.id });

        if (!user && email) {
          const existing = await User.findOne({ email });
          if (existing) {
            if (!existing.googleId) {
              // Local account exists — block silent hijack
              return done(null, false, {
                message: 'An account with this email already exists. Please sign in with your password.',
              });
            }
            user = existing;
          }
        }

        if (user) {
          // Update existing Google-linked user
          user.googleId = user.googleId || profile.id;
          user.displayName = user.displayName || profile.displayName;
          user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            email,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    },
  ),
);

export default passport;

