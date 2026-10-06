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

# GET pods of reliase
@router.post("/pods_list")
async def pods_list(
    db: AsyncSession = Depends(get_db)
):
    service = CatalogService(db)
    return await None

