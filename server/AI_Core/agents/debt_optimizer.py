from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Tuple
import logging
from datetime import datetime, timedelta

from config import settings
from tools import FinancialCalculators
from utils import format_currency, ColorFormatter

logger = logging.getLogger(__name__)

class DebtOptimizerAgent:
    """Optimizes debt repayment strategies and minimizes interest costs"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("optimizer")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.calculators = FinancialCalculators()
        
        self.system_prompt = SystemMessage(content="""
        You are a debt management expert specializing in optimizing repayment strategies.

        Your expertise:
        - Debt snowball vs avalanche method optimization
        - Interest cost minimization strategies
        - Debt consolidation evaluation
        - Cash flow optimization for debt repayment
        - Behavioral psychology in debt payoff

        Provide mathematically optimal strategies while considering psychological factors.
        Always calculate total interest savings and payoff timelines.
        """)
    
    def optimize_repayment(self, debts: List[Dict], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create optimized debt repayment plan"""
        logger.info(f"Optimizing repayment for {len(debts)} debts")
        
        try:
            if not debts:
                return self._get_no_debt_response()
            
            # Analyze current debt situation
            debt_analysis = self._analyze_debt_situation(debts, user_profile)
            
            # Calculate different repayment strategies
            snowball_plan = self._calculate_snowball_method(debts, user_profile)
            avalanche_plan = self._calculate_avalanche_method(debts, user_profile)
            
            # Determine optimal strategy
            optimal_strategy = self._determine_optimal_strategy(snowball_plan, avalanche_plan, user_profile)
            
            # Generate consolidation recommendations
            consolidation_analysis = self._analyze_consolidation_options(debts, user_profile)
            
            # Generate detailed recommendations
            recommendations = self._generate_debt_recommendations(
                debts, debt_analysis, optimal_strategy, consolidation_analysis, user_profile
            )
            
            return {
                "current_debt_situation": debt_analysis,
                "snowball_method": snowball_plan,
                "avalanche_method": avalanche_plan,
                "recommended_strategy": optimal_strategy,
                "consolidation_options": consolidation_analysis,
                "detailed_recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Error optimizing debt repayment: {str(e)}")
            return {"error": str(e), "detailed_recommendations": "Unable to create debt optimization plan."}
    
    def _analyze_debt_situation(self, debts: List[Dict], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current debt situation"""
        total_debt = sum(debt.get('balance', 0) for debt in debts)
        total_minimum_payments = sum(debt.get('minimum_payment', 0) for debt in debts)
        weighted_interest_rate = sum(debt.get('balance', 0) * debt.get('interest_rate', 0) for debt in debts) / total_debt if total_debt > 0 else 0
        
        monthly_income = user_profile.get('annual_income', 0) / 12
        debt_to_income = (total_minimum_payments / monthly_income * 100) if monthly_income > 0 else 0
        
        return {
            "total_debt": total_debt,
            "total_minimum_payments": total_minimum_payments,
            "weighted_interest_rate": round(weighted_interest_rate, 2),
            "debt_to_income_ratio": round(debt_to_income, 2),
            "number_of_debts": len(debts),
            "high_interest_debts": len([d for d in debts if d.get('interest_rate', 0) > 10])
        }
    
    def _calculate_snowball_method(self, debts: List[Dict], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate debt snowball repayment plan"""
        # Sort by balance (smallest first)
        sorted_debts = sorted(debts, key=lambda x: x['balance'])
        
        extra_payment = self._calculate_extra_payment_capacity(user_profile)
        current_payments = {debt.get('name'): debt.get('minimum_payment', 0) for debt in sorted_debts}
        
        payoff_plan = []
        total_interest = 0
        current_month = 0
        
        for i, debt in enumerate(sorted_debts):
            balance = debt.get('balance', 0)
            interest_rate = debt.get('interest_rate', 0) / 100 / 12
            min_payment = debt.get('minimum_payment', 0)
            
            # Add extra payment from previous debts
            if i > 0:
                extra_payment += sorted_debts[i-1].get('minimum_payment', 0)
            
            months = 0
            interest_paid = 0
            
            while balance > 0 and months < 600:  # 50-year safety limit
                monthly_interest = balance * interest_rate
                total_payment = min_payment + extra_payment
                
                # Ensure we don't overpay
                if total_payment > balance + monthly_interest:
                    total_payment = balance + monthly_interest
                
                interest_paid += monthly_interest
                balance = balance + monthly_interest - total_payment
                months += 1
            
            payoff_plan.append({
                "debt_name": debt.get('name'),
                "balance": debt.get('balance', 0),
                "payoff_months": months,
                "total_interest": round(interest_paid, 2),
                "payoff_order": i + 1
            })
            
            total_interest += interest_paid
            current_month += months
        
        return {
            "payoff_plan": payoff_plan,
            "total_payoff_time_months": current_month,
            "total_interest_paid": round(total_interest, 2),
            "completion_date": self._calculate_completion_date(current_month)
        }
    
    def _calculate_avalanche_method(self, debts: List[Dict], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate debt avalanche repayment plan"""
        # Sort by interest rate (highest first)
        sorted_debts = sorted(debts, key=lambda x: x.get('interest_rate', 0), reverse=True)
        
        extra_payment = self._calculate_extra_payment_capacity(user_profile)
        total_interest = 0
        current_month = 0
        
        payoff_plan = []
        active_debts = sorted_debts.copy()
        
        while active_debts and current_month < 600:
            # Pay minimum on all debts except the highest interest
            total_monthly_payment = sum(debt.get('minimum_payment', 0) for debt in active_debts) + extra_payment
            
            # Focus on highest interest debt
            focus_debt = active_debts[0]
            focus_payment = total_monthly_payment - sum(
                debt.get('minimum_payment', 0) for debt in active_debts[1:]
            )
            
            # Process focus debt payment
            balance = focus_debt.get('balance', 0)
            interest_rate = focus_debt.get('interest_rate', 0) / 100 / 12
            monthly_interest = balance * interest_rate
            
            if focus_payment > balance + monthly_interest:
                focus_payment = balance + monthly_interest
            
            balance = balance + monthly_interest - focus_payment
            total_interest += monthly_interest
            
            if balance <= 0:
                # Debt paid off
                payoff_plan.append({
                    "debt_name": focus_debt.get('name'),
                    "balance": focus_debt.get('balance', 0),
                    "payoff_months": current_month + 1,
                    "total_interest": round(total_interest, 2),
                    "payoff_order": len(payoff_plan) + 1
                })
                active_debts.pop(0)
            
            current_month += 1
        
        return {
            "payoff_plan": payoff_plan,
            "total_payoff_time_months": current_month,
            "total_interest_paid": round(total_interest, 2),
            "completion_date": self._calculate_completion_date(current_month)
        }
    
    def _determine_optimal_strategy(self, snowball: Dict[str, Any], avalanche: Dict[str, Any],
                                  user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Determine the optimal repayment strategy"""
        # Compare strategies
        snowball_time = snowball.get('total_payoff_time_months', 0)
        avalanche_time = avalanche.get('total_payoff_time_months', 0)
        snowball_interest = snowball.get('total_interest_paid', 0)
        avalanche_interest = avalanche.get('total_interest_paid', 0)
        
        # Consider behavioral factors
        debt_count = len(user_profile.get('debts', []))
        user_psychology = user_profile.get('risk_tolerance', 'moderate')
        
        # Decision logic
        if avalanche_interest < snowball_interest and avalanche_time <= snowball_time:
            optimal = "avalanche"
            savings = snowball_interest - avalanche_interest
        else:
            optimal = "snowball"
            savings = avalanche_interest - snowball_interest
        
        # Adjust for behavioral factors
        if debt_count > 3 and user_psychology == 'conservative':
            optimal = "snowball"  # Quick wins for motivation
        
        return {
            "recommended_method": optimal,
            "interest_savings": round(savings, 2),
            "time_savings_months": abs(snowball_time - avalanche_time),
            "rationale": self._get_strategy_rationale(optimal, savings)
        }
    
    def _analyze_consolidation_options(self, debts: List[Dict], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze debt consolidation options"""
        total_debt = sum(debt.get('balance', 0) for debt in debts)
        weighted_rate = sum(debt.get('balance', 0) * debt.get('interest_rate', 0) for debt in debts) / total_debt if total_debt > 0 else 0
        
        consolidation_options = []
        
        # Personal loan option
        if total_debt > 5000:
            personal_loan_rate = max(6.0, weighted_rate - 2)  # Assume 2% improvement
            consolidation_options.append({
                "type": "Personal Loan",
                "estimated_rate": personal_loan_rate,
                "potential_savings": self._calculate_consolidation_savings(debts, personal_loan_rate),
                "eligibility": "Good credit required",
                "considerations": "Fixed payments, no collateral needed"
            })
        
        # Balance transfer option
        high_interest_debts = [d for d in debts if d.get('interest_rate', 0) > 15]
        if high_interest_debts:
            consolidation_options.append({
                "type": "Balance Transfer Card",
                "estimated_rate": 0.0,  # Introductory 0% rate
                "potential_savings": self._calculate_consolidation_savings(high_interest_debts, 0.0),
                "eligibility": "Good to excellent credit",
                "considerations": "Introductory period only, transfer fees may apply"
            })
        
        return {
            "options": consolidation_options,
            "current_weighted_rate": round(weighted_rate, 2),
            "recommended": len(consolidation_options) > 0 and weighted_rate > 8.0
        }
    
    def _calculate_extra_payment_capacity(self, user_profile: Dict[str, Any]) -> float:
        """Calculate available extra payment capacity"""
        income = user_profile.get('annual_income', 0) / 12
        expenses = user_profile.get('monthly_expenses', 0)
        savings_goal = user_profile.get('savings', 0) * 0.1  # Assume 10% of savings can be redirected
        
        return max(100, min(income * 0.15, (income - expenses) * 0.5, savings_goal))
    
    def _calculate_completion_date(self, months: int) -> str:
        """Calculate estimated completion date"""
        return (datetime.now() + timedelta(days=months * 30)).strftime("%B %Y")
    
    def _calculate_consolidation_savings(self, debts: List[Dict], new_rate: float) -> float:
        """Calculate potential interest savings from consolidation"""
        current_interest = sum(
            debt.get('balance', 0) * debt.get('interest_rate', 0) / 100 
            for debt in debts
        )
        new_interest = sum(debt.get('balance', 0) for debt in debts) * new_rate / 100
        
        return max(0, current_interest - new_interest)
    
    def _get_strategy_rationale(self, method: str, savings: float) -> str:
        """Get rationale for chosen strategy"""
        rationales = {
            "snowball": f"Psychological motivation from quick wins outweighs ${savings:,.2f} in potential interest savings",
            "avalanche": f"Mathematically optimal saving ${savings:,.2f} in interest costs"
        }
        return rationales.get(method, "Balanced approach considering both mathematical and psychological factors")
    
    def _get_no_debt_response(self) -> Dict[str, Any]:
        """Return response for users with no debt"""
        return {
            "current_debt_situation": {"total_debt": 0, "debt_to_income_ratio": 0},
            "recommended_strategy": {"recommended_method": "none", "rationale": "No outstanding debts to optimize"},
            "detailed_recommendations": "Congratulations! You have no outstanding debts. Focus on building your savings and investments."
        }
    
    def _generate_debt_recommendations(self, debts: List[Dict], analysis: Dict[str, Any],
                                     strategy: Dict[str, Any], consolidation: Dict[str, Any],
                                     user_profile: Dict[str, Any]) -> str:
        """Generate detailed debt recommendations using LLM"""
        
        prompt = f"""
        Create a comprehensive debt optimization plan based on:
        
        CURRENT DEBT SITUATION:
        - Total Debt: {format_currency(analysis.get('total_debt', 0))}
        - Weighted Interest Rate: {analysis.get('weighted_interest_rate', 0)}%
        - Debt-to-Income Ratio: {analysis.get('debt_to_income_ratio', 0)}%
        - Number of Debts: {analysis.get('number_of_debts', 0)}
        
        RECOMMENDED STRATEGY: {strategy.get('recommended_method', 'snowball').upper()} Method
        - Rationale: {strategy.get('rationale', '')}
        - Interest Savings: {format_currency(strategy.get('interest_savings', 0))}
        
        CONSOLIDATION ANALYSIS:
        {f"Recommended: {consolidation.get('recommended', False)}" + chr(10) + chr(10).join(f"- {option['type']}: {option['estimated_rate']}% rate, Save {format_currency(option['potential_savings'])}" for option in consolidation.get('options', [])) if consolidation.get('options') else "No consolidation options recommended"}
        
        USER PROFILE:
        - Monthly Income: {format_currency(user_profile.get('annual_income', 0) / 12)}
        - Risk Tolerance: {user_profile.get('risk_tolerance', 'moderate')}
        
        Please provide:
        1. Step-by-step repayment instructions
        2. Monthly payment allocations
        3. Timeline expectations
        4. Cash flow management tips
        5. Behavioral strategies for staying motivated
        6. Warning signs and when to seek help
        7. Progress tracking methods
        
        Be encouraging yet realistic about the journey ahead.
        """
        
        response = self.llm.invoke([
            self.system_prompt,
            HumanMessage(content=prompt)
        ])
        
        return response.content