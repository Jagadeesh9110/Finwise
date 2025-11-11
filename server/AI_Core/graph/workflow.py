# In graph/workflow.py

from langgraph.graph import StateGraph, END
from typing import Dict, Any, List, Optional
import logging

from .state import AgentState, AnalysisType

logger = logging.getLogger(__name__)

class FinancialWorkflow:
    """Orchestrates the multi-agent financial workflow"""
    
    def __init__(self):
        # Import agents inside the method to avoid circular imports
        from agents.master_agent import MasterFinancialStrategistAgent
        from agents.income_expense_analyzer import IncomeExpenseAnalyzerAgent
        from agents.budget_planner import BudgetPlannerAgent
        from agents.investment_advisor import InvestmentAdvisorAgent
        from agents.debt_optimizer import DebtOptimizerAgent
        from agents.financial_educator import FinancialEducatorAgent
        
        self.master_agent = MasterFinancialStrategistAgent()
        self.income_analyzer = IncomeExpenseAnalyzerAgent()
        self.budget_planner = BudgetPlannerAgent()
        self.investment_advisor = InvestmentAdvisorAgent()
        self.debt_optimizer = DebtOptimizerAgent()
        self.financial_educator = FinancialEducatorAgent()
        
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes for each agent
        workflow.add_node("master_agent", self._master_agent_node)
        workflow.add_node("income_analyzer", self._income_analyzer_node)
        workflow.add_node("budget_planner", self._budget_planner_node)
        workflow.add_node("investment_advisor", self._investment_advisor_node)
        workflow.add_node("debt_optimizer", self._debt_optimizer_node)
        workflow.add_node("financial_educator", self._financial_educator_node)
        workflow.add_node("comprehensive_analysis", self._comprehensive_analysis_node)
        workflow.add_node("synthesize", self._synthesize_node)
        
        # Set entry point
        workflow.set_entry_point("master_agent")
        
        # Define conditional routing
        workflow.add_conditional_edges(
            "master_agent",
            self._route_based_on_analysis,
            {
                AnalysisType.INCOME_EXPENSE: "income_analyzer",
                AnalysisType.BUDGET_PLANNING: "budget_planner",
                AnalysisType.INVESTMENT_ADVICE: "investment_advisor", 
                AnalysisType.DEBT_OPTIMIZATION: "debt_optimizer",
                AnalysisType.FINANCIAL_EDUCATION: "financial_educator", # This route is correct
                AnalysisType.COMPREHENSIVE: "comprehensive_analysis",
                "end": END
            }
        )
        
        # Connect all specialist agents (EXCEPT EDUCATOR) to synthesize
        workflow.add_edge("income_analyzer", "synthesize")
        workflow.add_edge("budget_planner", "synthesize")
        workflow.add_edge("investment_advisor", "synthesize")
        workflow.add_edge("debt_optimizer", "synthesize")
        workflow.add_edge("comprehensive_analysis", "synthesize")

        # === MODIFIED: This is the logical fix ===
        # The educator node should go directly to the end.
        workflow.add_edge("financial_educator", END)
        # === END MODIFIED ===
        
        # Final step to end
        workflow.add_edge("synthesize", END)
        
        return workflow.compile()
    
    def _master_agent_node(self, state: AgentState) -> Dict[str, Any]:
        """Master agent determines analysis type"""
        logger.info("Master agent processing user request")
        
        user_input = state.get("user_input", "")
        user_profile = state.get("user_profile") 
        
        analysis_type = self.master_agent.determine_analysis_type(user_input, user_profile)
        
        return {
            "current_analysis": {"type": analysis_type},
            "next_agent": analysis_type
        }
    
    def _route_based_on_analysis(self, state: AgentState) -> str:
        """Route to appropriate agent based on analysis type"""
        analysis_type = state.get("current_analysis", {}).get("type")
        # If there's no user profile and the analysis came back as comprehensive,
        # treat it as a general knowledge question and route to educator.
        if not state.get("user_profile") and analysis_type == AnalysisType.COMPREHENSIVE:
            return AnalysisType.FINANCIAL_EDUCATION
        return analysis_type or AnalysisType.COMPREHENSIVE
    
    def _income_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Income and expense analysis"""
        logger.info("Income analyzer processing request")
        
        user_profile = state.get("user_profile")
        if user_profile is None:
            logger.warning("No user profile to analyze income/expenses.")
            return {"income_analysis": {"error": "No user profile data available."}}
            
        transactions = user_profile.get("transactions", [])
        analysis = self.income_analyzer.analyze_finances(transactions)
        
        return {
            "income_analysis": analysis,
            "next_agent": "synthesize"
        }
    
    def _budget_planner_node(self, state: AgentState) -> Dict[str, Any]:
        """Budget planning"""
        logger.info("Budget planner processing request")
        
        user_profile = state.get("user_profile")
        if user_profile is None:
            logger.warning("No user profile to create budget.")
            return {"budget_plan": {"error": "No user profile data available."}}

        budget_plan = self.budget_planner.create_budget_plan(user_profile)
        
        return {
            "budget_plan": budget_plan,
            "next_agent": "synthesize"
        }
    
    def _investment_advisor_node(self, state: AgentState) -> Dict[str, Any]:
        """Investment advice"""
        logger.info("Investment advisor processing request")
        
        user_profile = state.get("user_profile")
        if user_profile is None:
            logger.warning("No user profile to provide investment advice.")
            return {"investment_advice": {"error": "No user profile data available."}}
            
        investment_advice = self.investment_advisor.provide_advice(user_profile)
        
        return {
            "investment_advice": investment_advice,
            "next_agent": "synthesize"
        }
    
    def _debt_optimizer_node(self, state: AgentState) -> Dict[str, Any]:
        """Debt optimization"""
        logger.info("Debt optimizer processing request")
        
        user_profile = state.get("user_profile")
        if user_profile is None:
            logger.warning("No user profile to optimize debt.")
            return {"debt_optimization": {"error": "No user profile data available."}}

        debts = user_profile.get("debts", [])
        debt_plan = self.debt_optimizer.optimize_repayment(debts, user_profile)
        
        return {
            "debt_optimization": debt_plan,
            "next_agent": "synthesize"
        }
    
    # === MODIFIED: This node now puts its result in 'final_output' ===
    def _financial_educator_node(self, state: AgentState) -> Dict[str, Any]:
        """Financial education. This is a terminal node."""
        logger.info("Financial educator processing request")
        
        user_input = state.get("user_input", "")
        user_profile = state.get("user_profile") 
        
        result = self.financial_educator.explain_concept(user_input, user_profile)
        
        final_answer = ""
        if "error" in result:
            final_answer = result["error"]
        else:
            final_answer = result["explanation"]
        
        return {
            "financial_education": result,
            "final_output": final_answer # Put the answer directly into final_output
        }
    # === END MODIFIED ===

    def _comprehensive_analysis_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Runs all specialist agents in sequence to gather data for a comprehensive plan.
        """
        logger.info("Running comprehensive analysis node (calling all specialists)...")
        
        # 1. Call Income Analyzer
        logger.info("... comprehensive step 1: Income Analyzer")
        income_state = self._income_analyzer_node(state)
        
        # 2. Call Budget Planner
        logger.info("... comprehensive step 2: Budget Planner")
        budget_state = self._budget_planner_node(state)
        
        # 3. Call Investment Advisor
        logger.info("... comprehensive step 3: Investment Advisor")
        investment_state = self._investment_advisor_node(state)
        
        # 4. Call Debt Optimizer
        logger.info("... comprehensive step 4: Debt Optimizer")
        debt_state = self._debt_optimizer_node(state)
        
        # Return a dictionary that updates the main state
        return {
            "income_analysis": income_state.get("income_analysis"),
            "budget_plan": budget_state.get("budget_plan"),
            "investment_advice": investment_state.get("investment_advice"),
            "debt_optimization": debt_state.get("debt_optimization"),
        }

    def _synthesize_node(self, state: AgentState) -> Dict[str, Any]:
        """Synthesize all analyses into final plan"""
        logger.info("Synthesizing final financial plan")
        
        user_profile = state.get("user_profile")
        
        analyses = {
            "income_analysis": state.get("income_analysis"),
            "budget_plan": state.get("budget_plan"), 
            "investment_advice": state.get("investment_advice"),
            "debt_optimization": state.get("debt_optimization"),
            # We no longer expect financial_education here
        }
        
        valid_analyses = {k: v for k, v in analyses.items() if v is not None}
        
        final_plan = self.master_agent.synthesize_plan(user_profile, valid_analyses)
        
        return {
            "final_output": final_plan,
            "next_agent": "end"
        }
    
    def process_request(self, user_input: str, user_profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Process user request through the workflow"""
        
        initial_state = AgentState(
            user_input=user_input,
            user_profile=user_profile,
            conversation_history=[],
            current_analysis={},
            income_analysis=None,
            budget_plan=None,
            investment_advice=None,
            debt_optimization=None,
            financial_education=None,
            next_agent="master_agent",
            final_output=None,
            error=None
        )
        
        try:
            result = self.workflow.invoke(initial_state)
            return result
        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}")
            return {
                "final_output": f"I apologize, but I encountered an error while processing your request: {str(e)}",
                "error": str(e)
            }

def create_financial_workflow() -> FinancialWorkflow:
    """Create and return the financial workflow instance"""
    return FinancialWorkflow()