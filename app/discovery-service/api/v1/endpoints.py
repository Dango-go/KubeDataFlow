from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import db_session
from api.v1.schemas import DiscoveryRequest, TokenCreateRequest, ClusterResponse, AuthorizeAccessRequest
from services.service import ClusterScannerService
from typing import List

router = APIRouter(prefix="/api/v1/discovery", tags=["discovery"])


@router.post("/discover", response_model=List[ClusterResponse])
async def discover_clusters(
    request: DiscoveryRequest,
    db: AsyncSession = Depends(db_session)
):
    try:
        scanner = ClusterScannerService(db=db)  
        clusters = await scanner.discover_and_save(request)
        return clusters #-> dict with data for each cluster
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Discovery failed: {str(e)}")


@router.get("/clusters/{user_id}", response_model=List[ClusterResponse])
async def get_user_clusters(
    user_id: int,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)
    return await scanner.get_clusters_by_user(user_id)


@router.get("/cluster/{cluster_name}", response_model=ClusterResponse)
async def get_cluster_by_name(
    cluster_name: str,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)
    cluster = await scanner.get_cluster_by_name(cluster_name)
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster '{cluster_name}' not found")
    return cluster


@router.delete("/cluster/{cluster_name}")
async def delete_cluster_endpoint(
    cluster_name: str,
    user_id: int = 1,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)
    deleted = await scanner.delete_cluster_by_name(cluster_name=cluster_name, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Cluster '{cluster_name}' not found for user {user_id}")
    return {"status": "success", "message": f"Cluster '{cluster_name}' removed successfully."}


# Create k8s access token for target cluster via AWS STS GetCallerIdentity presigned URL
@router.post("/clusters/create_token/{cluster_name}")
async def create_token_for_cluster(
    request: TokenCreateRequest,
    db: AsyncSession = Depends(db_session),
):
    token_creator = ClusterScannerService(db=db)
    token = await token_creator.create_access_token(request=request)

    return {"token": token}


@router.post("/clusters/{cluster_name}/authorize-access")
async def authorize_cluster_access_endpoint(
    cluster_name: str,
    request: AuthorizeAccessRequest,
    db: AsyncSession = Depends(db_session),
):
    scanner_service = ClusterScannerService(db=db)
    try:
        result = await scanner_service.authorize_cluster_access(
            cluster_name=cluster_name,
            alias=request.alias,
            user_id=request.user_id or 1
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Access Entry authorization failed: {str(e)}")