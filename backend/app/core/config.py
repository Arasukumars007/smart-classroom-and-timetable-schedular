from pydantic_settings import BaseSettings
from typing import List
import json
import os

# Get path to .env file relative to this config.py file
# config.py is in backend/app/core/config.py, so .env is 3 levels up.
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_file_path = os.path.join(backend_dir, ".env")


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Classroom & Timetable Scheduler"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://scadmin:scpassword@localhost:5432/smart_classroom"

    # Security
    SECRET_KEY: str = "supersecretkey_change_in_production_32chars_minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:8000"]'

    # Public URL of the deployed frontend (e.g. https://smart-classroom.onrender.com)
    # Set this as a runtime environment variable on your PaaS host.
    FRONTEND_URL: str = ""

    def get_cors_origins(self) -> List[str]:
        try:
            origins = json.loads(self.BACKEND_CORS_ORIGINS)
        except Exception:
            origins = ["http://localhost:3000"]
        # Dynamically add the deployed frontend URL when running on PaaS
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    def __init__(self, **values):
        super().__init__(**values)

        # Fix Render PostgreSQL URL: convert postgresql:// → postgresql+asyncpg://
        if self.DATABASE_URL.startswith("postgresql://"):
            self.DATABASE_URL = self.DATABASE_URL.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )
        elif self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace(
                "postgres://", "postgresql+asyncpg://", 1
            )
        elif self.DATABASE_URL.startswith("sqlite"):
            # Resolve relative path to absolute path relative to the backend directory
            db_file = self.DATABASE_URL.split("///")[-1].replace("./", "")
            abs_db_path = os.path.join(backend_dir, db_file).replace("\\", "/")
            self.DATABASE_URL = f"sqlite+aiosqlite:///{abs_db_path}"

        # Add SSL for non-local PostgreSQL (required by Render, Supabase, Neon, etc.)
        # asyncpg uses ?ssl=require (not sslmode=require which is psycopg2-style)
        if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            local_hosts = ("localhost", "127.0.0.1", "postgres", "db")
            host_part = self.DATABASE_URL.split("@")[-1].split("/")[0].split(":")[0]
            if host_part not in local_hosts:
                if "?" not in self.DATABASE_URL:
                    self.DATABASE_URL += "?ssl=require"
                elif "ssl=" not in self.DATABASE_URL:
                    self.DATABASE_URL += "&ssl=require"

    class Config:
        env_file = env_file_path
        case_sensitive = True
        extra = "ignore"


settings = Settings()
