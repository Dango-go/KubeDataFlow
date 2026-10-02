from pydantic import BaseModel, Field
from typing import Optional, Any, Dict


class ApplyRequest(BaseModel):
    resource_name: str = Field(..., description="Name of the K8s resource")
    target_namespace: str = Field("default", description="Target Kubernetes namespace")
    content: str = Field(..., description="YAML manifest object dictionary or string")
    cluster_name: str = Field(..., description="Name of the target cluster")


class DeleteRequest(BaseModel):
    auth_token: str = Field(..., description="Authentication token for target cluster")
    group: str = Field(..., description="Group of the CRD resource")
    version: str = Field(..., description="Version of the CRD resource")
    namespace: str = Field("default", description="Namespace of the resource")
    kind: str = Field(..., description="Kind of the resource")
    plural: str = Field(..., description="Plural URL segment of the resource")
    name: str = Field(..., description="Name of the resource to delete")
    ca_cert_data: Optional[str] = Field(None, description="Optional SSL CA certificate data")


class GetResourceRequest(BaseModel):
    api_server_url: str = Field(..., description="Kubernetes API Server URL")
    auth_token: str = Field(..., description="Authentication token for target cluster")
    group: str = Field(..., description="Group of the CRD resource")
    version: str = Field(..., description="Version of the CRD resource")
    namespace: str = Field("default", description="Namespace of the resource")
    kind: str = Field(..., description="Kind of the resource")
    plural: str = Field(..., description="Plural URL segment of the resource")
    name: str = Field(..., description="Name of the resource")
    ca_cert_data: Optional[str] = Field(None, description="Optional SSL CA certificate data")
