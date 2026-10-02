from pydantic import BaseModel, Field
from typing import Dict, Any, Optional


class ProviderRequest(BaseModel):
    user_id: Optional[int] = Field(default=1, description="ID user")
    provider_type: str = Field(..., description="The type of provider for the credentials.")
    alias: str = Field(..., description="Credentials name.")
    credentials: Dict [str, Any] = Field(..., description="The credentials data as a dictionary. Will be encrypted before storing in the database.")

class ProviderResponse(BaseModel):
    user_id: int
    provider_type: str
    alias: str
    credentials: Dict[str, Any] = Field(..., description="The credentials data is decrypted.")

    class Config:
        from_attributes = True
