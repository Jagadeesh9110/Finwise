import pandas as pd
from langchain.tools import tool

# Expanded categories for better accuracy
CATEGORIES = {
    'Food & Dining': ['zomato', 'swiggy', 'restaurant', 'grocery', 'bigbasket', 'lunch', 'dinner'],
    'Transportation': ['uber', 'ola', 'metro', 'taxi', 'fuel', 'petrol', 'ride'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'mall', 'store', 'purchase', 'buy'],
    'Utilities': ['electricity', 'water bill', 'internet', 'airtel', 'jio', 'phone bill'],
    'Entertainment': ['netflix', 'prime video', 'spotify', 'movie', 'concert', 'show'],
    'Rent': ['rent', 'landlord', 'apartment', 'housing'],
    'Income': ['salary', 'bonus', 'freelance', 'income', 'payment', 'credited'],
    'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medicine', 'health', 'clinic'],
    'Education': ['school', 'college', 'tuition', 'course', 'education', 'university'],
    'Travel': ['flight', 'hotel', 'booking', 'trip', 'vacation', 'travel'],
    'Miscellaneous': ['gift', 'donation', 'charity', 'miscellaneous', 'other']
}

def categorize_transaction(description):
    """Assigns a category to a transaction based on its description."""
    description = description.lower()
    for category, keywords in CATEGORIES.items():
        if any(keyword in description for keyword in keywords):
            return category
    return 'Miscellaneous'

@tool("TransactionAnalysisTool")
def analyze_transactions(transactions: list[dict], previous_month_avg: dict) -> str:
    """
    Analyzes financial transactions to categorize them, calculate key metrics, and proactively
    identify spending anomalies by comparing current spending to the previous month's average.
    """
    if not transactions:
        return "No transactions provided for analysis."
        
    df = pd.DataFrame(transactions)
    df['category'] = df['description'].apply(categorize_transaction)

    # --- Core Calculations ---
    income = df[df['category'] == 'Income']['amount'].sum()
    
    # *** BUG FIX ***: Create a separate DataFrame for expenses BEFORE summing
    expenses_df = df[df['category'] != 'Income'].copy()
    expenses_df['amount'] = expenses_df['amount'].abs() # Use absolute values for spending
    
    total_expenses = expenses_df['amount'].sum()
    savings = income - total_expenses
    spending_by_category = expenses_df.groupby('category')['amount'].sum().sort_values(ascending=False)

    # --- Proactive Insight Generation ---
    insights = []
    for category, current_spending in spending_by_category.items():
        avg_spending = previous_month_avg.get(category, 0)
        if avg_spending > 0 and current_spending > (avg_spending * 1.20):
            increase_percent = ((current_spending - avg_spending) / avg_spending) * 100
            insights.append(f"Spending in '{category}' is up by {increase_percent:.0f}% compared to last month.")
    
    top_3_categories = spending_by_category.head(3).index.tolist()
    if top_3_categories:
        insights.append(f"Your top 3 spending areas were: {', '.join(top_3_categories)}.")

    savings_rate = (savings / income) * 100 if income > 0 else 0
    
    # --- Build the Final Structured Report ---
    report = f"""
### Transaction Analysis Report

**Financial Summary:**
- **Total Income:** ₹{income:,.2f}
- **Total Expenses:** ₹{total_expenses:,.2f}
- **Net Savings:** ₹{savings:,.2f}
- **Savings Rate:** {savings_rate:.2f}%

**Proactive Insights:**
- {'\n- '.join(insights) if insights else 'No significant spending anomalies detected this month. Good job!'}

**Spending Breakdown by Category:**
{spending_by_category.to_string()}
"""
    return report