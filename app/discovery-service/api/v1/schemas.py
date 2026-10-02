from uuid import UUID
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from datetime import datetime


# If user side clicked on "update clusters" and chose one alias 
class DiscoveryRequest(BaseModel):
    user_id: int = Field(1, description="User ID")
    alias: str = Field(..., description="Connected cloud provider alias")
    provider_type: Optional[str] = Field(None, description="Cloud provider type: aws, gcp, digitalocean")
    region: Optional[str] = Field(None, description="Region for scanning")



class ClusterResponse(BaseModel):
    id: Union[UUID, str]
    user_id: int
    provider_type: str
    provider_alias: str
    cluster_name: str
    region: str
    k8s_version: Optional[str] = None
    status: str
    endpoint: Optional[str] = None
    ca_cert: Optional[str] = None
    token: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenCreateRequest(BaseModel):
    user_id: int = Field(1, description="User ID")
    alias: str = Field(..., description="Connected cloud provider alias") # need to generate temp access IAM-token (aws eks get-token).
    cluster_name: str = Field(..., description="Cluster name")
    api_server_url: str = Field(..., description="API server url")
    ca_cert_data: str = Field(..., description="CA cert data")


class AuthorizeAccessRequest(BaseModel):
    alias: str = Field(..., description="Cloud credential alias on platform")
    user_id: Optional[int] = Field(1, description="User ID")

