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
    
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: "Please create a financial profile first" 
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
        debts: profile.debts.map(d => ({
          name: d.name,
          balance: d.balance,
          interest_rate: d.interest_rate,
          minimum_payment: d.minimum_payment,
          type: d.type
        })),
        financial_goals: profile.goals.map(g => ({
          name: g.name,
          target: g.target,
          timeline_months: 12,
          priority: g.priority
        })),
        risk_tolerance: profile.risk_tolerance,
        investment_experience: profile.investment_experience,
        time_horizon: 10,
        transactions: profile.transactions.map(t => ({
          amount: Number(t.amount),
          category: String(t.category),
          description: String(t.description),
          date: new Date(t.date).toISOString().split('T')[0]
        }))
      }
    };

    console.log("=== SENDING TO PYTHON ===");
    console.log("User Input:", command);
    console.log("Profile Age:", profile.age);
    console.log("Transaction Count:", profile.transactions.length);

    // Call Python AI service
    const response = await axios.post(`${PYTHON_API_URL}/api/agents/process`, aiRequest);
    
    const aiResponse = response.data;
    
    console.log("=== PYTHON RESPONSE ===");
    console.log("Agent:", aiResponse.agent);
    console.log("Analysis Type:", aiResponse.analysis_type);
    console.log("Response Length:", aiResponse.final_output?.length || 0);

    // Extract and store complete agent output
    const sessionId = uuidv4();
    
    const priority = aiResponse.priority || 'medium';
    const actionable = !!(aiResponse.actionType || aiResponse.insights?.length > 0);
    
    // Create main agent output
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

    // Store individual insights
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
    console.error("=== AI PROCESSING ERROR ===");
    console.error("Error:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    
    res.status(500).json({ 
      success: false,
      message: "Failed to process AI command",
      error: error.response?.data?.detail || error.message
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
    // ===== DEBUG LOGGING =====
    console.log("=== ADD INVESTMENT REQUEST ===");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);
    console.log("req.isAuthenticated():", req.isAuthenticated ? req.isAuthenticated() : "N/A");
    
    const user = req.user as IUserDocument;
    
    if (!user || !user._id) {
      console.error("❌ User not authenticated or user._id missing");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const { name, type, amount, date } = req.body;
    
    console.log("Authenticated user ID:", user._id);
    console.log("Investment details:", { name, type, amount, date });

    // Validate input
    if (!name || !amount || amount <= 0) {
      console.error("❌ Invalid investment data");
      return res.status(400).json({ message: "Invalid investment data" });
    }

    console.log("Finding profile for userId:", user._id);
    const profile = await FinancialProfileModel.findOne({ userId: user._id });
    
    if (!profile) {
      console.error("❌ Profile not found for userId:", user._id);
      return res.status(404).json({ message: "Profile not found" });
    }
    
    console.log("Profile found:", profile._id);

    const newTransaction: ITransaction = {
      amount: -Math.abs(Number(amount)), // Negative for expense
      category: "Investment", 
      description: name,
      date: date ? new Date(date) : new Date(),
      type: "expense", // Keep consistent with existing data
    };
    
    console.log("New transaction:", newTransaction);

    // Add the new transaction and deduct the amount from savings
    profile.transactions.push(newTransaction);
    profile.savings = (profile.savings || 0) - Math.abs(Number(amount));
    
    console.log("Saving profile...");
    const updatedProfile = await profile.save();
    
    console.log("✅ Investment added successfully");

    res.status(201).json({ 
      message: "Investment added successfully", 
      profile: updatedProfile 
    });

  } catch (error: any) {
    console.error("❌ ERROR in addInvestment:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Failed to add investment", 
      error: error.message 
    });
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