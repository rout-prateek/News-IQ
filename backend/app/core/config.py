import os
from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEWSIQ"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Postgres Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/newsiq")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # News Retrieval
    NEWS_API_KEY: str = os.getenv("NEWSDATA_API_KEY") or os.getenv("NEWS_API_KEY", "")
    NEWS_API_BASE_URL: str = os.getenv("NEWSDATA_BASE_URL") or os.getenv("NEWS_API_BASE_URL", "https://newsapi.org/v2")
    
    # AI APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
