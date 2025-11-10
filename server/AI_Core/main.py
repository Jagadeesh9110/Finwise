import os
import logging
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Import settings and validate API key early
from config import settings
try:
    settings.validate_api_key()
except ValueError as e:
    print(f"❌ {str(e)}")
    print("Please create a .env file with your GEMINI_API_KEY")
    exit(1)

# Now import other modules after API key validation
from graph.workflow import create_financial_workflow
from graph.state import UserProfile, FinancialGoal
from utils import setup_logging, ColorFormatter

def create_sample_user_profile() -> UserProfile:
    """Create a sample user profile for demonstration"""
    
    goals = [
        FinancialGoal(
            name="Emergency Fund", 
            target=15000, 
            timeline_months=12, 
            priority=1
        ),
        FinancialGoal(
            name="Down Payment", 
            target=50000, 
            timeline_months=36, 
            priority=2
        ),
        FinancialGoal(
            name="Retirement Savings", 
            target=100000, 
            timeline_months=60, 
            priority=3
        )
    ]
    
    transactions = [
        {"amount": 5000, "category": "Salary", "description": "Monthly salary", "date": "2024-01-01"},
        {"amount": -1500, "category": "Rent", "description": "Apartment rent", "date": "2024-01-02"},
        {"amount": -400, "category": "Groceries", "description": "Weekly groceries", "date": "2024-01-03"},
        {"amount": -200, "category": "Utilities", "description": "Electricity bill", "date": "2024-01-04"},
        {"amount": -300, "category": "Entertainment", "description": "Dining out", "date": "2024-01-05"},
        {"amount": -100, "category": "Transportation", "description": "Gas", "date": "2024-01-06"}
    ]
    
    debts = [
        {"name": "Student Loan", "balance": 25000, "interest_rate": 4.5, "minimum_payment": 300},
        {"name": "Credit Card", "balance": 5000, "interest_rate": 18.9, "minimum_payment": 150}
    ]
    
    return UserProfile(
        age=30,
        annual_income=75000,
        monthly_expenses=3500,
        savings=10000,
        debts=debts,
        financial_goals=goals,
        risk_tolerance="moderate",
        investment_experience="beginner",
        time_horizon=10,
        transactions=transactions
    )

def main():
    """Main application function"""
    
    # Setup logging
    logger = setup_logging()
    
    print(ColorFormatter.header("🤖 FinWise AI Financial Assistant"))
    print("=" * 60)
    
    # Initialize the financial workflow
    print(ColorFormatter.info("Initializing financial agents..."))
    try:
        workflow = create_financial_workflow()
        
        # Create sample user profile
        user_profile = create_sample_user_profile()
        
        print(ColorFormatter.success("\nWelcome to your AI Financial Assistant!"))
        print(ColorFormatter.info("I can help you with:"))
        print("• Income and expense analysis")
        print("• Budget planning and optimization") 
        print("• Investment advice and portfolio management")
        print("• Debt optimization and repayment strategies")
        print("• Financial education and concept explanations")
        print("• Comprehensive financial planning")
        
        print(ColorFormatter.warning("\nSample User Profile Loaded:"))
        print(f"• Age: {user_profile.age}")
        print(f"• Income: ${user_profile.annual_income:,.2f}/year")
        print(f"• Savings: ${user_profile.savings:,.2f}")
        print(f"• Goals: {[goal.name for goal in user_profile.financial_goals]}")
        
        while True:
            print("\n" + "=" * 60)
            user_input = input(f"\n{ColorFormatter.info('How can I help you with your finances?')} (type 'quit' to exit)\n> ")
            
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print(ColorFormatter.success("Thank you for using FinWise Financial Assistant. Goodbye!"))
                break
                
            if not user_input.strip():
                continue
                
            print(ColorFormatter.info("\n🧠 Analyzing your request with AI agents..."))
            
            try:
                # Process request through multi-agent system
                result = workflow.process_request(user_input, user_profile.model_dump())
                
                final_output = result.get("final_output", "I apologize, but I couldn't generate a response.")
                
                print(ColorFormatter.success("\n📊 Your Financial Analysis:"))
                print("=" * 60)
                print(final_output)
                print("=" * 60)
                
                # Show which agents were involved
                involved_agents = []
                if result.get("income_analysis"):
                    involved_agents.append("💰 Income Analyzer")
                if result.get("budget_plan"):
                    involved_agents.append("📝 Budget Planner") 
                if result.get("investment_advice"):
                    involved_agents.append("📈 Investment Advisor")
                if result.get("debt_optimization"):
                    involved_agents.append("⚡ Debt Optimizer")
                if result.get("financial_education"):
                    involved_agents.append("🎓 Financial Educator")
                
                if involved_agents:
                    print(ColorFormatter.info(f"\nSpecialized agents involved: {', '.join(involved_agents)}"))
                
            except Exception as e:
                print(ColorFormatter.error(f"❌ Sorry, I encountered an error: {str(e)}"))
                logger.error(f"Application error: {str(e)}")
                print("Please try again with a different question.")
                
    except Exception as e:
        print(ColorFormatter.error(f"❌ Failed to initialize financial agents: {str(e)}"))
        logger.error(f"Initialization error: {str(e)}")

if __name__ == "__main__":
    main()