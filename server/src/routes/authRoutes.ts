import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  verifyEmail,
  getGoogleCallback,
   resendVerification,
  getProfile,
  logout,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerification);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    session: false,
  }),
  getGoogleCallback
);

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  getProfile
);

router.post("/logout", logout);

export default router;
