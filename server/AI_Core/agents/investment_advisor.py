from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Tuple
import logging
import random

from config import settings
from tools import FinancialCalculators, RiskProfile
from graph.state import UserProfile
from utils import format_currency, ColorFormatter

logger = logging.getLogger(__name__)

class InvestmentAdvisorAgent:
    """Provides personalized investment advice and portfolio recommendations"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("advisor")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.calculators = FinancialCalculators()
        
        self.system_prompt = SystemMessage(content="""
        You are a certified investment advisor with expertise in portfolio management and financial markets.

        Your expertise:
        - Modern Portfolio Theory and asset allocation
        - Risk assessment and management
        - Tax-efficient investing strategies
        - Retirement planning and compound growth
        - Behavioral finance and investor psychology

        Provide evidence-based investment recommendations tailored to the user's risk profile and goals.
        Always emphasize diversification, long-term thinking, and risk management.
        """)
    
    def provide_advice(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Provide comprehensive investment advice"""
        logger.info("Generating investment advice for user profile")
        
        try:
            # Assess risk profile
            risk_profile = self._assess_risk_profile(user_profile)
            
            # Determine investment strategy
            strategy = self._create_investment_strategy(user_profile, risk_profile)
            
            # Create portfolio allocation
            portfolio = self._create_portfolio_allocation(risk_profile, user_profile)
            
            # Generate specific recommendations
            recommendations = self._generate_investment_recommendations(
                user_profile, risk_profile, strategy, portfolio
            )
            
            return {
                "risk_profile": risk_profile.value,
                "investment_strategy": strategy,
                "portfolio_allocation": portfolio,
                "recommendations": recommendations,
                "expected_returns": self._calculate_expected_returns(portfolio, risk_profile),
                "time_horizon": user_profile.get('time_horizon', 10)
            }
            
        except Exception as e:
            logger.error(f"Error generating investment advice: {str(e)}")
            return {"error": str(e), "recommendations": "Unable to generate investment advice."}
    
    def _assess_risk_profile(self, user_profile: Dict[str, Any]) -> RiskProfile:
        """Comprehensive risk profile assessment"""
        age = user_profile.get('age', 30)
        risk_tolerance = user_profile.get('risk_tolerance', 'moderate')
        investment_experience = user_profile.get('investment_experience', 'beginner')
        time_horizon = user_profile.get('time_horizon', 10)
        
        return self.calculators.assess_risk_profile(
            age=age,
            investment_experience=investment_experience,
            time_horizon=time_horizon,
            risk_tolerance=risk_tolerance
        )
    
    def _create_investment_strategy(self, user_profile: Dict[str, Any], 
                                  risk_profile: RiskProfile) -> Dict[str, Any]:
        """Create personalized investment strategy"""
        age = user_profile.get('age', 30)
        time_horizon = user_profile.get('time_horizon', 10)
        goals = user_profile.get('financial_goals', [])
        
        # Determine strategy based on risk profile and goals
        strategies = {
            RiskProfile.CONSERVATIVE: {
                "name": "Capital Preservation",
                "focus": "Low-risk income generation and principal protection",
                "approach": "Income-focused with bond heavy allocation",
                "rebalancing": "Annual rebalancing with focus on quality"
            },
            RiskProfile.MODERATE: {
                "name": "Balanced Growth",
                "focus": "Balanced approach between growth and income",
                "approach": "60-70% equities with diversified bond exposure",
                "rebalancing": "Semi-annual rebalancing with tactical adjustments"
            },
            RiskProfile.AGGRESSIVE: {
                "name": "Growth Maximization",
                "focus": "Long-term capital appreciation",
                "approach": "80-90% equities with growth focus",
                "rebalancing": "Quarterly review with strategic tilts"
            }
        }
        
        base_strategy = strategies.get(risk_profile, strategies[RiskProfile.MODERATE])
        
        # Adjust based on age and time horizon
        if age < 40 and time_horizon > 15:
            base_strategy["approach"] = "More aggressive growth orientation"
        elif age > 55:
            base_strategy["approach"] = "More conservative capital preservation"
        
        return base_strategy
    
    def _create_portfolio_allocation(self, risk_profile: RiskProfile, 
                                   user_profile: Dict[str, Any]) -> Dict[str, float]:
        """Create detailed portfolio allocation"""
        
        # Base allocations by risk profile
        base_allocations = {
            RiskProfile.CONSERVATIVE: {
                "US Stocks": 30.0,
                "International Stocks": 10.0,
                "Bonds": 45.0,
                "Real Estate": 10.0,
                "Cash": 5.0
            },
            RiskProfile.MODERATE: {
                "US Stocks": 50.0,
                "International Stocks": 20.0,
                "Bonds": 20.0,
                "Real Estate": 7.0,
                "Cash": 3.0
            },
            RiskProfile.AGGRESSIVE: {
                "US Stocks": 60.0,
                "International Stocks": 25.0,
                "Bonds": 10.0,
                "Real Estate": 3.0,
                "Cash": 2.0
            }
        }
        
        allocation = base_allocations.get(risk_profile, base_allocations[RiskProfile.MODERATE])
        
        # Adjust based on user specifics
        if user_profile.get('investment_experience') == 'expert':
            # Add alternative investments for experienced investors
            allocation["US Stocks"] -= 5.0
            allocation["Alternatives"] = 5.0
        
        return allocation
    
    def _calculate_expected_returns(self, portfolio: Dict[str, float], 
                                  risk_profile: RiskProfile) -> Dict[str, float]:
        """Calculate expected returns based on portfolio allocation"""
        
        # Historical returns by asset class (long-term averages)
        asset_returns = {
            "US Stocks": 9.0,
            "International Stocks": 7.5,
            "Bonds": 4.5,
            "Real Estate": 6.0,
            "Cash": 2.0,
            "Alternatives": 8.0
        }
        
        # Calculate weighted average return
        total_return = 0.0
        for asset, allocation in portfolio.items():
            if asset in asset_returns:
                total_return += (allocation / 100) * asset_returns[asset]
        
        # Risk-adjusted returns
        risk_adjustments = {
            RiskProfile.CONSERVATIVE: -1.0,
            RiskProfile.MODERATE: 0.0,
            RiskProfile.AGGRESSIVE: +0.5
        }
        
        adjusted_return = total_return + risk_adjustments.get(risk_profile, 0.0)
        
        return {
            "expected_annual_return": round(adjusted_return, 2),
            "inflation_adjusted_return": round(adjusted_return - 2.5, 2),  # Assuming 2.5% inflation
            "compounded_5yr": round(((1 + adjusted_return/100) ** 5 - 1) * 100, 2),
            "compounded_10yr": round(((1 + adjusted_return/100) ** 10 - 1) * 100, 2)
        }
    
    def _generate_investment_recommendations(self, user_profile: Dict[str, Any],
                                           risk_profile: RiskProfile,
                                           strategy: Dict[str, Any],
                                           portfolio: Dict[str, float]) -> str:
        """Generate detailed investment recommendations using LLM"""
        
        prompt = f"""
        Create personalized investment recommendations based on:
        
        USER PROFILE:
        - Age: {user_profile.get('age')}
        - Risk Profile: {risk_profile.value}
        - Time Horizon: {user_profile.get('time_horizon', 10)} years
        - Investment Experience: {user_profile.get('investment_experience', 'beginner')}
        
        INVESTMENT STRATEGY:
        {strategy.get('name')} - {strategy.get('focus')}
        
        PORTFOLIO ALLOCATION:
        {chr(10).join(f"- {asset}: {allocation}%" for asset, allocation in portfolio.items())}
        
        FINANCIAL GOALS:
        {chr(10).join(f"- {goal.get('name')}: {format_currency(goal.get('target', 0))}" for goal in user_profile.get('financial_goals', []))}
        
        Please provide:
        1. Specific investment vehicle recommendations (ETFs, mutual funds, etc.)
        2. Asset allocation rationale
        3. Risk management strategies
        4. Tax-efficient investing tips
        5. Rebalancing schedule and methodology
        6. Common pitfalls to avoid
        7. Monitoring and adjustment guidelines
        
        Focus on practical implementation and long-term success.
        """
        
        response = self.llm.invoke([
            self.system_prompt,
            HumanMessage(content=prompt)
        ])
        
        return response.content