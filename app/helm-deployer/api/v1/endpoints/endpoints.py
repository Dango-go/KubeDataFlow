from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from api.v1.endpoints.schemas import (
    InstallRequest,
    FileSaveRequest,
    ApplyRequest,
    UninstallRequest,
    ChartPullResponse,
    CreateCustomFileRequest,
)
from core.database import db_session
from services.helm_deployer.service import HelmService

router = APIRouter(prefix="/api/v1/helm", tags=["helm"])



# POST /api/v1/helm/pull
@router.post("/pull", response_model=ChartPullResponse)
async def pull_chart(
    request: InstallRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    chart_dir = await service.get_and_unpack(
        chart_repo_url=request.chart_repo_url,
        chart_name=request.chart_name,
        chart_version=request.chart_version,
        release_name=request.release_name,
    )
    return ChartPullResponse(
        release_name=request.release_name,
        chart_dir=chart_dir
    )


# GET /api/v1/helm/file?release_name=my-postgres&file_path=values.yaml
@router.get("/file")
async def get_file(
    release_name: str = Query(..., description="Release name"),
    file_path: str = Query("values.yaml", description="File path"),
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    file_content = await service.read_chart_file(
        release_name=release_name,
        file_path=file_path
    )

    return {
        "release_name": release_name,
        "file_path": file_path,
        "content": file_content
    }


# GET /api/v1/helm/files?release_name=my-postgres
@router.get("/files")
async def list_files(
    release_name: str = Query(..., description="Release name"),
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    files = await service.list_chart_files(release_name=release_name)
    return {
        "release_name": release_name,
        "files": files
    }


# PUT /api/v1/helm/file
@router.put("/file")
async def save_chart_file(
    request: FileSaveRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    save_file = await service.save_chart_file(
        release_name=request.release_name,
        file_path=request.file_path,
        content=request.content
    )
    return {
        "status": "success",
        "message": f"File '{request.file_path}' saved successfully",
        "release_name": request.release_name,
        "file_path": save_file
    }


# POST /api/v1/helm/file/create (create custom-values.yaml alongside values.yaml)
@router.post("/file/create")
async def create_custom_file(
    request: CreateCustomFileRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    created_path = await service.create_custom_file(
        release_name=request.release_name,
        file_name=request.file_name,
        content=request.content
    )
    return {
        "status": "success",
        "message": f"Custom file '{request.file_name}' successfully created",
        "release_name": request.release_name,
        "file_name": request.file_name,
        "created_path": created_path
    }



# POST /api/v1/helm/apply
@router.post("/apply")
async def deploy_chart(
    request: ApplyRequest,
    db: AsyncSession = Depends(db_session)
):
    print(f"[HELM-DEPLOYER] Received request: cluster={request.cluster_name}, url={request.api_server_url}, ca_len={len(request.ca_cert_data or '')}, token_len={len(request.token or '')}, token_prefix={request.token[:15] if request.token else 'EMPTY'}")
    
    service = HelmService(db_session=db)
    applied = await service.apply_release(
        provider_name=request.provider_name,
        cluster_name=request.cluster_name,
        namespace=request.namespace,
        release_name=request.release_name,
        chart_name=request.chart_name,
        release_version=request.release_version,
        target_values_file=request.target_values_file,
        chart_content=request.chart_content
    )

    return {
        "status": "success",
        "release_name": request.release_name,
        "namespace": request.namespace,
        "output": applied
    }


# POST /api/v1/helm/uninstall
@router.post("/uninstall")
async def uninstall_chart(
    request: UninstallRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    result = await service.rm_release(
        cluster_name=request.cluster_name,
        release_name=request.release_name,
        ca_cert_data=request.ca_cert_data,
        api_server_url=request.api_server_url,
        token=request.token,
        user_name=request.user_name,
        namespace=request.namespace,
        mode=request.mode or "full",
        delete_pvcs=bool(request.delete_pvcs)
    )

    return {
        "status": "success",
        "message": f"Release '{request.release_name}' ({request.mode or 'full'}) processed successfully",
        "release_name": request.release_name,
        "output": result
    }

