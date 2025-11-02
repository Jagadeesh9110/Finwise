import os
import asyncio
from dotenv import load_dotenv
from agents.budget_agent import BudgetPlannerAgent

load_dotenv()

async def main():
    """
    This is the main function to test the BudgetPlannerAgent.
    """
    agent = BudgetPlannerAgent()

    # This data could come from the output of the IncomeExpenseAgent
    sample_income = 80000.0
    
    sample_categorized_expenses = {
        'Rent': 22000.0,           # Need
        'Grocery': 6000.0,         # Need
        'Transportation': 3000.0,  # Need
        'Food & Dining': 12000.0,  # Want
        'Shopping': 10000.0,       # Want
        'Entertainment': 4000.0    # Want
    }
    
    sample_savings_goal = 25000.0

    print("--- Running Budget Planner Agent Test ---")
    print(f"Input: Income (₹{sample_income}), Goal (₹{sample_savings_goal})\n")

    final_report = await agent.run_analysis(
        sample_income, 
        sample_categorized_expenses, 
        sample_savings_goal
    )

    print("\n" + "="*50)
    print("   FINAL AGENT REPORT")
    print("="*50 + "\n")
    print(final_report)

if __name__ == "__main__":
    asyncio.run(main())