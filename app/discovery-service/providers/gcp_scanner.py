import json
import logging
from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from google.cloud import container_v1
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


class GCPClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        try:
            if isinstance(credentials, str):
                credentials = json.loads(credentials)

            if not isinstance(credentials, dict):
                logger.error(f"GCP credentials expected dict, got {type(credentials)}")
                return []

            if "project_id" not in credentials and "credentials" in credentials:
                nested = credentials["credentials"]
                if isinstance(nested, str):
                    nested = json.loads(nested)
                if isinstance(nested, dict):
                    credentials = nested

            project_id = credentials.get("project_id")
            if not project_id:
                logger.error("GCP credentials missing 'project_id'")
                return []

            creds = service_account.Credentials.from_service_account_info(credentials)
            client = container_v1.ClusterManagerAsyncClient(credentials=creds)

            location = region or "-"
            parent = f"projects/{project_id}/locations/{location}"

            response = await client.list_clusters(parent=parent)
            clusters_data = []
            for cluster in response.clusters:
                clusters_data.append({
                    "name": cluster.name,
                    "region": cluster.location,
                    "version": cluster.current_master_version,
                    "status": cluster.status.name.lower(),
                    "endpoint": cluster.endpoint,
                    "raw": {"name": cluster.name, "location": cluster.location}
                })
            return clusters_data
        except Exception as e:
            logger.error(f"GCP GKE discovery error: {e}", exc_info=True)
            raise RuntimeError(f"GCP GKE discovery error: {str(e)}")
