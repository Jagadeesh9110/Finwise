import { Schema, model, Document, Types } from "mongoose";

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
  date: Date;
  type: 'income' | 'expense' | 'investment';
}

export interface IFinancialProfile {
  userId: Types.ObjectId;
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

export interface IFinancialProfileDocument extends IFinancialProfile, Document {
  _id: Types.ObjectId;
}

const financialProfileSchema = new Schema<IFinancialProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number, required: true },
    annual_income: { type: Number, required: true },
    monthly_expenses: { type: Number, required: true },
    savings: { type: Number, default: 0 },
    goals: [{
      name: String,
      target: Number,
      current: Number,
      deadline: String,
      priority: Number
    }],
    
    debts: [{
      name: String,
      balance: Number,
      interest_rate: Number,
      minimum_payment: Number,
      type: String
    }],


    transactions: [{
      amount: Number,
      category: String,
      description: String,
      date: Date,
      type: { type: String, enum: ['income', 'expense', 'investment'] }
    }],
    risk_tolerance: { 
      type: String, 
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    investment_experience: { 
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    }
  },
  { timestamps: true }
);

const FinancialProfileModel = model<IFinancialProfileDocument>("FinancialProfile", financialProfileSchema);
export default FinancialProfileModel;