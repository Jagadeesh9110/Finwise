import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport"; 

dotenv.config();

// console.log("Environment:", process.env.NODE_ENV);
// console.log("JWT Secret:", process.env.JWT_SECRET ? "Available" : "Not Available");
// console.log("Mongo URI:", process.env.MONGO_URI ? "Available" : "Not Available");
// console.log("Email User:", process.env.EMAIL_USER ? "Available" : "Not Available");
// console.log("Email Password:", process.env.EMAIL_PASSWORD ? "Available" : "Not Available");
// console.log("Email From:", process.env.EMAIL_FROM ? "Available" : "Not Available");
// console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID ? "Available" : "Not Available");
// console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "Available" : "Not Available");


import { connectDB } from "./config/database";
import authRoutes from "./routes/authRoutes";
import { configurePassport } from "./config/passport";

configurePassport();

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/auth", authRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from the FinWise Server!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});