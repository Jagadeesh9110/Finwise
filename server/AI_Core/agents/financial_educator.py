import logging
from typing import Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from config import settings

logger = logging.getLogger(__name__)

class FinancialEducatorAgent:
    """Explains financial concepts in a simple, easy-to-understand way."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("educator")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        self.system_prompt = SystemMessage(content="""
You are a friendly and helpful Financial Educator.
Your goal is to explain complex financial concepts in a simple, clear, and concise way.
Avoid jargon. Use analogies and real-world examples.
Do not give personalized advice, even if a user profile is provided.
If the user provides personal context, use it only to make your explanation more relevant (e.g., "Since you have a goal to buy a house...").
Format your answer with:
1. Plain-language definition
2. Why it matters
3. Simple example or analogy
4. (Optional) How it applies to the user's context if provided.
Keep it under ~250 words unless the question explicitly asks for depth.
""")

    def explain_concept(self, user_input: str, user_profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Explains a financial concept based on the user's input."""
        logger.info(f"Explaining financial concept: {user_input[:100]}...")

        try:
            # === THIS IS THE FUNCTION THAT WAS MISSING ===
            # First, extract the core concept to ensure focus
            concept = self._extract_concept(user_input)

            # Second, create the prompt to explain that concept
            profile_context = self._get_profile_context(user_profile)
            
            prompt = f"""
Please explain the following financial concept in a simple and clear way: "{concept}"

Here is some context about the user (use it for relevance, but do NOT give advice):
{profile_context}

User's original question: "{user_input}"

Provide a direct, helpful explanation.
"""
            response = self.llm.invoke([
                self.system_prompt,
                HumanMessage(content=prompt)
            ])
            
            explanation = response.content.strip()
            
            return {
                "concept_explained": concept,
                "explanation": explanation
            }

        except Exception as e:
            logger.error(f"Error explaining concept: {str(e)}")
            return {
                "error": "I apologize, but I encountered an error while trying to explain that concept.",
                "details": str(e)
            }

    def _extract_concept(self, user_input: str) -> str:
        """
        Uses an LLM call to extract the core financial concept from the user's query.
        This was the missing function.
        """
        logger.debug(f"Extracting concept from: {user_input}")
        
        # A simple LLM call to isolate the topic
        extractor_prompt = f"""
Extract the core financial topic or question from the user's input.
Respond with ONLY the topic.
Examples:
Input: "what is tax?" -> Output: "tax"
Input: "how does a 401k work?" -> Output: "401k"
Input: "Can you explain the difference between stocks and bonds?" -> Output: "difference between stocks and bonds"
Input: "I don't get inflation" -> Output: "inflation"

Input: "{user_input}"
Output:
"""
        
        # We can use a basic LLM for this simple task
        extractor_llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",  # Faster lightweight model
            temperature=0,
            google_api_key=settings.GEMINI_API_KEY
        )

        response = extractor_llm.invoke([HumanMessage(content=extractor_prompt)])
        concept = response.content.strip().replace('"', '') or user_input[:50]
        
        logger.info(f"Extracted concept: {concept}")
        return concept

    def _get_profile_context(self, user_profile: Optional[Dict[str, Any]]) -> str:
        """Creates a simple summary of the user's profile for context."""
        if user_profile is None:
            return "No personal context provided."
        
        context_parts = []
        if user_profile.get('age'):
            context_parts.append(f"They are {user_profile['age']} years old.")
        if user_profile.get('financial_goals'):
            goals = [g.get('name', 'a goal') for g in user_profile['financial_goals']]
            context_parts.append(f"Their goals include: {', '.join(goals)}.")
        if not context_parts:
            return "No personal context provided."
            
        return " ".join(context_parts)