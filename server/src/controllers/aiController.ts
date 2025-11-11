import { Request, Response } from "express";
import axios from "axios";
import FinancialProfileModel, { ITransaction } from "../models/financialProfileModel";
import AgentOutputModel from "../models/agentOutputModel";
import { IUserDocument } from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

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
    
    const aiResponse = response.data;
    
    //  Extract and store complete agent output 
    const sessionId = uuidv4();
    
    // Determine priority from response or calculate
    const priority = aiResponse.priority || 
                     aiResponse.detailed_analysis?.priority || 
                     'medium';
    
    // Determine if actionable
    const actionable = !!(aiResponse.actionType ||
                          aiResponse.detailed_analysis?.actionType ||
                          aiResponse.insights?.length > 0);
    
    // Create main agent output (the comprehensive plan)
    const mainOutput = await AgentOutputModel.create({
      userId: user._id,
      sessionId,
      userInput: command,
      agentType: aiResponse.agent || "master",
      outputData: {
        response: aiResponse.final_output,
        title: "Financial Analysis",
        description: aiResponse.final_output?.substring(0, 200) || "Analysis complete",
        actionType: aiResponse.actionType || "review",
        agent: aiResponse.agent || "master",
        insights: aiResponse.insights || []
      },
      analysis_type: aiResponse.analysis_type || "comprehensive",
      agents_involved: aiResponse.agents_involved || ["master"],
      priority,
      actionable
    });

    // Store individual insights as separate outputs
    if (aiResponse.insights && Array.isArray(aiResponse.insights)) {
      for (const insight of aiResponse.insights) {
        await AgentOutputModel.create({
          userId: user._id,
          sessionId,
          userInput: command,
          agentType: insight.agent || "unknown",
          outputData: {
            title: insight.title,
            description: insight.description,
            actionType: insight.actionType,
            agent: insight.agent
          },
          analysis_type: aiResponse.analysis_type || "comprehensive",
          agents_involved: [insight.agent],
          priority: insight.priority || priority,
          actionable: true,
          timestamp: new Date()
        });
      }
    }

    res.json({
      success: true,
      response: aiResponse.final_output,
      analysis_type: aiResponse.analysis_type,
      agents_involved: aiResponse.agents_involved,
      actionType: aiResponse.actionType,
      priority,
      insights: aiResponse.insights
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

export const addInvestment = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, type, amount, date } = req.body;

    const profile = await FinancialProfileModel.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const newTransaction: ITransaction = {
      amount: Number(amount), // Store as a positive value
      category: "Investment", 
      description: name,
      date: date ? new Date(date) : new Date(),
      type: "investment", 
    };

    // Add the new transaction and deduct the amount from savings
    profile.transactions.push(newTransaction);
    profile.savings = (profile.savings || 0) - Number(amount);
    
    const updatedProfile = await profile.save();

    res.status(201).json({ message: "Investment added successfully", profile: updatedProfile });

  } catch (error: any) {
    console.error("Error adding investment:", error);
    res.status(500).json({ message: "Failed to add investment", error: error.message });
  }
};

export const getAgentOutputById = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid insight ID" });
    }

    const output = await AgentOutputModel.findById(id);

    if (!output || output.userId.toString() !== user._id.toString()) {
      return res.status(404).json({ message: "Insight not found" });
    }
    
    const outputData = output.outputData || {};
    const insight = {
      id: output._id.toString(),
      agentType: output.agentType,
      agent: outputData.agent || output.agentType,
      priority: output.priority || "medium",
      actionable: output.actionable || false,
      outputData: {
        title: outputData.title || "Financial Analysis",
        description: outputData.description || "Analysis completed",
        response: outputData.response || outputData.description || "No further details available.", // <-- The full text
        action: outputData.actionType || outputData.action,
        actionType: outputData.actionType || outputData.action
      },
      timestamp: output.timestamp,
      analysis_type: output.analysis_type
    };

    res.json(insight);

  } catch (error: any) {
    console.error("Error fetching single agent output:", error);
    res.status(500).json({ message: "Failed to fetch agent output" });
  }
};

export const getAgentOutputs = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserDocument;
    const { userId } = req.params; 

    if (user._id.toString() !== userId) {
         return res.status(403).json({ message: "Forbidden" });
    }

    const outputs = await AgentOutputModel.find({ userId: userId })
      .sort({ timestamp: -1 })
      .limit(20);

    // This list correctly contains *summaries* (title, description)
    const insights = outputs
      .filter(output => output.outputData && (output.outputData.title || output.outputData.response)) // Ensure there is data
      .map(output => {
        const outputData = output.outputData || {};
        
        return {
          id: output._id.toString(),
          agentType: output.agentType,
          agent: outputData.agent || output.agentType,
          priority: output.priority || "medium",
          actionable: output.actionable || false,
          outputData: {
            title: outputData.title || (outputData.response ? output.userInput : "Financial Insight"),
            description: outputData.description || 
                           outputData.response?.substring(0, 200) + "..." || 
                           "Analysis completed",
            action: outputData.actionType || outputData.action,
            actionType: outputData.actionType || outputData.action
          },
          timestamp: output.timestamp,
          analysis_type: output.analysis_type
        };
      });

    res.json(insights);

  } catch (error: any) {
    console.error("Error fetching outputs:", error);
    res.status(500).json({ message: "Failed to fetch agent outputs" });
  }
};