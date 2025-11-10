from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List, Optional, Tuple
import logging
from datetime import datetime, timedelta

from config import settings
from tools import DataProcessor, FinancialCalculators
from utils import format_currency, ColorFormatter

logger = logging.getLogger(__name__)

class IncomeExpenseAnalyzerAgent:
    """Comprehensive income and expense analysis with trend detection and optimization insights"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=settings.get_agent_config("analyzer")["temperature"],
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.data_processor = DataProcessor()
        self.calculators = FinancialCalculators()
        
        self.system_prompt = SystemMessage(content="""
        You are a financial analyst specializing in income and expense analysis.

        Your expertise:
        - Analyzing spending patterns and identifying trends
        - Cash flow optimization and expense reduction strategies
        - Income stream analysis and diversification opportunities
        - Financial health assessment through ratio analysis
        - Anomaly detection and fraud pattern identification

        Provide data-driven insights with specific, actionable recommendations.
        Highlight both financial strengths and areas for improvement.
        Use concrete numbers and percentages to support your analysis.
        Focus on practical steps the user can take immediately.
        """)
    
    def analyze_finances(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Comprehensive analysis of income, expenses, and financial health"""
        logger.info(f"Analyzing {len(transactions)} transactions for financial insights")
        
        try:
            if not transactions:
                return self._get_empty_analysis_response()
            
            # Process and categorize transactions
            categorized_data = self._process_transactions(transactions)
            
            # Calculate financial metrics
            financial_metrics = self._calculate_financial_metrics(categorized_data)
            
            # Detect patterns and anomalies
            patterns = self._detect_financial_patterns(categorized_data, financial_metrics)
            
            # Generate actionable insights using LLM
            insights = self._generate_comprehensive_insights(categorized_data, financial_metrics, patterns)
            
            return {
                "categorized_data": categorized_data,
                "financial_metrics": financial_metrics,
                "patterns_detected": patterns,
                "insights": insights,
                "summary_metrics": self._create_summary_metrics(financial_metrics, patterns),
                "health_score": self._calculate_financial_health_score(financial_metrics, patterns)
            }
            
        except Exception as e:
            logger.error(f"Error in financial analysis: {str(e)}")
            return self._get_error_analysis_response(str(e))
    
    def _process_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process and categorize transactions with detailed analysis"""
        
        # Basic categorization
        categorized = self.data_processor.categorize_transactions(transactions)
        
        # Advanced analysis
        spending_trends = self.data_processor.analyze_spending_trends(transactions, "monthly")
        anomalies = self.data_processor.detect_anomalies(transactions)
        
        # Calculate category percentages
        category_analysis = self._analyze_categories(categorized)
        
        # Identify recurring transactions
        recurring = self._identify_recurring_transactions(transactions)
        
        return {
            "categorized_transactions": categorized,
            "spending_trends": spending_trends,
            "anomalies": anomalies,
            "category_analysis": category_analysis,
            "recurring_transactions": recurring,
            "time_period_analysis": self._analyze_time_periods(transactions)
        }
    
    def _analyze_categories(self, categorized: Dict[str, List[Dict]]) -> Dict[str, float]:
        """Analyze spending by category with percentages"""
        category_totals = {}
        
        # Calculate total expenses
        total_expenses = sum(
            abs(t.get('amount', 0)) 
            for t in categorized.get('expenses', [])
        )
        
        # Calculate by category
        for transaction in categorized.get('expenses', []):
            category = transaction.get('category', 'Uncategorized')
            amount = abs(transaction.get('amount', 0))
            
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += amount
        
        # Convert to percentages
        category_percentages = {}
        for category, total in category_totals.items():
            if total_expenses > 0:
                percentage = (total / total_expenses) * 100
                category_percentages[category] = round(percentage, 1)
        
        return dict(sorted(category_percentages.items(), key=lambda x: x[1], reverse=True))
    
    def _identify_recurring_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """Identify recurring income and expense patterns"""
        recurring = {
            "income": [],
            "expenses": []
        }
        
        # Group by description and amount (simplified approach)
        transaction_groups = {}
        
        for transaction in transactions:
            key = f"{transaction.get('description', '').lower()}_{abs(transaction.get('amount', 0))}"
            
            if key not in transaction_groups:
                transaction_groups[key] = []
            transaction_groups[key].append(transaction)
        
        # Identify recurring patterns (appearing multiple times)
        for key, group in transaction_groups.items():
            if len(group) >= 2:  # At least 2 occurrences
                first_transaction = group[0]
                transaction_type = "income" if first_transaction.get('amount', 0) > 0 else "expenses"
                
                recurring[transaction_type].append({
                    "description": first_transaction.get('description', 'Unknown'),
                    "amount": abs(first_transaction.get('amount', 0)),
                    "frequency": "monthly",  # Simplified assumption
                    "occurrences": len(group),
                    "last_date": max(t.get('date', '') for t in group)
                })
        
        return recurring
    
    def _analyze_time_periods(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze financial patterns across different time periods"""
        if not transactions:
            return {}
        
        # Convert to DataFrame-like analysis
        dated_transactions = []
        for t in transactions:
            try:
                date = datetime.strptime(t.get('date', ''), '%Y-%m-%d')
                dated_transactions.append({
                    'date': date,
                    'amount': t.get('amount', 0),
                    'category': t.get('category', 'Unknown')
                })
            except:
                continue
        
        if not dated_transactions:
            return {}
        
        # Group by month
        monthly_data = {}
        for transaction in dated_transactions:
            month_key = transaction['date'].strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'income': 0, 'expenses': 0}
            
            if transaction['amount'] > 0:
                monthly_data[month_key]['income'] += transaction['amount']
            else:
                monthly_data[month_key]['expenses'] += abs(transaction['amount'])
        
        return {
            "monthly_breakdown": monthly_data,
            "analysis_period": f"{min(monthly_data.keys())} to {max(monthly_data.keys())}",
            "months_analyzed": len(monthly_data)
        }
    
    def _calculate_financial_metrics(self, categorized_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate comprehensive financial metrics"""
        
        categorized = categorized_data['categorized_transactions']
        
        # Basic calculations
        total_income = sum(t.get('amount', 0) for t in categorized.get('income', []) if t.get('amount', 0) > 0)
        total_expenses = sum(abs(t.get('amount', 0)) for t in categorized.get('expenses', []) if t.get('amount', 0) < 0)
        net_cash_flow = total_income - total_expenses
        
        # Advanced metrics
        savings_rate = (net_cash_flow / total_income * 100) if total_income > 0 else 0
        
        # Expense ratios
        fixed_expenses = self._calculate_fixed_expenses(categorized_data['recurring_transactions']['expenses'])
        discretionary_expenses = total_expenses - fixed_expenses
        
        fixed_expense_ratio = (fixed_expenses / total_income * 100) if total_income > 0 else 0
        discretionary_ratio = (discretionary_expenses / total_income * 100) if total_income > 0 else 0
        
        return {
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_cash_flow": round(net_cash_flow, 2),
            "savings_rate": round(savings_rate, 1),
            "fixed_expenses": round(fixed_expenses, 2),
            "discretionary_expenses": round(discretionary_expenses, 2),
            "fixed_expense_ratio": round(fixed_expense_ratio, 1),
            "discretionary_ratio": round(discretionary_ratio, 1),
            "average_monthly_income": round(total_income / max(1, len(categorized_data['time_period_analysis'].get('monthly_breakdown', {}))), 2),
            "average_monthly_expenses": round(total_expenses / max(1, len(categorized_data['time_period_analysis'].get('monthly_breakdown', {}))), 2)
        }
    
    def _calculate_fixed_expenses(self, recurring_expenses: List[Dict]) -> float:
        """Calculate total fixed monthly expenses"""
        return sum(expense.get('amount', 0) for expense in recurring_expenses)
    
    def _detect_financial_patterns(self, categorized_data: Dict[str, Any], metrics: Dict[str, float]) -> Dict[str, Any]:
        """Detect financial patterns and potential issues"""
        
        patterns = {
            "strengths": [],
            "concerns": [],
            "opportunities": [],
            "anomalies": categorized_data.get('anomalies', [])
        }
        
        # Analyze savings rate
        savings_rate = metrics.get('savings_rate', 0)
        if savings_rate >= 20:
            patterns["strengths"].append("Excellent savings rate (≥20%)")
        elif savings_rate >= 10:
            patterns["strengths"].append("Good savings rate (10-20%)")
        elif savings_rate < 0:
            patterns["concerns"].append("Negative savings rate - spending exceeds income")
        
        # Analyze fixed expense ratio
        fixed_ratio = metrics.get('fixed_expense_ratio', 0)
        if fixed_ratio > 50:
            patterns["concerns"].append("High fixed expenses (>50% of income)")
        elif fixed_ratio < 30:
            patterns["strengths"].append("Low fixed expenses (<30% of income)")
        
        # Analyze spending categories
        category_analysis = categorized_data.get('category_analysis', {})
        for category, percentage in category_analysis.items():
            if percentage > 30:
                patterns["concerns"].append(f"High spending in {category} ({percentage}% of expenses)")
            if percentage < 5:
                patterns["opportunities"].append(f"Low spending in {category} - consider optimization")
        
        # Cash flow analysis
        net_cash_flow = metrics.get('net_cash_flow', 0)
        if net_cash_flow > 0:
            patterns["strengths"].append(f"Positive cash flow: ${net_cash_flow:,.2f} monthly")
        else:
            patterns["concerns"].append(f"Negative cash flow: ${abs(net_cash_flow):,.2f} monthly deficit")
        
        return patterns
    
    def _generate_comprehensive_insights(self, categorized_data: Dict[str, Any], 
                                       metrics: Dict[str, float], 
                                       patterns: Dict[str, Any]) -> str:
        """Generate comprehensive financial insights using LLM"""
        
        prompt = f"""
        Provide detailed financial insights and recommendations based on this analysis:
        
        FINANCIAL SNAPSHOT:
        - Total Monthly Income: {format_currency(metrics.get('total_income', 0))}
        - Total Monthly Expenses: {format_currency(metrics.get('total_expenses', 0))}
        - Net Cash Flow: {format_currency(metrics.get('net_cash_flow', 0))}
        - Savings Rate: {metrics.get('savings_rate', 0)}%
        - Fixed Expenses: {format_currency(metrics.get('fixed_expenses', 0))} ({metrics.get('fixed_expense_ratio', 0)}% of income)
        
        SPENDING BY CATEGORY (% of total expenses):
        {chr(10).join(f"  - {category}: {percentage}%" for category, percentage in categorized_data.get('category_analysis', {}).items())}
        
        PATTERNS DETECTED:
        Strengths: {', '.join(patterns.get('strengths', ['None identified']))}
        Concerns: {', '.join(patterns.get('concerns', ['None identified']))}
        Opportunities: {', '.join(patterns.get('opportunities', ['None identified']))}
        {f"Anomalies: {len(patterns.get('anomalies', []))} unusual transactions detected" if patterns.get('anomalies') else "No spending anomalies detected"}
        
        Please provide:
        1. EXECUTIVE SUMMARY: Overall financial health assessment
        2. CASH FLOW ANALYSIS: Income stability and expense management
        3. SPENDING OPTIMIZATION: Specific areas for cost reduction
        4. SAVINGS STRATEGY: How to improve savings rate
        5. IMMEDIATE ACTIONS: 3-5 specific steps to take now
        6. LONG-TERM RECOMMENDATIONS: Sustainable financial habits
        
        Be specific, data-driven, and focus on actionable recommendations.
        Use the actual numbers from the analysis to support your insights.
        """
        
        response = self.llm.invoke([
            self.system_prompt,
            HumanMessage(content=prompt)
        ])
        
        return response.content
    
    def _create_summary_metrics(self, metrics: Dict[str, float], patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Create a summary of key metrics for quick reference"""
        
        return {
            "monthly_net_flow": metrics.get('net_cash_flow', 0),
            "savings_rate": metrics.get('savings_rate', 0),
            "financial_health": "Excellent" if metrics.get('savings_rate', 0) >= 15 else "Good" if metrics.get('savings_rate', 0) >= 5 else "Needs Improvement",
            "key_strengths": len(patterns.get('strengths', [])),
            "key_concerns": len(patterns.get('concerns', [])),
            "optimization_opportunities": len(patterns.get('opportunities', []))
        }
    
    def _calculate_financial_health_score(self, metrics: Dict[str, float], patterns: Dict[str, Any]) -> int:
        """Calculate a simple financial health score (0-100)"""
        score = 50  # Base score
        
        # Savings rate contribution (up to 30 points)
        savings_rate = metrics.get('savings_rate', 0)
        if savings_rate >= 20:
            score += 30
        elif savings_rate >= 15:
            score += 25
        elif savings_rate >= 10:
            score += 20
        elif savings_rate >= 5:
            score += 10
        elif savings_rate < 0:
            score -= 20
        
        # Cash flow contribution (up to 20 points)
        net_cash_flow = metrics.get('net_cash_flow', 0)
        if net_cash_flow > 0:
            score += 20
        else:
            score -= 15
        
        # Fixed expense ratio contribution (up to 20 points)
        fixed_ratio = metrics.get('fixed_expense_ratio', 0)
        if fixed_ratio < 40:
            score += 20
        elif fixed_ratio < 50:
            score += 10
        elif fixed_ratio > 60:
            score -= 15
        
        # Pattern adjustments (up to 10 points)
        score += len(patterns.get('strengths', [])) * 2
        score -= len(patterns.get('concerns', [])) * 3
        
        return max(0, min(100, score))
    
    def _get_empty_analysis_response(self) -> Dict[str, Any]:
        """Return response structure for empty transaction data"""
        return {
            "categorized_data": {},
            "financial_metrics": {},
            "patterns_detected": {"strengths": [], "concerns": [], "opportunities": [], "anomalies": []},
            "insights": "No transaction data available for analysis. Please provide your income and expense data to get personalized financial insights.",
            "summary_metrics": {"financial_health": "Unknown", "key_strengths": 0, "key_concerns": 0},
            "health_score": 0
        }
    
    def _get_error_analysis_response(self, error_message: str) -> Dict[str, Any]:
        """Return error response structure"""
        return {
            "error": error_message,
            "insights": f"I apologize, but I encountered an error while analyzing your financial data: {error_message}. Please ensure your transaction data is properly formatted and try again.",
            "summary_metrics": {"financial_health": "Analysis Failed", "key_strengths": 0, "key_concerns": 0},
            "health_score": 0
        }