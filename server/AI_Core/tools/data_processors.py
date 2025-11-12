import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """Data processing utilities for financial data"""
    
    @staticmethod
    def categorize_transactions(transactions: List[Dict]) -> Dict[str, List[Dict]]:
        """Categorize transactions by type and category"""
        categorized = {
            "income": [],
            "expenses": [],
            "investments": [],
            "transfers": []
        }
        
        for transaction in transactions:
            amount = float(transaction.get('amount', 0))
            description = str(transaction.get('description', '')).lower()
            category = str(transaction.get('category', '')).lower()
            
            # Determine transaction type
            if amount > 0 and any(keyword in description for keyword in ['salary', 'deposit', 'income', 'payment']):
                categorized["income"].append(transaction)
            elif amount < 0 and any(keyword in description for keyword in ['investment', 'stock', 'etf', 'mutual']):
                categorized["investments"].append(transaction)
            elif any(keyword in description for keyword in ['transfer', 'move']):
                categorized["transfers"].append(transaction)
            else:
                categorized["expenses"].append(transaction)
        
        return categorized
    
    @staticmethod
    def analyze_spending_trends(transactions: List[Dict], period: str = "monthly") -> Dict[str, Any]:
        """Analyze spending trends over time (JSON-safe: str keys, flat dicts)"""
        if not transactions:
            return {"trends": {}, "summary": {"total_spending": 0.0, "average_monthly_spending": 0.0, "top_categories": {}}}
        
        try:
            df = pd.DataFrame(transactions)
            df['date'] = pd.to_datetime(df['date'])
            df['amount'] = pd.to_numeric(df['amount'])
            
            # Filter expenses (negative amounts)
            expenses_df = df[df['amount'] < 0].copy()
            expenses_df['amount'] = expenses_df['amount'].abs()
            
            if period == "monthly":
                grouped = expenses_df.groupby([expenses_df['date'].dt.to_period('M'), 'category'])['amount'].sum().unstack(fill_value=0)
                # === FIX: Str Period keys + flatten to dict of dicts ===
                trends = {}
                for period_obj in grouped.index:
                    str_period = str(period_obj)  # '2025-11'
                    period_row = grouped.loc[period_obj]
                    trends[str_period] = period_row.to_dict()  # Series → dict
                    # Ensure inner keys/values are str/float
                    trends[str_period] = {str(cat): float(val) for cat, val in trends[str_period].items()}
            else:
                grouped = expenses_df.groupby('category')['amount'].sum()
                trends = grouped.to_dict()
                trends = {str(cat): float(val) for cat, val in trends.items()}
            
            # Summary (floats only)
            total_spending = float(expenses_df['amount'].sum())
            monthly_groups = expenses_df.groupby(expenses_df['date'].dt.to_period('M'))['amount'].sum()
            avg_monthly_spending = float(monthly_groups.mean()) if len(monthly_groups) > 0 else 0.0
            
            top_raw = expenses_df.groupby('category')['amount'].sum().nlargest(5)
            top_categories = {str(cat): float(val) for cat, val in top_raw.items()}
            
            return {
                "trends": trends,
                "summary": {
                    "total_spending": total_spending,
                    "average_monthly_spending": avg_monthly_spending,
                    "top_categories": top_categories
                }
            }
        except Exception as e:
            logger.error(f"Error in analyze_spending_trends: {str(e)}")
            return {"trends": {}, "summary": {"total_spending": 0.0, "average_monthly_spending": 0.0, "top_categories": {}}}
    
    @staticmethod
    def calculate_financial_ratios(income: float, expenses: float, debts: List[Dict], assets: float) -> Dict[str, float]:
        """Calculate key financial ratios"""
        total_debt = sum(float(debt.get('balance', 0)) for debt in debts)
        monthly_debt_payments = sum(float(debt.get('minimum_payment', 0)) for debt in debts)
        
        ratios = {
            "savings_rate": round((income - expenses) / income * 100, 2) if income > 0 else 0.0,
            "debt_to_income": round((monthly_debt_payments / income) * 100, 2) if income > 0 else 0.0,
            "net_worth": round(assets - total_debt, 2),
            "emergency_fund_months": round(assets / expenses, 1) if expenses > 0 else 0.0
        }
        
        return ratios
    
    @staticmethod
    def detect_anomalies(transactions: List[Dict], threshold: float = 2.0) -> List[Dict]:
        """Detect anomalous transactions using statistical methods (flat dicts)"""
        if len(transactions) < 10:
            return []
        
        try:
            df = pd.DataFrame(transactions)
            amounts = df['amount'].abs()
            
            mean = float(amounts.mean())
            std = float(amounts.std())
            
            anomalies = []
            for transaction in transactions:
                amt = abs(float(transaction['amount']))
                z_score = (amt - mean) / std if std > 0 else 0.0
                if z_score > threshold:
                    # Flat dict, str/float only
                    anomalies.append({
                        "description": str(transaction.get('description', '')),
                        "amount": float(amt),
                        "category": str(transaction.get('category', '')),
                        "date": str(transaction.get('date', '')),
                        "z_score": round(z_score, 2),
                        "anomaly_type": "high_value" if float(transaction.get('amount', 0)) > 0 else "high_spending"
                    })
            
            return anomalies
        except Exception as e:
            logger.error(f"Error in detect_anomalies: {str(e)}")
            return []