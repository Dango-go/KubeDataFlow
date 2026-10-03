from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "db-catalog-service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://info:info@postgres:5432/info_db"

    class Config:
        case_sensitive = True


settings = Settings()
