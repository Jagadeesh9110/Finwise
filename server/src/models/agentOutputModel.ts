import { Schema, model, Document, Types } from "mongoose";

export interface IAgentOutput {
  userId: Types.ObjectId;
  sessionId: string;
  userInput: string;
  agentType: string;
  outputData: any;
  analysis_type: string;
  agents_involved: string[];
  timestamp: Date;
  priority?: string;
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
    outputData: { type: Schema.Types.Mixed, required: true },
    analysis_type: { type: String, required: true },
    agents_involved: [String],
    timestamp: { type: Date, default: Date.now },
    priority: String,
    actionable: Boolean
  }
);

const AgentOutputModel = model<IAgentOutputDocument>("AgentOutput", agentOutputSchema);
export default AgentOutputModel;