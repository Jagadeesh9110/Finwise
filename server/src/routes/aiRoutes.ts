// server/src/routes/aiRoutes.ts
import { Router } from "express";
import axios from "axios";
import passport from "passport";

const router = Router();
const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5001";

// Process AI query
router.post(
  "/process-query",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { query, context } = req.body;
      const userId = (req.user as any)._id.toString();

      const response = await axios.post(`${FLASK_API_URL}/api/process-query`, {
        user_id: userId,
        query,
        context
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error calling Flask AI service:", error);
      res.status(500).json({ error: "AI service error" });
    }
  }
);

// Add transactions
router.post(
  "/add-transactions",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { transactions } = req.body;
      const userId = (req.user as any)._id.toString();

      const response = await axios.post(`${FLASK_API_URL}/api/add-transaction`, {
        user_id: userId,
        transactions
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error adding transactions:", error);
      res.status(500).json({ error: "Failed to add transactions" });
    }
  }
);

export default router;