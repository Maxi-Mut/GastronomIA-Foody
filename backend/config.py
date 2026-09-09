import os
from dotenv import load_dotenv

# Load .env file from project root if it exists
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

class Settings:
    PROJECT_NAME: str = "GastronomIA - Asistente Gastronómico CABA y GBA"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # LLM Provider Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "auto").strip().lower() # 'gemini', 'openai', 'local' or 'auto'
    
    # Database
    DATABASE_PATH: str = os.path.join(PROJECT_ROOT, "gastronomia.db")

settings = Settings()
