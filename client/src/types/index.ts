// This file should contain all types shared between your frontend components.

export interface IFinancialGoal {
  name: string;
  target: number;
  current: number;
  deadline: string;
  priority: number;
}

export interface IDebt {
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  type: string;
}

export interface ITransaction {
  amount: number;
  category: string;
  description: string;
  date: Date | string; 
 type: 'income' | 'expense' | 'investment';
}

export interface IFinancialProfile {
  _id?: string; 
  userId: string;
  age: number;
  annual_income: number;
  monthly_expenses: number;
  savings: number;
  goals: IFinancialGoal[];
  debts: IDebt[];
  transactions: ITransaction[];
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  investment_experience: 'beginner' | 'intermediate' | 'expert';
}

export interface IAgentOutput {
  id: string; 
  agentType: string;
  agent?: string;
  priority?: 'low' | 'medium' | 'high';
  actionable?: boolean;
  outputData: {
    response?: string;
    title?: string;
    description?: string;
    action?: string;
    actionType?: string;
    agent?: string;
    insights?: Array<{
      agent: string;
      title: string;
      description: string;
      actionType: string;
    }>;
    [key: string]: any;
  };
  analysis_type: string;
  agents_involved: string[];
  timestamp: Date | string; 
}