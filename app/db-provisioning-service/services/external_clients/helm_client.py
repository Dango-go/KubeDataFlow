import httpx
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class HelmDeployerClient:

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "HELM_DEPLOYER_URL", "http://localhost:8003")

    async def apply_chart(
        self,
        release_name: str,
        chart_name: str,
        namespace: str,
        values_yaml: str,
        api_server_url: str,
        auth_token: str, # bare token
        ca_cert_data: Optional[str] = None # pub cert of cluster
    ) -> Dict[str, Any]:

        payload = {
            "release_name": release_name,
            "chart_name": chart_name,
            "namespace": namespace,
            "values_yaml": values_yaml,  # Values yaml in json
            "cluster_info": {
                "api_server_url": api_server_url,
                "auth_token": auth_token,
                "ca_cert_data": ca_cert_data
            }
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/v1/helm/apply", json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error("Failed to execute helm apply via helm-deployer: %s", str(exc))
                raise RuntimeError(f"Helm deployer communication error: {str(exc)}")


    async def template_chart(
        self,
        chart_name: str,
        values_yaml: str
    ) -> Dict[str, Any]:

        payload = {
            "chart_name": chart_name,
            "values_yaml": values_yaml
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/v1/helm/template", json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error("Failed to execute helm template: %s", str(exc))
                raise RuntimeError(f"Helm template error: {str(exc)}")
