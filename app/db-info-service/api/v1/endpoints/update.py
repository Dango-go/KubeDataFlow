from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from api.dependencies import get_db
from services.catalog_manager.service import CatalogService
from core.exceptions import EngineNotFoundError, VersionNotSupportedError


router = APIRouter(prefix="/api/v1/info", tags=["catalog"])

@router.post("/update_clusters")
async def update_clusters(
    db: AsyncSession = Depends(get_db)
):
    """Update the version of a Helm chart."""
    service = CatalogService(db)
    return await None

