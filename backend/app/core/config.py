from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    #DATABASE_URL: str = "sqlite:///./marketplace.db"
    DATABASE_URL: str = "sqlite:///./data/marketplace.db"

    ADMIN_TOKEN: str = "changeme"
    PORT: int = 8000

    # Email settings (optional - if not configured, emails will be logged instead of sent)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@genai-marketplace.local"
    SMTP_FROM_NAME: str = "GenAI Marketplace"
    ADMIN_EMAIL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
