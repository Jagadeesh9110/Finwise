from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Optional
import logging

from config import settings
from graph.state import AnalysisType
from utils import ColorFormatter

logger = logging.getLogger(__name__)

class MasterFinancialStrategistAgent:
    """Orchestrates the multi-agent financial system and coordinates all sub-agents"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("master")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.system_prompt = SystemMessage(content="""
        You are the Master Financial Strategist, an AI that coordinates multiple specialized financial agents.

        Your responsibilities:
        1. Analyze user requests to determine which specialists are needed
        2. Route requests to appropriate sub-agents based on content analysis
        3. Synthesize multiple analyses into a cohesive financial plan
        4. Present recommendations in clear, actionable language
        5. Maintain a helpful, professional tone while ensuring comprehensive coverage

        Available specialist agents:
        - Income & Expense Analyzer: For spending patterns, cash flow analysis, transaction categorization
        - Budget Planner: For creating and optimizing budgets, savings allocations
        - Investment Advisor: For portfolio recommendations, asset allocation, retirement planning
        - Debt Optimizer: For debt repayment strategies, interest minimization, consolidation
        - Financial Educator: For explaining concepts and answering "why" questions

        Always consider the user's complete financial picture when making recommendations.
        Ensure all recommendations are practical, personalized, and actionable.
        """)
    
    def determine_analysis_type(self, user_input: str, user_profile: Dict[str, Any]) -> AnalysisType:
        """Intelligently determine which analysis type is needed based on user input"""
        logger.info(f"Master agent analyzing request: {user_input[:100]}...")
        
        # Extract key financial context from user profile
        financial_context = self._extract_financial_context(user_profile)
        
        prompt = f"""
        User Input: "{user_input}"
        
        User Financial Context:
        {financial_context}
        
        Based on the user's input and financial context, determine the MOST appropriate analysis type.
        
        Available Analysis Types:
        - income_expense: For questions about spending patterns, cash flow, expense tracking, income analysis
        - budget_planning: For budget creation, allocation optimization, savings goals, spending limits
        - investment_advice: For investing, portfolios, stocks, returns, retirement planning, asset allocation
        - debt_optimization: For loans, credit cards, debt repayment, interest reduction, consolidation
        - financial_education: For explaining concepts, "why" questions, learning, terminology
        - comprehensive: For general financial planning or when multiple areas need analysis
        
        Consider these keywords and intent:
        - Income/expense: "spending", "cash flow", "where my money goes", "expense tracking"
        - Budget: "budget", "allocation", "savings rate", "spending plan"
        - Investment: "invest", "portfolio", "stocks", "retirement", "returns"
        - Debt: "debt", "loan", "repay", "credit card", "interest"
        - Education: "explain", "what is", "how does", "why should"
        
        Return ONLY the analysis type as a single word from the available options.
        """
        
        try:
            response = self.llm.invoke([
                self.system_prompt,
                HumanMessage(content=prompt)
            ])
            
            analysis_type_str = response.content.strip().lower()
            logger.info(f"LLM determined analysis type: {analysis_type_str}")
            
            # Map to enum with intelligent fallbacks
            return self._map_to_analysis_type(analysis_type_str, user_input)
            
        except Exception as e:
            logger.error(f"Error determining analysis type: {str(e)}")
            return self._fallback_analysis_type(user_input)
    
    def synthesize_plan(self, user_profile: Dict[str, Any], analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize multiple agent analyses into a comprehensive, actionable financial plan"""
        logger.info("Master agent synthesizing comprehensive financial plan")
        
        # Filter out None analyses and prepare synthesis data
        valid_analyses = {k: v for k, v in analyses.items() if v is not None and not v.get('error')}
        
        if not valid_analyses:
            return {
                "response": "I apologize, but I couldn't gather enough data to create a comprehensive financial plan.",
                "agent": "master",
                "actionType": None
            }
        
        synthesis_data = self._prepare_synthesis_data(user_profile, valid_analyses)
        
        prompt = f"""
        SYNTHESIZE A COMPREHENSIVE FINANCIAL PLAN
        
        USER PROFILE:
        {synthesis_data['user_profile']}
        
        AVAILABLE ANALYSES:
        {synthesis_data['analyses_summary']}
        
        KEY METRICS AND INSIGHTS:
        {synthesis_data['key_metrics']}
        
        Create a cohesive, personalized financial plan that:
        
        1. EXECUTIVE SUMMARY: Brief overview of current financial health and key recommendations
        
        2. PRIORITY ACTIONS (What to do now):
           - Immediate steps (next 30 days)
           - Quick wins that provide immediate benefit
           - Critical fixes for any financial risks
        
        3. STRATEGIC RECOMMENDATIONS (What to do next):
           - Budget optimization strategies
           - Debt management approach
           - Investment strategy alignment
           - Savings acceleration tactics
        
        4. IMPLEMENTATION ROADMAP:
           - Month 1-3: Foundation building
           - Month 4-6: Debt reduction and savings growth
           - Month 7-12: Investment optimization
           - Year 2+: Long-term wealth building
        
        5. RISK MANAGEMENT:
           - Emergency fund status and recommendations
           - Insurance considerations
           - Market risk exposure
           - Liquidity needs
        
        6. PROGRESS TRACKING:
           - Key metrics to monitor monthly
           - Milestone celebrations
           - Warning signs to watch for
        
        7. PERSONALIZED MOTIVATION:
           - Connect recommendations to user's specific goals
           - Highlight the emotional benefits of financial security
           - Provide encouragement for the journey ahead
        
        Make this plan SPECIFIC, ACTIONABLE, and PERSONALIZED. Use concrete numbers and timelines.
        Focus on practical steps the user can implement immediately.
        """
        
        try:
            response = self.llm.invoke([
                self.system_prompt,
                HumanMessage(content=prompt)
            ])
            
            synthesized_plan = self._format_final_output(response.content, valid_analyses)
            logger.info("Successfully synthesized comprehensive financial plan")
            
            # === MODIFIED: Return structured response with metadata ===
            return {
                "response": synthesized_plan,
                "agent": "master",
                "actionType": self._determine_action_type(valid_analyses),
                "priority": self._determine_priority(valid_analyses),
                "insights": self._extract_key_insights(valid_analyses)
            }
            
        except Exception as e:
            logger.error(f"Error synthesizing plan: {str(e)}")
            return {
                "response": self._create_fallback_plan(valid_analyses),
                "agent": "master",
                "actionType": "review",
                "priority": "medium"
            }

    # === ADDED HELPER METHODS ===
    
    def _determine_action_type(self, analyses: Dict[str, Any]) -> str:
        """Determine the primary action type based on analyses"""
        if "debt_optimization" in analyses:
            return "manage_debt"
        elif "investment_advice" in analyses:
            return "invest"
        elif "budget_plan" in analyses:
            return "review_budget"
        elif "income_analysis" in analyses:
            return "optimize_spending"
        else:
            return "review"

    def _determine_priority(self, analyses: Dict[str, Any]) -> str:
        """Determine priority based on financial health indicators"""
        if "debt_optimization" in analyses:
            debt_data = analyses["debt_optimization"]
            debt_ratio = debt_data.get("current_debt_situation", {}).get("debt_to_income_ratio", 0)
            if debt_ratio > 40:
                return "high"
        
        if "income_analysis" in analyses:
            income_data = analyses["income_analysis"]
            savings_rate = income_data.get("summary_metrics", {}).get("savings_rate", 0)
            if savings_rate < 0:
                return "high"
            elif savings_rate < 10:
                return "medium"
        
        return "low"

    def _extract_key_insights(self, analyses: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract actionable insights from each analysis"""
        insights = []
        
        for analysis_type, analysis_data in analyses.items():
            if analysis_data and not analysis_data.get('error'):
                if analysis_type == "income_analysis":
                    net_flow = analysis_data.get('summary_metrics', {}).get('net_cash_flow', 0)
                    insights.append({
                        "agent": "income_expense_analyzer",
                        "title": "Cash Flow Analysis",
                        "description": f"Monthly net cash flow: ${net_flow:,.2f}",
                        "actionType": "optimize_spending" if net_flow < 0 else "increase_savings"
                    })
                
                elif analysis_type == "budget_plan":
                    savings_rate = analysis_data.get('savings_rate', 0)
                    insights.append({
                        "agent": "budget_planner",
                        "title": "Budget Optimization",
                        "description": f"Current savings rate: {savings_rate:.1f}%",
                        "actionType": "review_budget"
                    })
                
                elif analysis_type == "investment_advice":
                    risk_profile = analysis_data.get('risk_profile', 'moderate')
                    insights.append({
                        "agent": "investment_advisor",
                        "title": "Investment Strategy",
                        "description": f"Recommended {risk_profile} portfolio",
                        "actionType": "invest"
                    })
                
                elif analysis_type == "debt_optimization":
                    strategy = analysis_data.get('recommended_strategy', {}).get('recommended_method', 'snowball')
                    insights.append({
                        "agent": "debt_optimizer",
                        "title": "Debt Management",
                        "description": f"Use {strategy} method for optimal repayment",
                        "actionType": "manage_debt"
                    })
        
        return insights

    # === END ADDED HELPER METHODS ===

    def _extract_financial_context(self, user_profile: Dict[str, Any]) -> str:
        """Extract and format key financial context from user profile"""
        context_parts = []
        
        if not user_profile:
            return "No personal context provided."

        # Basic demographics
        if user_profile.get('age'):
            context_parts.append(f"- Age: {user_profile['age']}")
        
        # Financial situation
        if user_profile.get('annual_income'):
            monthly_income = user_profile['annual_income'] / 12
            context_parts.append(f"- Monthly Income: ${monthly_income:,.2f}")
        
        if user_profile.get('monthly_expenses'):
            context_parts.append(f"- Monthly Expenses: ${user_profile['monthly_expenses']:,.2f}")
        
        if user_profile.get('savings'):
            context_parts.append(f"- Current Savings: ${user_profile['savings']:,.2f}")
        
        # Debt situation
        debts = user_profile.get('debts', [])
        if debts:
            total_debt = sum(debt.get('balance', 0) for debt in debts)
            context_parts.append(f"- Total Debt: ${total_debt:,.2f} across {len(debts)} accounts")
        
        # Goals
        goals = user_profile.get('financial_goals', [])
        if goals:
            goal_names = [goal.get('name', 'Unknown') for goal in goals]
            context_parts.append(f"- Financial Goals: {', '.join(goal_names)}")
        
        # Risk profile
        if user_profile.get('risk_tolerance'):
            context_parts.append(f"- Risk Tolerance: {user_profile['risk_tolerance']}")
        
        return "\n".join(context_parts) if context_parts else "Limited profile information available"
    
    def _map_to_analysis_type(self, analysis_type_str: str, user_input: str) -> AnalysisType:
        """Map string response to AnalysisType enum with intelligent fallbacks"""
        
        # Direct mapping from common responses
        type_mapping = {
            "income": AnalysisType.INCOME_EXPENSE,
            "expense": AnalysisType.INCOME_EXPENSE,
            "spending": AnalysisType.INCOME_EXPENSE,
            "cashflow": AnalysisType.INCOME_EXPENSE,
            "budget": AnalysisType.BUDGET_PLANNING,
            "savings": AnalysisType.BUDGET_PLANNING,
            "allocation": AnalysisType.BUDGET_PLANNING,
            "investment": AnalysisType.INVESTMENT_ADVICE,
            "portfolio": AnalysisType.INVESTMENT_ADVICE,
            "retirement": AnalysisType.INVESTMENT_ADVICE,
            "stocks": AnalysisType.INVESTMENT_ADVICE,
            "debt": AnalysisType.DEBT_OPTIMIZATION,
            "loan": AnalysisType.DEBT_OPTIMIZATION,
            "repayment": AnalysisType.DEBT_OPTIMIZATION,
            "education": AnalysisType.FINANCIAL_EDUCATION,
            "explain": AnalysisType.FINANCIAL_EDUCATION,
            "what": AnalysisType.FINANCIAL_EDUCATION,
            "how": AnalysisType.FINANCIAL_EDUCATION,
            "comprehensive": AnalysisType.COMPREHENSIVE,
            "general": AnalysisType.COMPREHENSIVE
        }
        
        # Check for direct matches
        for key, value in type_mapping.items():
            if key in analysis_type_str:
                return value
        
        # Keyword-based fallback
        user_input_lower = user_input.lower()
        if any(word in user_input_lower for word in ["spend", "expense", "income", "cash flow"]):
            return AnalysisType.INCOME_EXPENSE
        elif any(word in user_input_lower for word in ["budget", "save", "allocation"]):
            return AnalysisType.BUDGET_PLANNING
        elif any(word in user_input_lower for word in ["invest", "stock", "portfolio", "return"]):
            return AnalysisType.INVESTMENT_ADVICE
        elif any(word in user_input_lower for word in ["debt", "loan", "repay", "credit"]):
            return AnalysisType.DEBT_OPTIMIZATION
        elif any(word in user_input_lower for word in ["explain", "what is", "how does", "why"]):
            return AnalysisType.FINANCIAL_EDUCATION
        
        # Default to comprehensive analysis
        return AnalysisType.COMPREHENSIVE
    
    def _fallback_analysis_type(self, user_input: str) -> AnalysisType:
        """Fallback analysis type determination when LLM fails"""
        logger.warning(f"Using fallback analysis type for: {user_input}")
        
        user_input_lower = user_input.lower()
        
        # Simple keyword matching as fallback
        if any(word in user_input_lower for word in ["budget", "save", "spending plan"]):
            return AnalysisType.BUDGET_PLANNING
        elif any(word in user_input_lower for word in ["invest", "stock", "retirement"]):
            return AnalysisType.INVESTMENT_ADVICE
        elif any(word in user_input_lower for word in ["debt", "loan", "credit card"]):
            return AnalysisType.DEBT_OPTIMIZATION
        elif any(word in user_input_lower for word in ["explain", "what is", "how to"]):
            return AnalysisType.FINANCIAL_EDUCATION
        elif any(word in user_input_lower for word in ["spending", "expense", "income"]):
            return AnalysisType.INCOME_EXPENSE
        
        return AnalysisType.COMPREHENSIVE
    
    def _prepare_synthesis_data(self, user_profile: Dict[str, Any], analyses: Dict[str, Any]) -> Dict[str, str]:
        """Prepare data for synthesis by formatting and extracting key insights"""
        
        # Format user profile
        user_profile_str = self._format_user_profile_for_synthesis(user_profile)
        
        # Format analyses summary
        analyses_summary = self._format_analyses_summary(analyses)
        
        # Extract key metrics
        key_metrics = self._extract_key_metrics(analyses, user_profile)
        
        return {
            "user_profile": user_profile_str,
            "analyses_summary": analyses_summary,
            "key_metrics": key_metrics
        }
    
    def _format_user_profile_for_synthesis(self, user_profile: Dict[str, Any]) -> str:
        """Format user profile for synthesis prompt"""
        if not user_profile:
            return "No user profile available."
            
        lines = []
        
        # Basic info
        if user_profile.get('age'):
            lines.append(f"Age: {user_profile['age']}")
        
        # Financial snapshot
        income = user_profile.get('annual_income', 0)
        expenses = user_profile.get('monthly_expenses', 0) * 12
        savings = user_profile.get('savings', 0)
        
        lines.append(f"Annual Income: ${income:,.2f}")
        lines.append(f"Annual Expenses: ${expenses:,.2f}")
        lines.append(f"Current Savings: ${savings:,.2f}")
        
        # Debt summary
        debts = user_profile.get('debts', [])
        if debts:
            total_debt = sum(debt.get('balance', 0) for debt in debts)
            lines.append(f"Total Debt: ${total_debt:,.2f}")
        
        # Goals
        goals = user_profile.get('financial_goals', [])
        if goals:
            goal_lines = []
            for goal in goals:
                goal_lines.append(f"  - {goal.get('name', 'Goal')}: ${goal.get('target', 0):,.2f} in {goal.get('timeline_months', 0)} months")
            lines.append("Financial Goals:\n" + "\n".join(goal_lines))
        
        return "\n".join(lines)
    
    def _format_analyses_summary(self, analyses: Dict[str, Any]) -> str:
        """Format analyses into a concise summary for synthesis"""
        summary_parts = []
        
        for analysis_type, analysis_data in analyses.items():
            if analysis_data and not analysis_data.get('error'):
                # Extract key insights from each analysis
                key_insight = self._extract_key_insight(analysis_type, analysis_data)
                if key_insight:
                    summary_parts.append(f"• {analysis_type.replace('_', ' ').title()}: {key_insight}")
        
        return "\n".join(summary_parts) if summary_parts else "No detailed analyses available"
    
    def _extract_key_insight(self, analysis_type: str, analysis_data: Dict[str, Any]) -> str:
        """Extract the most important insight from each analysis"""
        try:
            if analysis_type == "income_analysis":
                net_cash_flow = analysis_data.get('summary_metrics', {}).get('net_cash_flow', 0)
                return f"Net cash flow: ${net_cash_flow:,.2f} monthly"
            
            elif analysis_type == "budget_plan":
                savings_target = analysis_data.get('savings_target', 0)
                return f"Recommended savings: ${savings_target:,.2f} monthly"
            
            elif analysis_type == "investment_advice":
                risk_profile = analysis_data.get('risk_profile', 'moderate')
                return f"Risk-appropriate {risk_profile} portfolio"
            
            elif analysis_type == "debt_optimization":
                strategy = analysis_data.get('recommended_strategy', {}).get('recommended_method', 'snowball')
                return f"Optimal strategy: {strategy} method"
            
            elif analysis_type == "financial_education":
                return "Concept explanation provided"
            
            return "Key insights available"
            
        except Exception as e:
            logger.warning(f"Error extracting key insight for {analysis_type}: {str(e)}")
            return "Analysis completed"
    
    def _extract_key_metrics(self, analyses: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
        """Extract and format key financial metrics"""
        metrics = []
        
        # Income metrics
        if "income_analysis" in analyses:
            income_data = analyses["income_analysis"]
            net_cash_flow = income_data.get('summary_metrics', {}).get('net_cash_flow', 0)
            savings_rate = income_data.get('summary_metrics', {}).get('savings_rate', 0)
            
            if net_cash_flow:
                metrics.append(f"Monthly Net Cash Flow: ${net_cash_flow:,.2f}")
            if savings_rate:
                metrics.append(f"Savings Rate: {savings_rate:.1f}%")
        
        # Budget metrics
        if "budget_plan" in analyses:
            budget_data = analyses["budget_plan"]
            savings_target = budget_data.get('savings_target', 0)
            if savings_target:
                metrics.append(f"Monthly Savings Target: ${savings_target:,.2f}")
        
        # Debt metrics
        if user_profile:
            debts = user_profile.get('debts', [])
            if debts and "debt_optimization" in analyses:
                debt_data = analyses["debt_optimization"]
                total_debt = debt_data.get('current_debt_situation', {}).get('total_debt', 0)
                if total_debt:
                    metrics.append(f"Total Debt: ${total_debt:,.2f}")
        
        return "\n".join(metrics) if metrics else "Key metrics being calculated..."
    
    def _format_final_output(self, raw_plan: str, analyses: Dict[str, Any]) -> str:
        """Format the final synthesized plan with proper structure"""
        
        # Add header and analysis sources
        header = "🎯 YOUR COMPREHENSIVE FINANCIAL PLAN\n"
        header += "=" * 60 + "\n\n"
        
        # Add analysis sources footnote
        sources = []
        for analysis_type in analyses.keys():
            pretty_name = analysis_type.replace('_', ' ').title()
            sources.append(pretty_name)
        
        if sources:
            footer = f"\n\n📊 Analysis based on: {', '.join(sources)}"
        else:
            footer = ""
        
        return header + raw_plan + footer
    
    def _create_fallback_plan(self, analyses: Dict[str, Any]) -> str:
        """Create a fallback plan when synthesis fails"""
        logger.warning("Creating fallback financial plan")
        
        plan_parts = ["I've analyzed your financial situation and here are my key recommendations:"]
        
        for analysis_type, analysis_data in analyses.items():
            if analysis_data and not analysis_data.get('error'):
                if analysis_type == "income_analysis":
                    plan_parts.append("\n💸 INCOME & EXPENSES:")
                    net_flow = analysis_data.get('summary_metrics', {}).get('net_cash_flow', 0)
                    if net_flow > 0:
                        plan_parts.append(f"• You're saving ${net_flow:,.2f} monthly - great job!")
                    else:
                        plan_parts.append(f"• You're overspending by ${abs(net_flow):,.2f} monthly - let's fix this")
                
                elif analysis_type == "budget_plan":
                    plan_parts.append("\n📊 BUDGET PLANNING:")
                    savings_target = analysis_data.get('savings_target', 0)
                    plan_parts.append(f"• Target monthly savings: ${savings_target:,.2f}")
                
                elif analysis_type == "investment_advice":
                    plan_parts.append("\n📈 INVESTMENT STRATEGY:")
                    risk_profile = analysis_data.get('risk_profile', 'moderate')
                    plan_parts.append(f"• Recommended {risk_profile} risk portfolio")
                
                elif analysis_type == "debt_optimization":
                    plan_parts.append("\n⚡ DEBT MANAGEMENT:")
                    strategy = analysis_data.get('recommended_strategy', {}).get('recommended_method', 'snowball')
                    plan_parts.append(f"• Use {strategy} method for fastest results")
        
        plan_parts.append("\n🚀 NEXT STEPS:")
        plan_parts.append("1. Review your monthly spending patterns")
        plan_parts.append("2. Set up automatic savings transfers")
        plan_parts.append("3. Create a debt repayment schedule")
        plan_parts.append("4. Start investing with your risk profile")
        
        return "\n".join(plan_parts)