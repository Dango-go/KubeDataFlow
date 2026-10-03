from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# GET /api/v1/databases  
class DatabaseItemResponse(BaseModel):
    id: str
    name: str
    engine_type: str
    version: str
    cluster_name: str
    namespace: str
    status: str  # Running, Scaling, Stopped, Failed
    cpu: float
    ram: float
    disk: float
    monthly_cost: float
    created_at: datetime


class CreateDatabaseRequest(BaseModel):
    name: str
    engine_type: str
    version: str
    cluster_name: Optional[str] = "default-prod"
    cluster_id: Optional[str] = "cluster-1"
    namespace: Optional[str] = "databases"
    cpu: Optional[float] = 1.0
    ram: Optional[float] = 2.0
    disk: Optional[float] = 20.0
    values_yaml: Optional[str] = None



# GET /api/v1/databases/{id}
class DatabasePassportResponse(BaseModel):
    id: str
    name: str
    engine_type: str
    version: str
    cluster_id: str
    cluster_name: str
    namespace: str
    status: str
    host: str
    port: int
    connection_string: str
    cpu: float
    ram: float
    disk: float
    values_yaml: str
    created_at: datetime



#  PATCH /api/v1/databases/{id}/scale 
# {
  #"cluster_id": "prod-k8s",
  #"db_id": "1",
  #"namespace": "databases",
  #"cpu": 4.0,
  #"ram": 16.0,
  #"disk": 200.0
#}
class ScaleRequest(BaseModel):
    cluster_id: str = Field(..., description="Target cluster ID")
    namespace: str = Field("databases", description="Target namespace")
    cpu: Optional[float] = Field(None, ge=0.1, description="New CPU cores")
    ram: Optional[float] = Field(None, ge=0.25, description="New RAM in GB")
    disk: Optional[float] = Field(None, ge=1.0, description="New Disk size in GB")


# PUT /api/v1/databases/{id}/config
class ConfigRequest(BaseModel):
    cluster_id: str = Field(..., description="Target cluster ID")
    namespace: str = Field("databases", description="Target namespace")
    values_yaml: str = Field(..., description="Updated values.yaml configuration content")



class StatusResponse(BaseModel):
    status: str
    message: str
    database_id: str
    current_status: str