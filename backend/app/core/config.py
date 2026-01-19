from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "sqlite:///./marketplace.db"
    ADMIN_TOKEN: str = "changeme"
    PORT: int = 8000

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
