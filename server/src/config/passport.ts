import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import UserModel from "../models/userModel";

export const configurePassport = () => {
  console.log("🔧 Configuring Passport strategies...");
  
  console.log("JWT_SECRET available:", !!process.env.JWT_SECRET);
  console.log("GOOGLE_CLIENT_ID available:", !!process.env.GOOGLE_CLIENT_ID);
  
  if (!process.env.JWT_SECRET) {
    throw new Error(" JWT_SECRET environment variable is required");
  }
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(" Google OAuth credentials not found, Google authentication will not work");
  }

  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: (req) => {
          let token = null;
          if (req && req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
          }
          return token;
        },
        secretOrKey: process.env.JWT_SECRET,
      },
      async (jwtPayload, done) => {
        try {
          const user = await UserModel.findById(jwtPayload.id);
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          console.error("JWT Strategy error:", error);
          return done(error, false);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await UserModel.findOne({ googleId: profile.id });
            
            if (user) {
              return done(null, user);
            }

            user = await UserModel.findOne({ email: profile.emails?.[0]?.value });
            
            if (user) {
              user.googleId = profile.id;
              user.photoURL = profile.photos?.[0]?.value;
              user.isEmailVerified = true;
              await user.save();
              return done(null, user);
            }

            user = await UserModel.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              photoURL: profile.photos?.[0]?.value,
              authProvider: "google",
              isEmailVerified: true,
            });

            return done(null, user);
          } catch (error) {
            console.error("Google Strategy error:", error);
            return done(error, false);
          }
        }
      )
    );
  }

  console.log("✅ Passport strategies configured successfully");
};

export default passport;