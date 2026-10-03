from pydantic import BaseModel, Field
from typing import Optional


#{
  #"cluster_name": "my-local-lenovo",
  #"api_server_url": "https://192.168.1.50:6443",
  #"auth_token": "eyJhbGciOiJSUzI1NiIs..."
#}
# CLUSTER DATA
class ClusterLoginRequest(BaseModel):
    cluster_name: str = Field(..., description="Name of the cluster")
    api_server_url: str = Field(..., description="API server URL of the cluster")
    auth_token: Optional[str] = Field(None, description="Authentication token for the cluster (optional)")

#{
  #"chart_repo_url": "https://charts.bitnami.com/bitnami",
  #"chart_name": "postgresql",
  #"chart_version": "13.1.5",
  #"release_name": "my-postgres-db"
#}
# INSTALL
class InstallRequest(BaseModel):
    chart_repo_url: str = Field(..., description="Repository URL of the chart")
    chart_name: str = Field(..., description="Chart name to be installed")
    chart_version: str = Field(..., description="Chart version to be installed")
    release_name: str = Field(..., description="Unique name of the release to be installed")

#{
  #"release_name": "my-postgres-db",
  #"file_path": "values.yaml",
  #"content": "replicaCount: 2\nimage:\n  repository: postgres\n  tag: 16-alpine\n"
#}
# SAVE FILE
class FileSaveRequest(BaseModel):
    release_name: str = Field(..., description="Name of the release for which the file is being saved")
    file_path: str = Field(..., description="Path to the file being edited, e.g., values.yaml")
    content: str = Field(..., description="New content of the file from the virtual editor")


# {
  #"cluster_id": 1,
  #"release_name": "my-postgres-db"
#}
# APPLY
class ApplyRequest(BaseModel):
    cluster_name: str
    release_name: str
    chart_name: str
    api_server_url: Optional[str] = None
    ca_cert_data: Optional[str] = None
    token: Optional[str] = None
    user_name: str = "cluster-admin"
    namespace: str = "default"
    target_values_file: Optional[str] = None


class ChartPullResponse(BaseModel):
    release_name: str
    chart_dir: str

    class Config:
        from_attributes = True


class CreateCustomFileRequest(BaseModel):
    release_name: str = Field(..., description="Name of the release")
    file_name: str = Field("custom-values.yaml", description="Name of the new custom YAML file, e.g. custom-values.yaml")
    content: str = Field(..., description="Raw YAML content for the custom file")


class UninstallRequest(BaseModel):
    cluster_name: str
    release_name: str
    api_server_url: Optional[str] = None
    ca_cert_data: Optional[str] = None
    token: Optional[str] = None
    user_name: str = "cluster-admin"
    namespace: str = "default"


