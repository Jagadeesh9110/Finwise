import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import UserModel, { IUserDocument } from "../models/userModel";
import { sendEmail } from "../utils/sendEmail";

// Helper function to generate and set the JWT cookie
const generateAndSetToken = (res: Response, userId: string) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

// --- Register a new user ---
export const register = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const newUser = await UserModel.create({ name, email, password, phoneNumber, authProvider: "email" });

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    newUser.emailVerificationToken = verificationToken;
    newUser.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();

    await sendEmail({
      to: email,
      subject: "Your Finwise Email Verification Code",
      text: `Your verification code is: ${verificationToken}`,
      html: `<p>Your verification code is: <strong>${verificationToken}</strong></p>`,
    });

    res.status(201).json({ message: "Registration successful. Please check your email for a verification code." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// --- Verify User's Email with OTP ---
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await UserModel.findOne({
      email,
      emailVerificationToken: otp,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();
    generateAndSetToken(res, user._id.toString());
    res.status(200).json({ id: user._id.toString(), name: user.name, email: user.email, photoURL: user.photoURL });
  } catch (error) {
    res.status(500).json({ message: "Server error during email verification." });
  }
};

// --- Resend the Verification OTP ---
export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ 
      email,
      authProvider: "email",
      isEmailVerified: false 
    });

    if (!user) {
      return res.status(400).json({ message: "User not found or has already been verified." });
    }

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your New Finwise Verification Code",
      text: `Your new verification code is: ${verificationToken}`,
      html: `<p>Your new verification code is: <strong>${verificationToken}</strong></p>`,
    });

    res.status(200).json({ message: "Verification code resent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while resending code." });
  }
};

// --- Login with Email & Password ---
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email, authProvider: 'email' }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email first." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    generateAndSetToken(res, user._id.toString());
    res.status(200).json({ id: user._id.toString(), name: user.name, email: user.email, photoURL: user.photoURL });
  } catch (error) {
    res.status(500).json({ message: "Server error during login." });
  }
};

// --- Google OAuth Callback ---
export const getGoogleCallback = (req: Request, res: Response) => {
  const user = req.user as IUserDocument; 
  generateAndSetToken(res, user._id.toString());
  res.redirect("http://localhost:5173/dashboard");
};

// --- Get Current User's Profile ---
export const getProfile = (req: Request, res: Response) => {
  const user = req.user as IUserDocument;
  res.json({ id: user._id.toString(), name: user.name, email: user.email, photoURL: user.photoURL });
};

// --- Logout ---
export const logout = (req: Request, res: Response) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logged out successfully" });
};

