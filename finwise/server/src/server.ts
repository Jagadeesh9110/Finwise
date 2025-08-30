import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database";
import authRoutes from "./routes/authRoutes";

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
// This allows your frontend (on localhost:5173) to communicate with the backend (on localhost:3000)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from the FinWise Server!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
