import { Router } from "express";
import passport from "passport";
import {
  getGoogleCallback,
  getProfile,
  logout,
} from "../controllers/authController";

const router = Router();

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

router.get("/profile", getProfile);

router.post("/logout", logout);

export default router;
