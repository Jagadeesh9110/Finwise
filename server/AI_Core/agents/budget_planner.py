from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Tuple
import logging
import math

from config import settings
from tools import FinancialCalculators, DataProcessor
from graph.state import UserProfile
from utils import format_currency, ColorFormatter

logger = logging.getLogger(__name__)

class BudgetPlannerAgent:
    """Creates and optimizes personalized budget plans"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("planner")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.calculators = FinancialCalculators()
        self.data_processor = DataProcessor()
        
        self.system_prompt = SystemMessage(content="""
        You are an expert budget planner specializing in creating personalized financial plans.

        Your expertise:
        - Creating realistic budget allocations based on income and goals
        - Optimizing savings rates while maintaining quality of life
        - Setting up emergency funds and contingency planning
        - Balancing short-term needs with long-term goals
        - Implementing the 50/30/20 rule and other budgeting frameworks

        Provide practical, actionable budget recommendations that consider the user's lifestyle and constraints.
        Always include specific percentages and amounts for each category.
        """)
    
    def create_budget_plan(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create a comprehensive budget plan"""
        logger.info("Creating budget plan for user profile")
        
        try:
            # Extract key information
            income = user_profile.get('annual_income', 0) / 12  # Convert to monthly
            expenses = user_profile.get('monthly_expenses', 0)
            savings = user_profile.get('savings', 0)
            goals = user_profile.get('financial_goals', [])
            debts = user_profile.get('debts', [])
            
            # Calculate budget allocations
            budget_allocation = self._calculate_budget_allocation(income, expenses, goals, debts)
            savings_plan = self._create_savings_plan(income, expenses, goals, savings)
            debt_repayment = self._calculate_debt_repayment_budget(debts, income)
            
            # Generate detailed budget using LLM
            detailed_budget = self._generate_detailed_budget(
                income, expenses, budget_allocation, savings_plan, debt_repayment, goals
            )
            
            return {
                "monthly_income": income,
                "current_expenses": expenses,
                "budget_allocation": budget_allocation,
                "savings_plan": savings_plan,
                "debt_repayment_allocation": debt_repayment,
                "detailed_recommendations": detailed_budget,
                "emergency_fund_target": expenses * settings.EMERGENCY_FUND_MONTHS,
                "savings_rate": ((income - expenses) / income * 100) if income > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error creating budget plan: {str(e)}")
            return {"error": str(e), "detailed_recommendations": "Unable to create budget plan."}
    
    def _calculate_budget_allocation(self, income: float, expenses: float, 
                                   goals: List[Dict], debts: List[Dict]) -> Dict[str, float]:
        """Calculate optimal budget allocation using multiple frameworks"""
        
        # Calculate total debt payments
        total_debt_payments = sum(debt.get('minimum_payment', 0) for debt in debts)
        
        # Framework 1: 50/30/20 Rule
        needs_50 = income * 0.50
        wants_30 = income * 0.30
        savings_20 = income * 0.20
        
        # Framework 2: Goal-oriented allocation
        goal_savings_needed = self._calculate_goal_savings(goals, income)
        
        # Framework 3: Debt-focused allocation (if high debt)
        debt_ratio = total_debt_payments / income if income > 0 else 0
        if debt_ratio > 0.15:  # High debt burden
            debt_focused_allocation = {
                "essential_expenses": income * 0.50,
                "debt_repayment": income * 0.30,
                "savings": income * 0.10,
                "discretionary": income * 0.10
            }
            return debt_focused_allocation
        
        # Default to balanced allocation
        return {
            "housing": income * 0.25,
            "transportation": income * 0.15,
            "food": income * 0.12,
            "healthcare": income * 0.08,
            "debt_repayment": total_debt_payments,
            "savings": max(income * 0.15, goal_savings_needed),
            "discretionary": income * 0.15,
            "insurance": income * 0.05,
            "utilities": income * 0.05
        }
    
    def _calculate_goal_savings(self, goals: List[Dict], income: float) -> float:
        """Calculate monthly savings needed for financial goals"""
        if not goals:
            return income * settings.DEFAULT_SAVINGS_RATE
        
        total_monthly_savings = 0
        for goal in goals:
            target = goal.get('target', 0)
            timeline = goal.get('timeline_months', 12)
            monthly_savings = target / timeline if timeline > 0 else 0
            total_monthly_savings += monthly_savings
        
        # Cap at 30% of income to be realistic
        return min(total_monthly_savings, income * 0.30)
    
    def _create_savings_plan(self, income: float, expenses: float, 
                           goals: List[Dict], current_savings: float) -> Dict[str, Any]:
        """Create a detailed savings plan"""
        emergency_fund_target = expenses * settings.EMERGENCY_FUND_MONTHS
        emergency_fund_gap = max(0, emergency_fund_target - current_savings)
        
        goal_savings = {}
        for goal in goals:
            goal_name = goal.get('name', 'unknown')
            target = goal.get('target', 0)
            timeline = goal.get('timeline_months', 12)
            monthly = target / timeline if timeline > 0 else 0
            goal_savings[goal_name] = {
                "monthly_savings": monthly,
                "target": target,
                "timeline_months": timeline,
                "priority": goal.get('priority', 'medium')
            }
        
        return {
            "emergency_fund": {
                "target": emergency_fund_target,
                "current": current_savings,
                "gap": emergency_fund_gap,
                "monthly_savings_needed": emergency_fund_gap / 6  # Aim to build in 6 months
            },
            "goal_savings": goal_savings,
            "total_monthly_savings": sum(goal['monthly_savings'] for goal in goal_savings.values())
        }
    
    def _calculate_debt_repayment_budget(self, debts: List[Dict], income: float) -> Dict[str, Any]:
        """Calculate debt repayment allocation"""
        if not debts:
            return {"total_monthly_payment": 0, "debts": []}
        
        total_minimum_payments = sum(debt.get('minimum_payment', 0) for debt in debts)
        recommended_extra = min(income * 0.10, 500)  # 10% of income or $500, whichever is smaller
        
        debt_details = []
        for debt in debts:
            debt_details.append({
                "name": debt.get('name', 'Unknown'),
                "balance": debt.get('balance', 0),
                "minimum_payment": debt.get('minimum_payment', 0),
                "recommended_extra": recommended_extra / len(debts)
            })
        
        return {
            "total_monthly_payment": total_minimum_payments + recommended_extra,
            "minimum_payments": total_minimum_payments,
            "recommended_extra": recommended_extra,
            "debts": debt_details
        }
    
    def _generate_detailed_budget(self, income: float, expenses: float, allocation: Dict[str, float],
                                savings_plan: Dict[str, Any], debt_repayment: Dict[str, Any],
                                goals: List[Dict]) -> str:
        """Generate detailed budget recommendations using LLM"""
        
        prompt = f"""
        Create a detailed, personalized budget plan based on this financial information:
        
        MONTHLY INCOME: {format_currency(income)}
        CURRENT EXPENSES: {format_currency(expenses)}
        
        BUDGET ALLOCATION:
        {chr(10).join(f"- {category}: {format_currency(amount)} ({amount/income*100:.1f}%)" for category, amount in allocation.items())}
        
        SAVINGS PLAN:
        Emergency Fund Target: {format_currency(savings_plan['emergency_fund']['target'])}
        Current Emergency Savings: {format_currency(savings_plan['emergency_fund']['current'])}
        Monthly Savings Needed for Goals: {format_currency(savings_plan['total_monthly_savings'])}
        
        DEBT REPAYMENT:
        Total Monthly Debt Payments: {format_currency(debt_repayment['total_monthly_payment'])}
        
        FINANCIAL GOALS:
        {chr(10).join(f"- {goal.get('name')}: {format_currency(goal.get('target', 0))} in {goal.get('timeline_months', 0)} months" for goal in goals)}
        
        Please provide:
        1. Specific budget recommendations for each category
        2. Tips to reduce expenses in high-spending areas
        3. Savings prioritization strategy
        4. Debt repayment optimization
        5. Monthly action plan
        6. Progress tracking suggestions
        
        Be practical and consider real-world constraints.
        """
        
        response = self.llm.invoke([
            self.system_prompt,
            HumanMessage(content=prompt)
        ])
        
        return response.content