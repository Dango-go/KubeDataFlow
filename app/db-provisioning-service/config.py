import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_SERVICE_NAME: str = "DB Provisioning Management Service"
    API_V1: str = "/api/v1"
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "provisioning")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "provisioning")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "postgres")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB_NAME: str = os.getenv("POSTGRES_DB_NAME", "provisioning_db")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB_NAME}"
    )
    HELM_DEPLOYER_URL: str = os.getenv("HELM_DEPLOYER_URL", "http://helm-deployer:8001")
    OPERATOR_SERVICE_URL: str = os.getenv("OPERATOR_SERVICE_URL", "http://operator-service:8001")
    DB_ECHO: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
