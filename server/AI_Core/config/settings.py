import os
import time
from dotenv import load_dotenv
from typing import Dict, Any
from typing import Dict

# Load environment variables
load_dotenv()

class Settings:
    """Application settings configuration"""
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Model Configuration
    MODEL_NAME = "gemini-2.0-flash"
    TEMPERATURE = 0.1
    MAX_TOKENS = 4096
    
    # Agent Configuration
    AGENT_CONFIG = {
        "master": {"temperature": 0.1, "max_tokens": 2048},
        "analyzer": {"temperature": 0.1, "max_tokens": 1024},
        "planner": {"temperature": 0.1, "max_tokens": 1024},
        "advisor": {"temperature": 0.1, "max_tokens": 1024},
        "optimizer": {"temperature": 0.1, "max_tokens": 1024},
        "educator": {"temperature": 0.3, "max_tokens": 1024}
    }
    
    # Financial Configuration
    EMERGENCY_FUND_MONTHS = 3
    DEFAULT_SAVINGS_RATE = 0.2
    MAX_DEBT_TO_INCOME_RATIO = 0.36
    
    @classmethod
    def get_agent_config(cls, agent_type: str) -> Dict[str, Any]:
        """Get configuration for specific agent type"""
        return cls.AGENT_CONFIG.get(agent_type, {"temperature": 0.1, "max_tokens": 1024})
    
    @classmethod
    def validate_api_key(cls):
        """Validate API key when needed"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required. Please create a .env file with your API key.")

settings = Settings()



class RateLimiter:
    def __init__(self, calls_per_minute: int = 10):
        self.calls_per_minute = calls_per_minute
        self.min_interval = 60.0 / calls_per_minute
        self.last_call_time = 0
    
    def wait_if_needed(self):
        current_time = time.time()
        time_since_last_call = current_time - self.last_call_time
        
        if time_since_last_call < self.min_interval:
            sleep_time = self.min_interval - time_since_last_call
            time.sleep(sleep_time)
        
        self.last_call_time = time.time()

# Add to your Settings class or use separately
rate_limiter = RateLimiter(calls_per_minute=8)  # Conservative limit