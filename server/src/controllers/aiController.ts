import { Request, Response } from "express";
import axios from "axios";
import FinancialProfileModel from "../models/financialProfileModel";
import AgentOutputModel from "../models/agentOutputModel";
import { IUserDocument } from "../models/userModel";
import { v4 as uuidv4 } from "uuid";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8001";

export const processAICommand = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    const { command } = req.body;

    // Get user's financial profile
    let profile = await FinancialProfileModel.findOne({ userId: user._id });
    
    // If no profile exists, create a sample one
    if (!profile) {
      profile = await FinancialProfileModel.create({
        userId: user._id,
        age: 30,
        annual_income: 75000,
        monthly_expenses: 3500,
        savings: 10000,
        goals: [
          { name: "Emergency Fund", target: 15000, current: 5000, deadline: "2024-12-31", priority: 1 },
          { name: "House Down Payment", target: 50000, current: 10000, deadline: "2026-06-30", priority: 2 }
        ],
        debts: [
          { name: "Student Loan", balance: 25000, interest_rate: 4.5, minimum_payment: 300, type: "student" },
          { name: "Credit Card", balance: 5000, interest_rate: 18.9, minimum_payment: 150, type: "credit_card" }
        ],
        transactions: [
          { amount: 5000, category: "Salary", description: "Monthly salary", date: new Date(), type: "income" },
          { amount: -1500, category: "Rent", description: "Monthly rent", date: new Date(), type: "expense" }
        ],
        risk_tolerance: "moderate",
        investment_experience: "beginner"
      });
    }

    // Prepare request for Python AI service
    const aiRequest = {
      user_input: command,
      user_profile: {
        age: profile.age,
        annual_income: profile.annual_income,
        monthly_expenses: profile.monthly_expenses,
        savings: profile.savings,
        debts: profile.debts,
        financial_goals: profile.goals.map(g => ({
          name: g.name,
          target: g.target,
          timeline_months: 12, // Calculate based on deadline
          priority: g.priority
        })),
        risk_tolerance: profile.risk_tolerance,
        investment_experience: profile.investment_experience,
        time_horizon: 10,
        transactions: profile.transactions.map(t => ({
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date.toISOString().split('T')[0]
        }))
      }
    };

    // Call Python AI service
    const response = await axios.post(`${PYTHON_API_URL}/api/agents/process`, aiRequest);
    
    // Save AI output to database
    const sessionId = uuidv4();
    await AgentOutputModel.create({
      userId: user._id,
      sessionId,
      userInput: command,
      agentType: "master",
      outputData: response.data,
      analysis_type: response.data.analysis_type,
      agents_involved: response.data.agents_involved,
      priority: "medium",
      actionable: true
    });

    res.json({
      success: true,
      response: response.data.final_output,
      analysis_type: response.data.analysis_type,
      agents_involved: response.data.agents_involved
    });

  } catch (error: any) {
    console.error("AI processing error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to process AI command",
      error: error.response?.data || error.message
    });
  }
};

export const processWhatIfScenario = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    const { parameters } = req.body;

    // Get user's financial profile
    const profile = await FinancialProfileModel.findOne({ userId: user._id });
    
    if (!profile) {
      return res.status(404).json({ message: "Financial profile not found" });
    }

    // Prepare scenario request
    const scenarioRequest = {
      user_profile: {
        age: profile.age,
        annual_income: profile.annual_income,
        monthly_expenses: profile.monthly_expenses,
        savings: profile.savings,
        debts: profile.debts,
        financial_goals: profile.goals.map(g => ({
          name: g.name,
          target: g.target,
          timeline_months: 12,
          priority: g.priority
        })),
        risk_tolerance: profile.risk_tolerance,
        investment_experience: profile.investment_experience,
        time_horizon: 10,
        transactions: []
      },
      scenario_type: parameters.type || "expense",
      amount: parameters.expense || parameters.income || 0,
      description: parameters.description || ""
    };

    // Call Python AI service
    const response = await axios.post(`${PYTHON_API_URL}/api/agents/what-if-scenario`, scenarioRequest);
    
    res.json(response.data);

  } catch (error: any) {
    console.error("Scenario processing error:", error);
    res.status(500).json({ 
      message: "Failed to process scenario",
      error: error.message 
    });
  }
};

export const getFinancialProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    
    let profile = await FinancialProfileModel.findOne({ userId: user._id });
    
    if (!profile) {
      // Create default profile
      profile = await FinancialProfileModel.create({
        userId: user._id,
        age: 30,
        annual_income: 0,
        monthly_expenses: 0,
        savings: 0,
        goals: [],
        debts: [],
        transactions: [],
        risk_tolerance: "moderate",
        investment_experience: "beginner"
      });
    }

    res.json(profile);

  } catch (error: any) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch financial profile" });
  }
};

export const updateFinancialProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    
    const profile = await FinancialProfileModel.findOneAndUpdate(
      { userId: user._id },
      req.body,
      { new: true, upsert: true }
    );

    res.json(profile);

  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update financial profile" });
  }
};

export const getAgentOutputs = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    
    const outputs = await AgentOutputModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Transform outputs for frontend
    const insights = outputs.map(output => {
      // Handle different outputData structures
      let title = "Financial Analysis";
      let description = "Analysis completed";
      let action = undefined;

      if (output.outputData) {
        // Check if outputData has direct title/description
        if (typeof output.outputData === 'object') {
          title = output.outputData.title || output.userInput?.substring(0, 50) || title;
          description = output.outputData.description || 
                       output.outputData.final_output?.substring(0, 200) || 
                       description;
          action = output.outputData.action;
        }
      }

      return {
        id: output._id.toString(),
        agentType: output.agentType,
        priority: output.priority || "medium",
        actionable: output.actionable || false,
        outputData: {
          title,
          description,
          action: output.actionable ? (action || "review") : undefined
        }
      };
    });

    res.json(insights);

  } catch (error: any) {
    console.error("Error fetching outputs:", error);
    res.status(500).json({ message: "Failed to fetch agent outputs" });
  }
};