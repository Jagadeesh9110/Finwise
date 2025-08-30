import { Request, Response } from "express";
import jwt from "jsonwebtoken";

// This is a placeholder for your user model
// import User from '../models/user.model';

export const getGoogleCallback = (req: Request, res: Response) => {
  const userProfile: any = req.user;

  const user = {
    id: userProfile?.id || "12345",
    name: userProfile?.displayName || "Test User",
    email: userProfile?.emails?.[0]?.value || "test@example.com",
    photoURL: userProfile?.photos?.[0]?.value || "",
  };

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.redirect("http://localhost:5173/dashboard");
};

export const getProfile = (req: Request, res: Response) => {
  res.json({
    id: "12345",
    name: "Test User",
    email: "test@example.com",
    photoURL: "",
  });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logged out successfully" });
};
