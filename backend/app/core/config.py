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

    def get_cors_origins(self) -> List[str]:
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000"]

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

    class Config:
        env_file = env_file_path
        case_sensitive = True
        extra = "ignore"


settings = Settings()
