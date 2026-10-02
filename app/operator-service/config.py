import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_SERVICE_NAME: str = "Operator Service"
    API_V1: str = "/api/v1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
