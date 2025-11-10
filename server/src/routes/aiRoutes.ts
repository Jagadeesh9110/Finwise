import { Router } from "express";
import passport from "passport";
import {
  processAICommand,
  processWhatIfScenario,
  getFinancialProfile,
  updateFinancialProfile,
  getAgentOutputs
} from "../controllers/aiController";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// AI processing routes
router.post("/process-command", processAICommand);
router.post("/scenarios/what-if", processWhatIfScenario);

// Financial profile routes
router.get("/financial-profiles/:userId", getFinancialProfile);
router.put("/financial-profiles/:userId", updateFinancialProfile);

// Agent outputs
router.get("/agent-outputs/:userId", getAgentOutputs);

export default router;