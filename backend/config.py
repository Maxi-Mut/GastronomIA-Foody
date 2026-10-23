import os
from dotenv import load_dotenv

# Load .env file from project root (with fallback to .env.example)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(os.path.join(PROJECT_ROOT, ".env.example"))

class Settings:
    PROJECT_NAME: str = "GastronomIA - Asistente Gastronómico CABA y GBA"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = 8000
    _raw_port = os.getenv("PORT", "8000")
    if _raw_port and _raw_port.strip().isdigit():
        PORT = int(_raw_port.strip())
    
    # LLM Provider Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip().replace('"', '').replace("'", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip().replace('"', '').replace("'", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip().replace('"', '').replace("'", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip() or "llama-3.3-70b-versatile"
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "").strip().replace('"', '').replace("'", "")
    
    _raw_provider = os.getenv("DEFAULT_PROVIDER", "auto").strip().replace('"', '').replace("'", "").lower()
    if "groq" in _raw_provider:
        DEFAULT_PROVIDER = "groq"
    elif "deepseek" in _raw_provider:
        DEFAULT_PROVIDER = "deepseek"
    elif "gemini" in _raw_provider:
        DEFAULT_PROVIDER = "gemini"
    elif "openai" in _raw_provider:
        DEFAULT_PROVIDER = "openai"
    elif "local" in _raw_provider:
        DEFAULT_PROVIDER = "local"
    else:
        DEFAULT_PROVIDER = "auto"
    
    # Database
    DATABASE_PATH: str = os.path.join(PROJECT_ROOT, "gastronomia.db")

settings = Settings()
