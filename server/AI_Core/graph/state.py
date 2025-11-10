from typing import TypedDict, List, Dict, Any, Optional, Annotated
from pydantic import BaseModel, Field
from enum import Enum

class AgentState(TypedDict):
    """State for the multi-agent financial system"""
    user_input: str
    user_profile: Dict[str, Any]
    conversation_history: List[Dict[str, str]]
    current_analysis: Dict[str, Any]
    income_analysis: Optional[Dict[str, Any]]
    budget_plan: Optional[Dict[str, Any]]
    investment_advice: Optional[Dict[str, Any]]
    debt_optimization: Optional[Dict[str, Any]]
    financial_education: Optional[str]
    next_agent: str
    final_output: Optional[str]
    error: Optional[str]

class AnalysisType(str, Enum):
    INCOME_EXPENSE = "income_expense"
    BUDGET_PLANNING = "budget_planning"
    INVESTMENT_ADVICE = "investment_advice"
    DEBT_OPTIMIZATION = "debt_optimization"
    FINANCIAL_EDUCATION = "financial_education"
    COMPREHENSIVE = "comprehensive"

class FinancialGoal(BaseModel):
    """Financial goal model"""
    name: str
    target: float
    timeline_months: int
    priority: int = Field(ge=1, le=5)

class UserProfile(BaseModel):
    """User financial profile model"""
    age: int
    annual_income: float
    monthly_expenses: float
    savings: float
    debts: List[Dict[str, Any]]
    financial_goals: List[FinancialGoal]
    risk_tolerance: str
    investment_experience: str
    time_horizon: int
    transactions: List[Dict[str, Any]] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 30,
                "annual_income": 75000,
                "monthly_expenses": 3500,
                "savings": 15000,
                "debts": [
                    {"type": "student_loan", "balance": 25000, "interest_rate": 4.5},
                    {"type": "credit_card", "balance": 5000, "interest_rate": 18.9}
                ],
                "financial_goals": [
                    {"name": "emergency_fund", "target": 15000, "timeline_months": 12},
                    {"name": "down_payment", "target": 50000, "timeline_months": 36}
                ],
                "risk_tolerance": "moderate",
                "investment_experience": "beginner",
                "time_horizon": 10
            }
        }

class FinancialPlan(BaseModel):
    """Comprehensive financial plan model"""
    summary: str
    recommendations: List[str]
    action_items: List[Dict[str, Any]]
    risk_assessment: str
    timeline: Dict[str, Any]
    metrics: Dict[str, float]
    
    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Comprehensive financial plan focusing on debt reduction and savings growth",
                "recommendations": [
                    "Build 3-month emergency fund",
                    "Pay down high-interest credit card debt",
                    "Start retirement investing with 70/30 stock/bond allocation"
                ],
                "action_items": [
                    {"action": "Set up automatic savings", "priority": "high", "timeline": "immediate"},
                    {"action": "Create debt repayment plan", "priority": "high", "timeline": "1 week"}
                ],
                "risk_assessment": "Moderate risk tolerance suitable for balanced portfolio",
                "timeline": {
                    "short_term": "3-6 months",
                    "medium_term": "1-3 years", 
                    "long_term": "5+ years"
                },
                "metrics": {
                    "savings_rate": 20.0,
                    "debt_free_date": "2026-12-01",
                    "retirement_projection": 850000
                }
            }
        }