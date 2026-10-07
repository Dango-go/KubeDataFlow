from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from api.dependencies import get_db
from services.catalog_manager.service import CatalogService
from core.exceptions import EngineNotFoundError, VersionNotSupportedError


router = APIRouter(prefix="/api/v1/info", tags=["catalog"])

# POST Update list
@router.post("/update_clusters")
async def update_clusters(
    db: AsyncSession = Depends(get_db)
):
    service = CatalogService(db)
    return await None

# GET status of reliases
@router.get("/status_of_releases")
async def status_of_releases(
    db: AsyncSession = Depends(get_db),
):
    service = CatalogService(db)
    return await service.get_status_of_releases()


# GET /api/v1/info/pods_status/{release}
@router.get("/pods_status/{release}")
async def get_pods_status_from_reliase(
    db: AsyncSession = Depends(get_db),
    
):
    service = CatalogService(db)
    return await None

