# This agent will be a "coach." It will take the factual data (like the output from the IncomeExpenseAgent)
# , compare it to the user's goals, and generate a proactive, motivational plan.

import os
import logging
import json
from typing import Dict, Any, Optional
from langchain.schema import HumanMessage, SystemMessage
from langchain_google_genai import GoogleGenerativeAI

from tools.budgeting_tools import create_budget_scenarios

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class BudgetPlannerAgent:
    """
    A proactive agent that functions as a financial coach. It creates
    budget plans and provides motivational, actionable advice.
    """
    def __init__(self):
        self.llm = GoogleGenerativeAI(
            model="gemini-1.5-pro-latest",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.5 # Slightly more creative for a "coach"
        )

    async def run_analysis(self, income: float, categorized_expenses: Dict[str, float], savings_goal: float) -> str:
        """
        Runs the full budget planning pipeline.
        1. Gets a structured data report from the budgeting tool.
        2. Asks the LLM to act as a coach and interpret the data for the user.
        3. Returns a final, comprehensive report.
        """
        logging.info("Starting budget plan analysis...")
        try:
            #  Get the structured data report from our tool
            data_report_dict = create_budget_scenarios(income, categorized_expenses, savings_goal)
            
            # Convert dict to a JSON string for the LLM
            data_report_json = json.dumps(data_report_dict, indent=2)

            # Define a clear "coach" task for the LLM 
            system_prompt = f"""
            You are 'Buddy', a friendly, encouraging, and practical budgeting coach.
            Your task is to analyze the following JSON data report and turn it into a 
            motivational, easy-to-understand plan for the user.

            Here is the data report:
            {data_report_json}

            Your response must:
            1.  Start with a positive and encouraging tone.
            2.  Explain the '50/30/20 Rule' simply, using the target numbers from the report.
            3.  Analyze the user's "Current Situation" (from the 'summary' section).
            4.  Present the 'actionable_suggestions' as a clear, step-by-step "Game Plan".
            5.  Be empathetic, focusing on empowerment, not criticism.
            """

            # Get the AI-generated narrative 
            llm_response = await self.llm.ainvoke(
                [SystemMessage(content=system_prompt),
                 HumanMessage(content="Please give me my budgeting game plan based on that data.")]
            )
            ai_narrative = llm_response.content
            
            logging.info("AI budgeting narrative generated successfully.")
            

            return ai_narrative

        except Exception as e:
            logging.error(f"Error during budget analysis: {e}")
            return "I'm sorry, an error occurred while creating your budget plan. Please try again."