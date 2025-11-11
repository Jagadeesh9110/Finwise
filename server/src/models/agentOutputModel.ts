import { Schema, model, Document, Types } from "mongoose";

// This interface matches the frontend's IAgentOutput AND the new Python response
export interface IAgentOutput {
  userId: Types.ObjectId;
  sessionId: string;
  userInput: string;
  agentType: string; // The agent that *ran* (e.g., master, budget_planner)
  outputData: {
    response?: string; // The main text response (for comprehensive plan)
    title?: string;
    description?: string;
    action?: string; // Fallback action
    actionType?: string; // Primary action type (e.g., "invest", "review_budget")
    agent?: string; // The agent *name* (e.g., "investment_advisor")
    insights?: Array<{
      agent: string;
      title: string;
      description: string;
      actionType: string;
    }>;
    [key: string]: any; // Allow other properties
  };
  analysis_type: string;
  agents_involved: string[];
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

export interface IAgentOutputDocument extends IAgentOutput, Document {
  _id: Types.ObjectId;
}

const agentOutputSchema = new Schema<IAgentOutputDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    userInput: { type: String, required: true },
    agentType: { type: String, required: true },
    outputData: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    analysis_type: { type: String, required: true },
    agents_involved: [String],
    timestamp: { type: Date, default: Date.now },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    actionable: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    strict: false // Allow any fields inside outputData
  }
);

const AgentOutputModel = model<IAgentOutputDocument>("AgentOutput", agentOutputSchema);
export default AgentOutputModel;