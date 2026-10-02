from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db
from api.v1.endpoints.schemas import EngineCreateRequest
from services.catalog_manager.repository import CatalogRepository

router = APIRouter(prefix="/api/v1/admin/catalog", tags=["admin-catalog"])


# POST /api/v1/admin/catalog/engines - Add new DB engine to catalog
@router.post("/engines")
async def create_engine(
    request: EngineCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to add new database engine to the catalog showcase."""
    repo = CatalogRepository(db)
    try:
        engine = await repo.create_engine(
            name=request.name,
            engine_type=request.engine_type,
            category=request.category,
            icon_url=request.icon_url,
            description=request.description
        )
        return {
            "status": "success",
            "message": f"Database engine '{request.name}' successfully added to catalog",
            "engine_id": engine.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create engine: {str(e)}")
