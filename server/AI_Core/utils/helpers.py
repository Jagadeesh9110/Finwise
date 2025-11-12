import logging
import json
import sys
import codecs
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import re

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Setup application logging with UTF-8 encoding for Windows"""
    
    # Create UTF-8 handler for console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Create UTF-8 handler for file
    file_handler = logging.FileHandler('finwise.log', encoding='utf-8')
    file_handler.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = []  # Clear existing handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    return logging.getLogger(__name__)

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def format_currency(amount: float) -> str:
    """Format currency with proper formatting (Indian Rupees)"""
    return f"₹{amount:,.2f}"

def parse_financial_input(text: str) -> Dict[str, Any]:
    """Parse financial information from user input"""
    patterns = {
        'income': r'\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:salary|income|earn)',
        'expenses': r'\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:spend|expense|cost)',
        'savings': r'\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:save|savings|emergency fund)',
        'debt': r'\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:debt|loan|owe|credit card)'
    }
    
    extracted = {}
    for key, pattern in patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Take the first match and convert to float
            try:
                value = float(matches[0].replace(',', ''))
                extracted[key] = value
            except ValueError:
                continue
    
    return extracted

def calculate_age(birth_date: str) -> int:
    """Calculate age from birth date string"""
    try:
        birth_dt = datetime.strptime(birth_date, "%Y-%m-%d")
        today = datetime.now()
        age = today.year - birth_dt.year
        
        # Adjust if birthday hasn't occurred this year
        if today.month < birth_dt.month or (today.month == birth_dt.month and today.day < birth_dt.day):
            age -= 1
            
        return age
    except ValueError:
        raise ValueError("Invalid date format. Use YYYY-MM-DD")

def generate_report_id() -> str:
    """Generate unique report ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"FINWISE_{timestamp}"

def safe_json_loads(json_string: str) -> Dict[str, Any]:
    """Safely parse JSON string with error handling"""
    try:
        return json.loads(json_string)
    except json.JSONDecodeError:
        return {}

def calculate_months_between(start_date: str, end_date: str) -> int:
    """Calculate months between two dates"""
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        months = (end.year - start.year) * 12 + (end.month - start.month)
        return max(0, months)
    except ValueError:
        return 0

class ColorFormatter:
    """Color formatting for console output"""
    
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'
    
    @classmethod
    def success(cls, text: str) -> str:
        return f"{cls.GREEN}{text}{cls.END}"
    
    @classmethod
    def warning(cls, text: str) -> str:
        return f"{cls.YELLOW}{text}{cls.END}"
    
    @classmethod
    def error(cls, text: str) -> str:
        return f"{cls.RED}{text}{cls.END}"
    
    @classmethod
    def info(cls, text: str) -> str:
        return f"{cls.CYAN}{text}{cls.END}"
    
    @classmethod
    def header(cls, text: str) -> str:
        return f"{cls.BOLD}{cls.MAGENTA}{text}{cls.END}"