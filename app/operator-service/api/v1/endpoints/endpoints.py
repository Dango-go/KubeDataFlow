from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from kubernetes_asyncio.client.rest import ApiException
from api.v1.endpoints.schemas import ApplyRequest, DeleteRequest, GetResourceRequest
from services.operator_manager.service import ServiceYAMLManager

router = APIRouter(prefix="/api/v1/operator", tags=["operator"])


# POST /api/v1/operator/apply
@router.post("/apply")
async def deploy_manifest(request: ApplyRequest):
    service = ServiceYAMLManager()
    try:
        applied = await service.apply_manifest(
            resource_name=request.resource_name,
            target_namespace=request.target_namespace,
            content=request.content,
            cluster_name=request.cluster_name
        )
        return {
            "status": "success",
            "resource_name": request.resource_name,
            "namespace": request.target_namespace,
            "output": applied
        }
    except ApiException as e:
        if e.status == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Resource endpoint not found on cluster '{request.cluster_name}' (HTTP 404). {e.body or e.reason}"
            )
        raise HTTPException(
            status_code=e.status or 500,
            detail=f"Kubernetes API error ({e.status}): {e.reason or e.body or str(e)}"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST /api/v1/operator/status
@router.post("/status")
async def get_resource_status(request: GetResourceRequest):
    service = ServiceYAMLManager()
    try:
        resource_status = await service.get_resource_status(
            api_server_url=request.api_server_url,
            auth_token=request.auth_token,
            group=request.group,
            version=request.version,
            namespace=request.namespace,
            kind=request.kind,
            plural=request.plural,
            name=request.name,
            ca_cert_data=request.ca_cert_data
        )
        return {
            "status": "success",
            "resource_name": request.name,
            "data": resource_status
        }
    except ApiException as e:
        raise HTTPException(status_code=e.status or 500, detail=f"K8s API error: {e.body or e.reason}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST /api/v1/operator/delete
@router.post("/delete")
async def delete_resource(request: DeleteRequest):
    service = ServiceYAMLManager()
    try:
        deleting = await service.delete_manifest(
            api_server_url=request.api_server_url,
            auth_token=request.auth_token,
            group=request.group,
            version=request.version,
            namespace=request.namespace,
            kind=request.kind,
            plural=request.plural,
            name=request.name,
            ca_cert_data=request.ca_cert_data
        )
        return {
            "status": "success",
            "resource_name": request.name,
            "deleted": deleting
        }
    except ApiException as e:
        raise HTTPException(status_code=e.status or 500, detail=f"K8s API error: {e.body or e.reason}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
