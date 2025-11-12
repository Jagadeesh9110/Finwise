from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uvicorn
import logging
from datetime import datetime
from dotenv import load_dotenv
import sys
import io

# Set UTF-8 encoding for Windows console to handle emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Load environment variables
load_dotenv()

# Import your existing modules
from config import settings
from graph.workflow import create_financial_workflow
from graph.state import UserProfile, FinancialGoal
from utils import setup_logging, ColorFormatter

# Setup logging
logger = setup_logging()

# Validate API key
try:
    settings.validate_api_key()
except ValueError as e:
    logger.error(f"Error: {str(e)}")
    exit(1)

# Initialize FastAPI app
app = FastAPI(title="FinWise AI Core", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Node.js backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow globally
workflow = None


def _simplify_for_json(obj: Any) -> Any:
    """Recursively simplify objects for JSON serialization"""
    if obj is None:
        return None
    elif isinstance(obj, (str, int, float, bool)):
        return obj
    elif isinstance(obj, dict):
        return {k: _simplify_for_json(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, (list, tuple)):
        return [_simplify_for_json(item) for item in obj]
    elif hasattr(obj, 'model_dump'):
        return _simplify_for_json(obj.model_dump())
    elif hasattr(obj, '__dict__'):
        return _simplify_for_json(obj.__dict__)
    else:
        return str(obj)

# Request/Response Models
class FinancialGoalRequest(BaseModel):
    name: str
    target: float
    timeline_months: int
    priority: int = 1

class DebtRequest(BaseModel):
    name: str
    balance: float
    interest_rate: float
    minimum_payment: float

class TransactionRequest(BaseModel):
    amount: float
    category: str
    description: str
    date: str

class UserProfileRequest(BaseModel):
    age: int
    annual_income: float
    monthly_expenses: float
    savings: float
    debts: List[DebtRequest] = []
    financial_goals: List[FinancialGoalRequest] = []
    risk_tolerance: str = "moderate"
    investment_experience: str = "beginner"
    time_horizon: int = 10
    transactions: List[TransactionRequest] = []

class ProcessRequest(BaseModel):
    user_input: str
    user_profile: UserProfileRequest

class WhatIfScenarioRequest(BaseModel):
    user_profile: UserProfileRequest
    scenario_type: str  # 'expense', 'income', 'investment'
    amount: float
    description: Optional[str] = ""

@app.on_event("startup")
async def startup_event():
    """Initialize the workflow on startup"""
    global workflow
    logger.info("Initializing FinWise AI Core...")
    workflow = create_financial_workflow()
    logger.info("AI Core ready!")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FinWise AI Core"}

@app.post("/api/agents/process")
async def process_financial_request(request: ProcessRequest):
    """Main endpoint to process financial requests through multi-agent system"""
    try:
        logger.info(f"Processing request: {request.user_input[:100]}...")
        
        user_profile_dict = request.user_profile.model_dump() if request.user_profile else None
        
        profile_instance = None
        if user_profile_dict:
            # Convert financial goals
            goals = []
            for goal in user_profile_dict.get('financial_goals', []):
                goals.append(FinancialGoal(
                    name=goal['name'],
                    target=goal['target'],
                    timeline_months=goal['timeline_months'],
                    priority=goal.get('priority', 1)
                ))
            
            # Create UserProfile instance
            profile_instance = UserProfile(
                age=user_profile_dict['age'],
                annual_income=user_profile_dict['annual_income'],
                monthly_expenses=user_profile_dict['monthly_expenses'],
                savings=user_profile_dict['savings'],
                debts=user_profile_dict['debts'],
                financial_goals=goals,
                risk_tolerance=user_profile_dict['risk_tolerance'],
                investment_experience=user_profile_dict['investment_experience'],
                time_horizon=user_profile_dict['time_horizon'],
                transactions=user_profile_dict.get('transactions', [])
            )
            profile_data_for_workflow = profile_instance.model_dump()
        else:
            profile_data_for_workflow = None

        # Process through workflow
        result = workflow.process_request(request.user_input, profile_data_for_workflow)
        final_output = result.get("final_output", "")
        
        if isinstance(final_output, dict):
            response_text = final_output.get("response", "")
            if not isinstance(response_text, str):
                response_text = str(final_output)
            
            agent = final_output.get("agent", "master")
            action_type = final_output.get("actionType")
            priority = final_output.get("priority", "medium")
            
            #  Ensure insights is always a clean list of dicts
            raw_insights = final_output.get("insights", [])
            insights = []
            if isinstance(raw_insights, list):
                for item in raw_insights:
                    if isinstance(item, dict):
                        clean_insight = {
                            "agent": str(item.get("agent", "unknown")),
                            "title": str(item.get("title", "Insight")),
                            "description": str(item.get("description", "")),
                            "actionType": str(item.get("actionType", "review"))
                        }
                        insights.append(clean_insight)
        else:
            # Handles FinancialEducator path
            response_text = str(final_output) if final_output else ""
            agent = "financial_educator"
            action_type = "start_learning"
            priority = "medium"
            insights = []
        
        # Determine which agents were involved
        agents_involved = []
        if result.get("income_analysis"):
            agents_involved.append("income_expense_analyzer")
        if result.get("budget_plan"):
            agents_involved.append("budget_planner")
        if result.get("investment_advice"):
            agents_involved.append("investment_advisor")
        if result.get("debt_optimization"):
            agents_involved.append("debt_optimizer")
        if result.get("financial_education"):
            agents_involved.append("financial_educator")
        
        if not agents_involved and agent:
            agents_involved = [agent]
        elif not agents_involved:
            agents_involved = ["master"]
        
        # Simplify detailed analysis for JSON serialization
        detailed_analysis = {}
        for key in ["income_analysis", "budget_plan", "investment_advice", "debt_optimization", "financial_education"]:
            if result.get(key):
                try:
                    simplified = _simplify_for_json(result[key])
                    detailed_analysis[key] = simplified
                except Exception as e:
                    logger.warning(f"Error simplifying {key}: {str(e)}")
                    detailed_analysis[key] = {"error": "Serialization failed"}
        
        response = {
            "success": True,
            "final_output": str(response_text),
            "agent": str(agent),
            "actionType": str(action_type) if action_type else None,
            "priority": str(priority),
            "insights": insights,
            "analysis_type": str(result.get("current_analysis", {}).get("type", "comprehensive")),
            "agents_involved": [str(a) for a in agents_involved],
            "detailed_analysis": detailed_analysis
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/what-if-scenario")
async def process_what_if_scenario(request: WhatIfScenarioRequest):
    """Process what-if financial scenarios"""
    try:
        user_profile_dict = request.user_profile.model_dump()
        
        original_budget = user_profile_dict['annual_income'] / 12 - user_profile_dict['monthly_expenses']
        
        impact = {
            "originalBudget": original_budget,
            "newBudget": original_budget,
            "savingsImpact": 0,
            "goalDelay": 0,
            "adjustments": []
        }
        
        if request.scenario_type == "expense":
            impact["newBudget"] = original_budget - request.amount
            impact["savingsImpact"] = -request.amount
            impact["goalDelay"] = round(request.amount / (original_budget * 0.3)) if original_budget > 0 else 0
            
            if request.amount > 1000:
                impact["adjustments"] = [
                    {"category": "Entertainment", "reduction": request.amount * 0.3},
                    {"category": "Dining Out", "reduction": request.amount * 0.2},
                    {"category": "Shopping", "reduction": request.amount * 0.5}
                ]
        
        elif request.scenario_type == "income":
            impact["newBudget"] = original_budget + request.amount
            impact["savingsImpact"] = request.amount * 0.7
            impact["goalDelay"] = -round(request.amount / (original_budget * 0.3)) if original_budget > 0 else 0
        
        return impact
        
    except Exception as e:
        logger.error(f"Error processing scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/budget")
async def get_budget_recommendations(request: UserProfileRequest):
    """Get budget recommendations"""
    try:
        from agents.budget_planner import BudgetPlannerAgent
        agent = BudgetPlannerAgent()
        user_profile_dict = request.model_dump()
        budget_plan = agent.create_budget_plan(user_profile_dict)
        return {
            "success": True,
            "budget_plan": _simplify_for_json(budget_plan)
        }
    except Exception as e:
        logger.error(f"Error creating budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/investment")
async def get_investment_advice(request: UserProfileRequest):
    """Get investment recommendations"""
    try:
        from agents.investment_advisor import InvestmentAdvisorAgent
        agent = InvestmentAdvisorAgent()
        user_profile_dict = request.model_dump()
        investment_advice = agent.provide_advice(user_profile_dict)
        return {
            "success": True,
            "investment_advice": _simplify_for_json(investment_advice)
        }
    except Exception as e:
        logger.error(f"Error generating investment advice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/debt")
async def optimize_debt(request: UserProfileRequest):
    """Get debt optimization strategy"""
    try:
        from agents.debt_optimizer import DebtOptimizerAgent
        agent = DebtOptimizerAgent()
        user_profile_dict = request.model_dump()
        debts = user_profile_dict.get('debts', [])
        debt_plan = agent.optimize_repayment(debts, user_profile_dict)
        return {
            "success": True,
            "debt_plan": _simplify_for_json(debt_plan)
        }
    except Exception as e:
        logger.error(f"Error optimizing debt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)