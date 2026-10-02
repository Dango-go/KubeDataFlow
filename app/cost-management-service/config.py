import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "cost-management-service"
    API_V1_STR: str = "/api/v1/cost"
    
    # Database configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/cost_management_db"
    )

    # Base pricing rates (USD per unit per hour)
    BASE_CPU_HOURLY_RATE: float = 0.035       # $0.035 per core / hour (~$25.20/mo)
    BASE_RAM_GB_HOURLY_RATE: float = 0.005    # $0.005 per GB / hour (~$3.60/mo)
    BASE_STORAGE_GB_HOURLY_RATE: float = 0.00015 # $0.00015 per GB / hour (~$0.118/mo)
    BASE_BACKUP_GB_HOURLY_RATE: float = 0.00005  # $0.00005 per GB / hour (~$0.036/mo)

    class Config:
        case_sensitive = True

settings = Settings()
