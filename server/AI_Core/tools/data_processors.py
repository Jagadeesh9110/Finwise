import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

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
            amount = transaction.get('amount', 0)
            description = transaction.get('description', '').lower()
            category = transaction.get('category', '').lower()
            
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
        """Analyze spending trends over time"""
        if not transactions:
            return {}
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
        
        # Filter expenses (negative amounts)
        expenses_df = df[df['amount'] < 0].copy()
        expenses_df['amount'] = expenses_df['amount'].abs()
        
        if period == "monthly":
            grouped = expenses_df.groupby([expenses_df['date'].dt.to_period('M'), 'category'])['amount'].sum()
            trends = grouped.unstack(fill_value=0).to_dict(orient='index')
        else:
            grouped = expenses_df.groupby('category')['amount'].sum()
            trends = grouped.to_dict()
        
        # Calculate summary statistics
        total_spending = expenses_df['amount'].sum()
        avg_monthly_spending = expenses_df.groupby(expenses_df['date'].dt.to_period('M'))['amount'].sum().mean()
        
        return {
            "trends": trends,
            "summary": {
                "total_spending": round(total_spending, 2),
                "average_monthly_spending": round(avg_monthly_spending, 2),
                "top_categories": expenses_df.groupby('category')['amount'].sum().nlargest(5).to_dict()
            }
        }
    
    @staticmethod
    def calculate_financial_ratios(income: float, expenses: float, debts: List[Dict], 
                                 assets: float) -> Dict[str, float]:
        """Calculate key financial ratios"""
        total_debt = sum(debt.get('balance', 0) for debt in debts)
        monthly_debt_payments = sum(debt.get('minimum_payment', 0) for debt in debts)
        
        ratios = {
            "savings_rate": round((income - expenses) / income * 100, 2) if income > 0 else 0,
            "debt_to_income": round((monthly_debt_payments / income) * 100, 2) if income > 0 else 0,
            "net_worth": round(assets - total_debt, 2),
            "emergency_fund_months": round(assets / expenses, 1) if expenses > 0 else 0
        }
        
        return ratios
    
    @staticmethod
    def detect_anomalies(transactions: List[Dict], threshold: float = 2.0) -> List[Dict]:
        """Detect anomalous transactions using statistical methods"""
        if len(transactions) < 10:
            return []
        
        df = pd.DataFrame(transactions)
        amounts = df['amount'].abs()
        
        # Calculate z-scores
        mean = amounts.mean()
        std = amounts.std()
        
        anomalies = []
        for idx, transaction in enumerate(transactions):
            z_score = (abs(transaction['amount']) - mean) / std if std > 0 else 0
            if z_score > threshold:
                anomalies.append({
                    **transaction,
                    "z_score": round(z_score, 2),
                    "anomaly_type": "high_value" if transaction['amount'] > 0 else "high_spending"
                })
        
        return anomalies