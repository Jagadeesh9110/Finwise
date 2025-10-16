import os 
import logging
from typing import List,Dict, Optional
from langchain.schema import HumanMessage, AIMessage, SystemMessage 
from langchain_google_genai import GoogleGenerativeAI

from tools.transaction_tools import analyze_transactions

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class IncomeExpenseAgent:
    """
    A proactive agent that analyzes financial transactions to provide data-driven
    and AI-augmented insights for the user.
    """
    def __init__(self):
        self.llm = GoogleGenerativeAI(model="gemini-1.5-pro-latest", 
                    google_api_key=os.getenv("GOOGLE_API_KEY"),
                    temperature=0.4,
                    )
        async def run_analysis(self, transactions: list[dict], previous_month_avg: Optional[Dict[str, float]] = None) -> str:
            """
             Runs the full analysis pipeline on the provided transactions.
             1. Gets a data-driven report from the TransactionAnalsisTool.
             2. Enhances the report with AI-generated insights.
             3.Asks the LLM to add a human-friendly narrative summary
             4. Returns the final Comprehensive Report.
            """
            logging.info("Starting transaction analysis...")
            try:
                if previous_month_avg is None:
                    previous_month_avg = {}
                 # --- Step 1: Get the 100% accurate, data-driven report from our tool ---
                data_report = analyze_transactions(transactions, previous_month_avg)

                # --- Step 2: Define a clear task for the LLM ---
                System_prompt= f"""
                You are 'Finsight', an empathetic financial analyst bot.
                Your task is to add a brief, encouraging, and insightful narrative summary to the
                following data report.

                Analyze the report and write a 2-3 sentence summary that:
                1. Starts with a positive and encouraging tone.
                2. Highlights the single most important insight (good or bad) from the "Proactive Insights" section.
                3. Concludes with a brief piece of actionable advice.

                Here is the data-driven report:
                ---
                {data_report}
                ---
                Your Narrative Summary:
                """

                # --- Step 3: Get the AI-generated narrative ---
                llm_response=self.llm.generate_messages(
                    [SystemMessage(content=System_prompt),
                    HumanMessage(content="Please provide the narrative summary as per the instructions above.")] 
                )
                ai_narrative = llm_response.content
                logging.info("AI narrative generated successfully.")

                # --- Step 4: Combine the data report with the AI narrative ---
                final_report = f"{data_report}\n\n### Narrative Summary:\n{ai_narrative}"
                logging.info("Transaction analysis completed successfully.")
                return final_report
            except Exception as e:
                logging.error(f"Error during transaction analysis: {e}")
                return "I'm sorry, an error occurred while analyzing your transactions. Please try again."
