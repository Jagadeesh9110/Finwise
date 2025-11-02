import os
import asyncio
from dotenv import load_dotenv
from agents.income_expense_agent import IncomeExpenseAgent


load_dotenv()  

async def main():
    """ 
    This is the main function to test the IncomeExpenseAgent.
    """
    agent=IncomeExpenseAgent()
    sample_transactions=[
        {'description': 'Salary Credited by FinWise Inc.', 'amount': 90000},
        {'description': 'Zomato: Weekly Dinner', 'amount': -1200},
        {'description': 'Amazon.in Purchase: Electronics', 'amount': -12500}, # This will be flagged as an anomaly
        {'description': 'Uber ride to airport', 'amount': -750},
        {'description': 'Netflix Subscription', 'amount': -649},
        {'description': 'Grocery run at BigBasket', 'amount': -5500},
        {'description': 'Monthly Rent Payment', 'amount': -22000},
        {'description': 'Swiggy: Lunch', 'amount': -350},
        {'description': 'Myntra Shopping Spree', 'amount': -4200},
    ]

    previous_month_avg = {
        'Food & Dining': 1800,
        'Shopping': 5000, # The current shopping is much higher
        'Transportation': 1500,
        'Rent': 22000
    }

    # The agent will call the tool and then the LLM to get the final report
    final_report= await agent.run_analysis(sample_transactions,previous_month_avg)

    print("\n" + "="*50)
    print("   FINAL AGENT REPORT")
    print("="*50 + "\n")
    print(final_report)

    if __name__=='__main__':
        asyncio.run(main())