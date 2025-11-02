import pandas as pd
from typing import Dict, List, Any

# Define which categories are 'Needs' vs. 'Wants'
# This is crucial for the 50/30/20 logic
NEEDS_CATEGORIES = ['rent', 'utilities', 'grocery', 'transportation', 'healthcare', 'education']
WANTS_CATEGORIES = ['food & dining', 'shopping', 'entertainment', 'travel', 'miscellaneous']

def create_budget_scenarios(income: float, categorized_expenses: Dict[str, float], savings_goal: float) -> Dict[str, Any]:
    """
    Analyzes a user's income, expenses, and savings goal to create budget scenarios.
    It performs a baseline analysis, models a 50/30/20 budget, and provides
    actionable suggestions to meet the savings goal.
    
    Returns a structured dictionary (JSON) for the agent to interpret.
    """
    
    #  Baseline Analysis 
    total_expenses = sum(categorized_expenses.values())
    current_savings = income - total_expenses
    goal_shortfall = savings_goal - current_savings

    # 50/30/20 Scenario Modeling 
    # Calculate targets
    needs_target = income * 0.50
    wants_target = income * 0.30
    savings_target = income * 0.20

    current_needs_spending = sum(v for k, v in categorized_expenses.items() if k.lower() in NEEDS_CATEGORIES)
    current_wants_spending = sum(v for k, v in categorized_expenses.items() if k.lower() in WANTS_CATEGORIES)
    
    # Generate Actionable Suggestions 
    suggestions = []
    if current_savings < savings_goal:
        suggestions.append(
            f"You're currently saving ₹{current_savings:,.2f}, but your goal is ₹{savings_goal:,.2f}. You have a shortfall of ₹{goal_shortfall:,.2f} per month."
        )
    else:
        suggestions.append(
            f"Great job! You are currently saving ₹{current_savings:,.2f}, which meets or exceeds your goal of ₹{savings_goal:,.2f}."
        )

    if current_wants_spending > wants_target:
        overspend_amount = current_wants_spending - wants_target
        suggestions.append(
            f"Your spending on 'Wants' (like shopping, dining out) is at ₹{current_wants_spending:,.2f}. "
            f"This is ₹{overspend_amount:,.2f} over the 30% target. This is the best area to focus on for savings."
        )
    
    if current_needs_spending > needs_target:
        overspend_amount = current_needs_spending - needs_target
        suggestions.append(
            f"Your spending on 'Needs' is ₹{overspend_amount:,.2f} over the 50% target. This is less common but worth reviewing."
        )
        
    report_data = {
        "summary": {
            "income": income,
            "total_expenses": total_expenses,
            "current_savings": current_savings,
            "savings_goal": savings_goal,
            "goal_shortfall": goal_shortfall if goal_shortfall > 0 else 0
        },
        "scenario_50_30_20": {
            "needs_target_50_pct": needs_target,
            "wants_target_30_pct": wants_target,
            "savings_target_20_pct": savings_target
        },
        "current_spending_analysis": {
            "current_needs_spending": current_needs_spending,
            "current_wants_spending": current_wants_spending,
            "needs_over_target": max(0, current_needs_spending - needs_target),
            "wants_over_target": max(0, current_wants_spending - wants_target)
        },
        "actionable_suggestions": suggestions
    }
    
    return report_data