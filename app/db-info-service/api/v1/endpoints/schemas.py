from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# Public Database Catalog DTOs
class EngineSummaryResponse(BaseModel):
    id: int
    name: str = Field(..., description="Display name e.g., PostgreSQL")
    engine_type: str = Field(..., description="System identifier e.g., postgresql")
    category: str = Field(..., description="Category e.g., Relational SQL")
    icon_url: Optional[str] = Field(None, description="Logo URL")
    description: Optional[str] = Field(None, description="Short summary for UI card")
    versions: List[str] = Field(..., description="Supported active versions")
    default_version: Optional[str] = Field(None, description="Default version")


class ChartInfoResponse(BaseModel):
    engine_type: str
    version: str
    helm_repo_url: str
    chart_name: str
    chart_version: str


class EngineCreateRequest(BaseModel):
    name: str = Field(..., description="Display name")
    engine_type: str = Field(..., description="System identifier")
    category: str = Field(..., description="Category")
    icon_url: Optional[str] = None
    description: Optional[str] = None

