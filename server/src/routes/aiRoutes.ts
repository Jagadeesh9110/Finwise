import { Router } from "express";
import passport from "passport";
import {
  processAICommand,
  processWhatIfScenario,
  getFinancialProfile,
  updateFinancialProfile,
  getAgentOutputs,
  getAgentOutputById,
  addInvestment
} from "../controllers/aiController";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// AI processing routes
router.post("/process-command", processAICommand);
router.post("/scenarios/what-if", processWhatIfScenario);

router.post("/financial-profiles/investments", addInvestment);
// Financial profile routes
router.get("/financial-profiles/:userId", getFinancialProfile);
router.put("/financial-profiles/:userId", updateFinancialProfile);

// Agent outputs
router.get("/agent-outputs/:id", getAgentOutputById);
router.get("/agent-outputs/user/:userId", getAgentOutputs);

export default router;