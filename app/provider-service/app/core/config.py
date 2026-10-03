from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    API_SERVICE_NAME: str = "Provider Service"
    API_V1: str = "/api/v1"
    POSTGRES_USER: str = "provider"
    POSTGRES_PASSWORD: str = "provider"
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB_NAME: str = "provider_db"

    PROVIDER_SERVICE_URL: str = "http://provider-service:8001"
    VAULT_SERVICE_URL: str = os.getenv("VAULT_SERVICE_URL", "http://vault-service:8001")

    @property
    def DB_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB_NAME}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Default attributes 
settings = Settings()
