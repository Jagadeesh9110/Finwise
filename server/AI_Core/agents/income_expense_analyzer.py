from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, List
import logging
from datetime import datetime
import pandas as pd

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

    # ============================================================
    # === MAIN ENTRYPOINT ========================================
    # ============================================================
    def analyze_finances(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Comprehensive analysis of income, expenses, and financial health"""
        logger.info(f"Analyzing {len(transactions)} transactions for financial insights")

        try:
            if not transactions:
                return self._get_empty_analysis_response()

            categorized_data = self._process_transactions(transactions)
            financial_metrics = self._calculate_financial_metrics(categorized_data)
            patterns = self._detect_financial_patterns(categorized_data, financial_metrics)
            insights = self._generate_comprehensive_insights(categorized_data, financial_metrics, patterns)

            result = {
                "categorized_data": categorized_data,
                "financial_metrics": financial_metrics,
                "patterns_detected": patterns,
                "insights": insights,
                "summary_metrics": self._create_summary_metrics(financial_metrics, patterns),
                "health_score": self._calculate_financial_health_score(financial_metrics, patterns)
            }

            # JSON-safe return
            return self._serialize_dict(result)

        except Exception as e:
            logger.error(f"Error in financial analysis: {str(e)}", exc_info=True)
            return self._get_error_analysis_response(str(e))

    # ============================================================
    # === CORE PROCESSING ========================================
    # ============================================================
    def _process_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process and categorize transactions with detailed analysis"""
        categorized = self.data_processor.categorize_transactions(transactions)
        spending_trends = self.data_processor.analyze_spending_trends(transactions, "monthly")
        anomalies = self.data_processor.detect_anomalies(transactions)
        category_analysis = self._analyze_categories(categorized)
        recurring = self._identify_recurring_transactions(transactions)

        data = {
            "categorized_transactions": categorized,
            "spending_trends": spending_trends,
            "anomalies": anomalies,
            "category_analysis": category_analysis,
            "recurring_transactions": recurring,
            "time_period_analysis": self._analyze_time_periods(transactions)
        }

        return self._serialize_dict(data)

    def _analyze_categories(self, categorized: Dict[str, List[Dict]]) -> Dict[str, float]:
        """Analyze spending by category with percentages"""
        total_expenses = sum(abs(t.get('amount', 0)) for t in categorized.get('expenses', []))
        category_totals = {}
        for transaction in categorized.get('expenses', []):
            cat = str(transaction.get('category', 'Uncategorized'))
            category_totals[cat] = category_totals.get(cat, 0) + abs(transaction.get('amount', 0))
        return {k: round((v / total_expenses) * 100, 1) for k, v in category_totals.items()} if total_expenses > 0 else {}

    def _identify_recurring_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """Identify recurring income and expense patterns"""
        recurring = {"income": [], "expenses": []}
        groups = {}
        for t in transactions:
            key = f"{t.get('description', '').lower()}_{abs(t.get('amount', 0))}"
            groups.setdefault(key, []).append(t)

        for key, group in groups.items():
            if len(group) >= 2:
                first = group[0]
                t_type = "income" if first.get('amount', 0) > 0 else "expenses"
                recurring[t_type].append({
                    "description": str(first.get('description', 'Unknown')),
                    "amount": float(abs(first.get('amount', 0))),
                    "frequency": "monthly",
                    "occurrences": len(group),
                    "last_date": str(max(t.get('date', '') for t in group))
                })
        return recurring

    def _analyze_time_periods(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze financial patterns across different months"""
        if not transactions:
            return {}

        monthly_data = {}
        for t in transactions:
            try:
                date = datetime.strptime(t.get('date', ''), "%Y-%m-%d")
                key = date.strftime("%Y-%m")
                amt = float(t.get('amount', 0))
                monthly_data.setdefault(key, {"income": 0.0, "expenses": 0.0})
                if amt > 0:
                    monthly_data[key]["income"] += amt
                else:
                    monthly_data[key]["expenses"] += abs(amt)
            except Exception:
                continue

        return {
            "monthly_breakdown": monthly_data,
            "analysis_period": f"{min(monthly_data.keys())} to {max(monthly_data.keys())}" if monthly_data else "",
            "months_analyzed": len(monthly_data)
        }

    # ============================================================
    # === METRICS, PATTERNS, LLM INSIGHTS ========================
    # ============================================================
    def _calculate_financial_metrics(self, categorized_data: Dict[str, Any]) -> Dict[str, float]:
        categorized = categorized_data.get("categorized_transactions", {})
        total_income = sum(t.get('amount', 0) for t in categorized.get('income', []) if t.get('amount', 0) > 0)
        total_expenses = sum(abs(t.get('amount', 0)) for t in categorized.get('expenses', []) if t.get('amount', 0) < 0)
        net_cash_flow = total_income - total_expenses
        savings_rate = (net_cash_flow / total_income * 100) if total_income > 0 else 0

        recurring_exp = categorized_data.get("recurring_transactions", {}).get("expenses", [])
        fixed_exp = sum(e.get("amount", 0) for e in recurring_exp)
        discretionary = total_expenses - fixed_exp
        fixed_ratio = (fixed_exp / total_income * 100) if total_income > 0 else 0
        disc_ratio = (discretionary / total_income * 100) if total_income > 0 else 0

        months = len(categorized_data.get("time_period_analysis", {}).get("monthly_breakdown", {})) or 1
        return {
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_cash_flow": round(net_cash_flow, 2),
            "savings_rate": round(savings_rate, 1),
            "fixed_expenses": round(fixed_exp, 2),
            "discretionary_expenses": round(discretionary, 2),
            "fixed_expense_ratio": round(fixed_ratio, 1),
            "discretionary_ratio": round(disc_ratio, 1),
            "average_monthly_income": round(total_income / months, 2),
            "average_monthly_expenses": round(total_expenses / months, 2)
        }

    def _detect_financial_patterns(self, categorized_data: Dict[str, Any], metrics: Dict[str, float]) -> Dict[str, Any]:
        """Detect spending strengths, concerns, opportunities"""
        patterns = {"strengths": [], "concerns": [], "opportunities": [], "anomalies": categorized_data.get("anomalies", [])}

        sr = metrics.get("savings_rate", 0)
        if sr >= 20:
            patterns["strengths"].append("Excellent savings rate (≥20%)")
        elif sr >= 10:
            patterns["strengths"].append("Good savings rate (10-20%)")
        elif sr < 0:
            patterns["concerns"].append("Negative savings rate — spending exceeds income")

        fr = metrics.get("fixed_expense_ratio", 0)
        if fr > 50:
            patterns["concerns"].append("High fixed expenses (>50% of income)")
        elif fr < 30:
            patterns["strengths"].append("Low fixed expenses (<30% of income)")

        for cat, pct in categorized_data.get("category_analysis", {}).items():
            if pct > 30:
                patterns["concerns"].append(f"High spending in {cat} ({pct}% of expenses)")
            elif pct < 5:
                patterns["opportunities"].append(f"Low spending in {cat} — optimization possible")

        flow = metrics.get("net_cash_flow", 0)
        if flow > 0:
            patterns["strengths"].append(f"Positive cash flow: ₹{flow:,.2f} monthly")
        else:
            patterns["concerns"].append(f"Negative cash flow: ₹{abs(flow):,.2f} monthly deficit")

        return patterns

    def _generate_comprehensive_insights(self, categorized_data: Dict[str, Any],
                                         metrics: Dict[str, float],
                                         patterns: Dict[str, Any]) -> str:
        """Generate rich text insights using Gemini"""
        prompt = f"""
        Provide detailed financial insights and recommendations:

        FINANCIAL SNAPSHOT:
        - Total Monthly Income: ₹{metrics.get('total_income', 0):,.2f}
        - Total Monthly Expenses: ₹{metrics.get('total_expenses', 0):,.2f}
        - Net Cash Flow: ₹{metrics.get('net_cash_flow', 0):,.2f}
        - Savings Rate: {metrics.get('savings_rate', 0)}%
        - Fixed Expenses: ₹{metrics.get('fixed_expenses', 0):,.2f} ({metrics.get('fixed_expense_ratio', 0)}% of income)

        SPENDING BY CATEGORY:
        {chr(10).join(f"  - {k}: {v}%" for k, v in categorized_data.get('category_analysis', {}).items())}

        PATTERNS DETECTED:
        Strengths: {', '.join(patterns.get('strengths', ['None']))}
        Concerns: {', '.join(patterns.get('concerns', ['None']))}
        Opportunities: {', '.join(patterns.get('opportunities', ['None']))}
        {f"Anomalies: {len(patterns.get('anomalies', []))} unusual transactions detected" if patterns.get('anomalies') else "No anomalies detected"}

        Please provide:
        1. EXECUTIVE SUMMARY
        2. CASH FLOW ANALYSIS
        3. SPENDING OPTIMIZATION
        4. SAVINGS STRATEGY
        5. IMMEDIATE ACTIONS
        6. LONG-TERM RECOMMENDATIONS
        """

        response = self.llm.invoke([self.system_prompt, HumanMessage(content=prompt)])
        return response.content

    # ============================================================
    # === SUMMARIES & SCORING ===================================
    # ============================================================
    def _create_summary_metrics(self, metrics: Dict[str, float], patterns: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "monthly_net_flow": metrics.get("net_cash_flow", 0),
            "net_cash_flow": metrics.get("net_cash_flow", 0),
            "savings_rate": metrics.get("savings_rate", 0),
            "financial_health": (
                "Excellent" if metrics.get("savings_rate", 0) >= 15
                else "Good" if metrics.get("savings_rate", 0) >= 5
                else "Needs Improvement"
            ),
            "key_strengths": len(patterns.get("strengths", [])),
            "key_concerns": len(patterns.get("concerns", [])),
            "optimization_opportunities": len(patterns.get("opportunities", []))
        }

    def _calculate_financial_health_score(self, metrics: Dict[str, float], patterns: Dict[str, Any]) -> int:
        score = 50
        sr = metrics.get("savings_rate", 0)
        if sr >= 20:
            score += 30
        elif sr >= 15:
            score += 25
        elif sr >= 10:
            score += 20
        elif sr >= 5:
            score += 10
        elif sr < 0:
            score -= 20

        flow = metrics.get("net_cash_flow", 0)
        score += 20 if flow > 0 else -15

        fr = metrics.get("fixed_expense_ratio", 0)
        if fr < 40:
            score += 20
        elif fr < 50:
            score += 10
        elif fr > 60:
            score -= 15

        score += len(patterns.get("strengths", [])) * 2
        score -= len(patterns.get("concerns", [])) * 3
        return max(0, min(100, score))

    def _serialize_dict(self, obj: Any) -> Any:
        """Recursively convert all pandas/complex structures to JSON-safe types"""
        if obj is None:
            return None
        if isinstance(obj, (str, int, float, bool)):
            return obj
        if isinstance(obj, pd.Series):
            return {str(k): float(v) for k, v in obj.to_dict().items()}
        if isinstance(obj, pd.DataFrame):
            return [self._serialize_dict(r.to_dict()) for _, r in obj.iterrows()]
        if isinstance(obj, dict):
            return {str(k): self._serialize_dict(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._serialize_dict(v) for v in obj]
        if hasattr(obj, "__dict__"):
            return self._serialize_dict(obj.__dict__)
        return str(obj)

    def _get_empty_analysis_response(self) -> Dict[str, Any]:
        return {
            "categorized_data": {},
            "financial_metrics": {},
            "patterns_detected": {"strengths": [], "concerns": [], "opportunities": [], "anomalies": []},
            "insights": "No transaction data available for analysis. Please provide data to generate insights.",
            "summary_metrics": {"financial_health": "Unknown", "key_strengths": 0, "key_concerns": 0},
            "health_score": 0
        }

    def _get_error_analysis_response(self, msg: str) -> Dict[str, Any]:
        return {
            "error": msg,
            "insights": f"I encountered an error while analyzing your financial data: {msg}",
            "summary_metrics": {"financial_health": "Analysis Failed", "key_strengths": 0, "key_concerns": 0},
            "health_score": 0
        }
