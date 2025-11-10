from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Optional
import logging
import re

from config import settings
from utils import ColorFormatter

logger = logging.getLogger(__name__)

class FinancialEducatorAgent:
    """Provides financial education and explains complex concepts in simple terms"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("educator")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.system_prompt = SystemMessage(content="""
        You are a patient, knowledgeable financial educator who makes complex concepts accessible.

        Your teaching philosophy:
        - Use simple, clear language without financial jargon
        - Provide relatable analogies and real-world examples
        - Break down complex ideas into digestible pieces
        - Connect concepts to the user's personal situation
        - Be encouraging and non-judgmental

        Always start with the basics and build up to more complex ideas.
        Use the "teach a 12-year-old" test for clarity.
        """)
        
        # Common financial concepts database
        self.common_concepts = {
            "compound interest": {
                "level": "basic",
                "keywords": ["compound", "interest", "savings", "growth"],
                "example": "Like a snowball rolling down a hill, getting bigger as it picks up more snow"
            },
            "diversification": {
                "level": "intermediate", 
                "keywords": ["diversify", "portfolio", "eggs", "basket", "risk"],
                "example": "Don't put all your eggs in one basket - spread your investments"
            },
            "asset allocation": {
                "level": "intermediate",
                "keywords": ["asset", "allocation", "stocks", "bonds", "mix"],
                "example": "Like a recipe with different ingredients in the right proportions"
            },
            "risk tolerance": {
                "level": "basic",
                "keywords": ["risk", "tolerance", "comfort", "sleep", "night"],
                "example": "How much market ups and downs you can handle without losing sleep"
            },
            "emergency fund": {
                "level": "basic", 
                "keywords": ["emergency", "fund", "rainy", "day", "savings"],
                "example": "Like a financial airbag for unexpected life events"
            }
        }
    
    def explain_concept(self, user_input: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Explain financial concepts based on user query"""
        logger.info(f"Explaining financial concept: {user_input[:100]}...")
        
        try:
            # Extract the main concept from user input
            concept = self._extract_concept(user_input)
            user_context = self._get_user_context(user_profile)
            
            # Generate explanation tailored to user's level
            explanation = self._generate_explanation(concept, user_input, user_context)
            
            return {
                "concept": concept,
                "explanation": explanation,
                "user_context": user_context,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error explaining concept: {str(e)}")
            return {
                "error": str(e),
                "explanation": "I apologize, but I'm having trouble explaining that concept right now. Please try rephrasing your question.",
                "success": False
            }
    
    def _identify_concept_with_llm(self, user_input: str) -> str:
        """Use LLM to identify the financial concept being asked about"""
        prompt = f"""
        The user asked: "{user_input}"
        
        What specific financial concept are they asking about? 
        Return only the concept name (1-3 words maximum).
        
        Common financial concepts include:
        - Compound interest
        - Diversification  
        - Asset allocation
        - Risk tolerance
        - Emergency fund
        - Budgeting
        - Investing
        - Debt management
        - Retirement planning
        - Tax optimization
        - Credit scores
        - Insurance
        - Inflation
        - Stocks/bonds
        - Mutual funds/ETFs
        """
        
        response = self.llm.invoke([
            SystemMessage(content="Identify the financial concept in the user's question. Return only the concept name."),
            HumanMessage(content=prompt)
        ])
        
        return response.content.strip().lower()
    
    def _get_user_context(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant user context for personalized explanations"""
        return {
            "age": user_profile.get('age', 'unknown'),
            "income_level": self._categorize_income(user_profile.get('annual_income', 0)),
            "financial_goals": user_profile.get('financial_goals', []),
            "investment_experience": user_profile.get('investment_experience', 'beginner'),
            "risk_tolerance": user_profile.get('risk_tolerance', 'moderate')
        }
    
    def _categorize_income(self, income: float) -> str:
        """Categorize income level for context-appropriate examples"""
        if income == 0:
            return "unknown"
        elif income < 30000:
            return "low"
        elif income < 75000:
            return "medium"
        elif income < 150000:
            return "high"
        else:
            return "very_high"
    
    def _generate_explanation(self, concept: str, original_question: str, 
                            user_context: Dict[str, Any]) -> str:
        """Generate a personalized explanation using LLM"""
        
        prompt = f"""
        The user asked: "{original_question}"
        
        They want to understand: {concept}
        
        USER CONTEXT:
        - Age: {user_context.get('age', 'Not specified')}
        - Financial Experience: {user_context.get('investment_experience', 'beginner')}
        - Income Level: {user_context.get('income_level', 'unknown')}
        - Risk Tolerance: {user_context.get('risk_tolerance', 'moderate')}
        
        Please provide a clear, engaging explanation that:
        
        1. STARTS WITH A SIMPLE DEFINITION (1-2 sentences maximum)
        2. USES A RELATABLE ANALOGY from everyday life
        3. EXPLAINS WHY IT MATTERS for their personal finances
        4. PROVIDES A CONCRETE EXAMPLE with numbers they can understand
        5. CONNECTS TO THEIR SPECIFIC SITUATION based on their context
        6. HIGHLIGHTS KEY TAKEAWAYS and actionable next steps
        7. WARNS ABOUT COMMON MISCONCEPTIONS or pitfalls to avoid
        
        Make it conversational and encouraging. Use bullet points for clarity when helpful.
        Adjust the complexity based on their experience level.
        """
        
        response = self.llm.invoke([
            self.system_prompt,
            HumanMessage(content=prompt)
        ])
        
        return response.content
    
    def provide_learning_path(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create a personalized financial learning path"""
        experience_level = user_profile.get('investment_experience', 'beginner')
        goals = user_profile.get('financial_goals', [])
        
        learning_path = self._create_learning_path(experience_level, goals)
        recommended_resources = self._recommend_resources(experience_level, goals)
        
        return {
            "learning_path": learning_path,
            "recommended_resources": recommended_resources,
            "estimated_timeline": self._estimate_timeline(experience_level),
            "next_steps": self._get_immediate_next_steps(experience_level)
        }
    
    def _create_learning_path(self, experience_level: str, goals: List[Dict]) -> List[Dict[str, str]]:
        """Create personalized learning path"""
        
        base_topics = {
            "beginner": [
                {"topic": "Basic Budgeting", "description": "Learn to track income and expenses", "time": "1 week"},
                {"topic": "Emergency Funds", "description": "Understand why and how to build safety nets", "time": "1 week"},
                {"topic": "Debt Management", "description": "Strategies for paying down debt efficiently", "time": "2 weeks"},
                {"topic": "Introduction to Saving", "description": "Different types of savings accounts and goals", "time": "1 week"}
            ],
            "intermediate": [
                {"topic": "Investment Basics", "description": "Stocks, bonds, and basic portfolio construction", "time": "2 weeks"},
                {"topic": "Retirement Planning", "description": "401(k), IRAs, and compound growth", "time": "2 weeks"},
                {"topic": "Risk Management", "description": "Understanding and managing financial risks", "time": "1 week"},
                {"topic": "Tax Efficiency", "description": "Basic tax strategies for investing", "time": "2 weeks"}
            ],
            "expert": [
                {"topic": "Advanced Portfolio Theory", "description": "Modern portfolio theory and optimization", "time": "3 weeks"},
                {"topic": "Tax-Loss Harvesting", "description": "Advanced tax optimization strategies", "time": "2 weeks"},
                {"topic": "Alternative Investments", "description": "Real estate, commodities, and other assets", "time": "2 weeks"},
                {"topic": "Estate Planning", "description": "Wealth transfer and legacy planning", "time": "2 weeks"}
            ]
        }
        
        path = base_topics.get(experience_level, base_topics["beginner"])
        
        # Add goal-specific topics
        goal_topics = self._get_goal_specific_topics(goals)
        path.extend(goal_topics)
        
        return path
    
    def _get_goal_specific_topics(self, goals: List[Dict]) -> List[Dict[str, str]]:
        """Get learning topics specific to user's goals"""
        goal_topics = []
        goal_keywords = [goal.get('name', '').lower() for goal in goals]
        
        if any('house' in goal or 'home' in goal for goal in goal_keywords):
            goal_topics.append({
                "topic": "Home Buying", 
                "description": "Mortgages, down payments, and home ownership costs",
                "time": "2 weeks"
            })
        
        if any('retire' in goal for goal in goal_keywords):
            goal_topics.append({
                "topic": "Retirement Income", 
                "description": "Withdrawal strategies and retirement income planning",
                "time": "2 weeks"
            })
        
        if any('college' in goal or 'education' in goal for goal in goal_keywords):
            goal_topics.append({
                "topic": "Education Savings", 
                "description": "529 plans and education funding strategies",
                "time": "1 week"
            })
        
        return goal_topics
    
    def _recommend_resources(self, experience_level: str, goals: List[Dict]) -> Dict[str, List[str]]:
        """Recommend learning resources based on level and goals"""
        
        resources = {
            "beginner": {
                "books": ["The Simple Path to Wealth by JL Collins", "The Total Money Makeover by Dave Ramsey"],
                "websites": ["Khan Academy Finance", "Investopedia Basic Concepts"],
                "tools": ["Mint budgeting app", "Personal Capital net worth tracker"]
            },
            "intermediate": {
                "books": ["The Bogleheads' Guide to Investing", "A Random Walk Down Wall Street"],
                "websites": ["Bogleheads Forum", "Mr. Money Mustache Blog"],
                "tools": ["Portfolio Visualizer", "FutureAdvisor"]
            },
            "expert": {
                "books": ["The Intelligent Investor", "Security Analysis"],
                "websites": ["Academic finance papers", "CFA Institute resources"],
                "tools": ["Bloomberg Terminal", "Morningstar Premium"]
            }
        }
        
        return resources.get(experience_level, resources["beginner"])
    
    def _estimate_timeline(self, experience_level: str) -> str:
        """Estimate learning timeline"""
        timelines = {
            "beginner": "3-6 months for basic financial literacy",
            "intermediate": "6-12 months for investment competence", 
            "expert": "1-2 years for advanced mastery"
        }
        return timelines.get(experience_level, "3-6 months")
    
    def _get_immediate_next_steps(self, experience_level: str) -> List[str]:
        """Get immediate next steps for the user"""
        steps = {
            "beginner": [
                "Track your spending for one week",
                "Set up a basic budget using the 50/30/20 rule",
                "Open a high-yield savings account for emergency fund"
            ],
            "intermediate": [
                "Review your current investment portfolio allocation",
                "Calculate your net worth and track it monthly",
                "Set up automatic contributions to retirement accounts"
            ],
            "expert": [
                "Conduct a comprehensive portfolio stress test",
                "Review tax optimization strategies for current year",
                "Update estate planning documents if needed"
            ]
        }
        return steps.get(experience_level, steps["beginner"])