from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from api.v1.endpoints.schemas import (
    DatabaseItemResponse,
    DatabasePassportResponse,
    CreateDatabaseRequest,
    ScaleRequest,
    ConfigRequest,
    StatusResponse
)
from services.provisioning_manager.service import ProvisioningService

router = APIRouter(prefix="/api/v1/provisioning", tags=["db-provisioning"])


# 1. GET /api/v1/provisioning
@router.get("", response_model=List[DatabaseItemResponse])
async def list_databases(db: AsyncSession = Depends(get_db)):
    service = ProvisioningService(db)
    instances = await service.get_all_databases()
    return [
        DatabaseItemResponse(
            id=item.id,
            name=item.name,
            engine_type=item.engine_type,
            version=item.version,
            cluster_name=item.cluster_name,
            namespace=item.namespace,
            status=item.status,
            cpu=item.cpu,
            ram=item.ram,
            disk=item.disk,
            monthly_cost=item.cpu * 15.0 + item.ram * 4.0 + item.disk * 0.15,
            created_at=item.created_at
        )
        for item in instances
    ]


# 1.1 POST /api/v1/provisioning
@router.post("", response_model=DatabaseItemResponse)
async def create_database(request: CreateDatabaseRequest, db: AsyncSession = Depends(get_db)):
    service = ProvisioningService(db)
    created = await service.repo.create_instance(
        name=request.name,
        engine_type=request.engine_type,
        version=request.version,
        cluster_name=request.cluster_name or "default-prod",
        cluster_id=request.cluster_id or "cluster-1",
        namespace=request.namespace or "databases",
        cpu=request.cpu or 1.0,
        ram=request.ram or 2.0,
        disk=request.disk or 20.0,
        values_yaml=request.values_yaml
    )
    return DatabaseItemResponse(
        id=created.id,
        name=created.name,
        engine_type=created.engine_type,
        version=created.version,
        cluster_name=created.cluster_name,
        namespace=created.namespace,
        status=created.status,
        cpu=created.cpu,
        ram=created.ram,
        disk=created.disk,
        monthly_cost=created.cpu * 15.0 + created.ram * 4.0 + created.disk * 0.15,
        created_at=created.created_at
    )



# 2. GET /api/v1/provisioning/{id}
@router.get("/{id}", response_model=DatabasePassportResponse)
async def get_database_passport(id: str, db: AsyncSession = Depends(get_db)): # id from "/{id}"
    service = ProvisioningService(db)
    item = await service.get_database_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Database instance '{id}' not found")
    
    return DatabasePassportResponse(
        id=item.id,
        name=item.name,
        engine_type=item.engine_type,
        version=item.version,
        cluster_id=item.cluster_id,
        cluster_name=item.cluster_name,
        namespace=item.namespace,
        status=item.status,
        host=item.host or f"{item.name}.{item.namespace}.svc.cluster.local",
        port=item.port or 5432,
        connection_string=item.connection_string or f"{item.engine_type}://admin:***@{item.name}:{item.port or 5432}",
        cpu=item.cpu,
        ram=item.ram,
        disk=item.disk,
        values_yaml=item.values_yaml or "",
        created_at=item.created_at
    )


# 3. PATCH /api/v1/provisioning/{id}/scale
@router.patch("/{id}/scale", response_model=StatusResponse)
async def scale_database(id: str, request: ScaleRequest, db: AsyncSession = Depends(get_db)):
    service = ProvisioningService(db)
    try:
        updated = await service.scale_database(
            db_id=id,
            cluster_id=request.cluster_id,
            namespace=request.namespace,
            cpu=request.cpu,
            ram=request.ram,
            disk=request.disk
        )
        return StatusResponse(
            status="success",
            message=f"Successfully scaled instance '{updated.name}' to CPU={updated.cpu}, RAM={updated.ram}GB, Disk={updated.disk}GB",
            database_id=updated.id,
            current_status=updated.status
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# 4. PUT /api/v1/provisioning/{id}/config
@router.put("/{id}/config", response_model=StatusResponse)
async def update_database_config(id: str, request: ConfigRequest, db: AsyncSession = Depends(get_db)):
    service = ProvisioningService(db)
    try:
        updated = await service.update_database_config(
            db_id=id,
            cluster_id=request.cluster_id,
            namespace=request.namespace,
            values_yaml=request.values_yaml
        )
        return StatusResponse(
            status="success",
            message=f"Successfully upgraded custom-values.yaml configuration for instance '{updated.name}'",
            database_id=updated.id,
            current_status=updated.status
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
