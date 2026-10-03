import httpx
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class ClusterServiceClient:
    """HTTP-Client for retrieving cluster credentials by cluster_id."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "CLUSTER_MANAGEMENT_SERVICE_URL", "http://localhost:8006")

    async def get_cluster_credentials(self, cluster_id: str) -> Dict[str, Any]:
        """Get api_server_url and auth_token for target cluster_id."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/v1/clusters/{cluster_id}/credentials")
                if response.status_code == 200:
                    return response.json()
            except Exception as exc:
                logger.warning("Failed to fetch cluster credentials from cluster-service: %s", str(exc))

        # Fallback in-cluster configuration (if /api/v1/clusters/{cluster_id}/credentials )
        return {
            "api_server_url": getattr(settings, "KUBERNETES_API_URL", "https://kubernetes.default.svc"),
            "auth_token": getattr(settings, "KUBERNETES_AUTH_TOKEN", "default-cluster-token")
        }
