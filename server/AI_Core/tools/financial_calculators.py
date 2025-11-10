import math
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from enum import Enum

class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class FinancialCalculators:
    """Financial calculation utilities"""
    
    @staticmethod
    def calculate_compound_interest(principal: float, rate: float, years: int, 
                                  compounding: str = "annual") -> Dict[str, float]:
        """Calculate compound interest with different compounding periods"""
        compounding_factors = {
            "annual": 1,
            "monthly": 12,
            "quarterly": 4,
            "daily": 365
        }
        
        n = compounding_factors.get(compounding, 1)
        rate_decimal = rate / 100
        amount = principal * (1 + rate_decimal/n) ** (n * years)
        interest_earned = amount - principal
        
        return {
            "final_amount": round(amount, 2),
            "interest_earned": round(interest_earned, 2),
            "total_contributions": principal
        }
    
    @staticmethod
    def calculate_loan_payment(principal: float, annual_rate: float, years: int) -> Dict[str, float]:
        """Calculate monthly loan payment using amortization formula"""
        monthly_rate = annual_rate / 100 / 12
        n_payments = years * 12
        
        if monthly_rate == 0:
            monthly_payment = principal / n_payments
        else:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** n_payments) / ((1 + monthly_rate) ** n_payments - 1)
        
        total_payment = monthly_payment * n_payments
        total_interest = total_payment - principal
        
        return {
            "monthly_payment": round(monthly_payment, 2),
            "total_interest": round(total_interest, 2),
            "total_payment": round(total_payment, 2)
        }
    
    @staticmethod
    def calculate_debt_snowball(debts: List[Dict]) -> List[Dict]:
        """Calculate debt snowball repayment plan"""
        if not debts:
            return []
            
        # Sort by balance (snowball method - smallest balance first)
        sorted_debts = sorted(debts, key=lambda x: x['balance'])
        
        # Calculate payoff timeline
        extra_payment = 100  # Assume $100 extra payment
        current_month = 0
        
        for debt in sorted_debts:
            balance = debt['balance']
            min_payment = debt.get('minimum_payment', balance * 0.03)
            interest_rate = debt.get('interest_rate', 0) / 100 / 12
            
            months = 0
            while balance > 0 and months < 600:  # 50-year safety limit
                interest = balance * interest_rate
                payment = min_payment + extra_payment
                
                if payment > balance + interest:
                    payment = balance + interest
                
                balance = balance + interest - payment
                months += 1
            
            debt['payoff_months'] = months
            debt['payoff_date'] = FinancialCalculators._calculate_future_date(months)
            current_month += months
            
            # Add extra payment to next debt
            if len(sorted_debts) > sorted_debts.index(debt) + 1:
                extra_payment += min_payment
        
        return sorted_debts
    
    @staticmethod
    def calculate_retirement_savings(current_age: int, retirement_age: int, current_savings: float,
                                   monthly_contribution: float, expected_return: float) -> Dict[str, float]:
        """Calculate retirement savings projection"""
        years_to_retirement = retirement_age - current_age
        months_to_retirement = years_to_retirement * 12
        
        monthly_rate = expected_return / 100 / 12
        future_value = current_savings * (1 + monthly_rate) ** months_to_retirement
        
        # Future value of contributions
        if monthly_contribution > 0:
            future_value += monthly_contribution * ((1 + monthly_rate) ** months_to_retirement - 1) / monthly_rate
        
        return {
            "projected_savings": round(future_value, 2),
            "total_contributions": current_savings + (monthly_contribution * months_to_retirement),
            "growth_earned": round(future_value - (current_savings + monthly_contribution * months_to_retirement), 2)
        }
    
    @staticmethod
    def assess_risk_profile(age: int, investment_experience: str, time_horizon: int, 
                          risk_tolerance: str) -> RiskProfile:
        """Assess investor risk profile"""
        score = 0
        
        # Age factor
        if age < 30:
            score += 3
        elif age < 50:
            score += 2
        else:
            score += 1
        
        # Experience factor
        experience_map = {"none": 0, "beginner": 1, "intermediate": 2, "expert": 3}
        score += experience_map.get(investment_experience.lower(), 1)
        
        # Time horizon factor
        if time_horizon > 10:
            score += 3
        elif time_horizon > 5:
            score += 2
        else:
            score += 1
        
        # Risk tolerance factor
        tolerance_map = {"low": 0, "medium": 1, "high": 2}
        score += tolerance_map.get(risk_tolerance.lower(), 1)
        
        if score >= 8:
            return RiskProfile.AGGRESSIVE
        elif score >= 5:
            return RiskProfile.MODERATE
        else:
            return RiskProfile.CONSERVATIVE
    
    @staticmethod
    def _calculate_future_date(months_from_now: int) -> str:
        """Calculate future date given months from now"""
        future_date = datetime.now() + timedelta(days=months_from_now * 30)
        return future_date.strftime("%Y-%m-%d")