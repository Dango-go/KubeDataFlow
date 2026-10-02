from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from api.dependencies import get_db
from api.v1.endpoints.schemas import EngineSummaryResponse, ChartInfoResponse
from services.catalog_manager.service import CatalogService
from core.exceptions import EngineNotFoundError, VersionNotSupportedError

router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])


# GET /api/v1/catalog - Get list of active DB engines with supported versions for catalog UI
@router.get("", response_model=List[EngineSummaryResponse])
async def get_catalog(db: AsyncSession = Depends(get_db)):
    """Retrieve full catalog list of active database engines and their supported versions."""
    service = CatalogService(db)
    return await service.get_catalog()


# GET /api/v1/catalog/{engine_type}/chart-info - Get Helm chart details for deployer
@router.get("/{engine_type}/chart-info", response_model=ChartInfoResponse)
async def get_chart_info(
    engine_type: str,
    version: Optional[str] = Query(None, description="Database version e.g. 16"),
    db: AsyncSession = Depends(get_db)
):
    """Internal endpoint for deployment engine to fetch Helm repo URL and chart details."""
    service = CatalogService(db)
    try:
        return await service.get_chart_info(engine_type=engine_type, version=version)
    except (EngineNotFoundError, VersionNotSupportedError) as e:
        raise HTTPException(status_code=404, detail=str(e))

