import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy } from "passport-jwt";
import UserModel, { IUser } from "../models/userModel";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if a user with this Google ID already exists in our database.
        let user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
          // 2. If the user exists, we're done. Pass the user to the next step.
          return done(null, user);
        } else {
          // 3. If the user does not exist, create a new user in our database.
          const newUser = await UserModel.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0].value,
            photoURL: profile.photos?.[0].value,
          });
          return done(null, newUser);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: (req) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies["jwt"];
        }
        return token;
      },
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (jwt_payload, done) => {
      try {
        const user = await UserModel.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
