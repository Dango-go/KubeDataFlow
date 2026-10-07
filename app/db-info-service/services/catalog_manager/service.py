from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from services.catalog_manager.repository import CatalogRepository
from models.version import DatabaseVersionEntity
import httpx
import os


class CatalogService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CatalogRepository(db)

    async def get_catalog(self) -> List[Dict[str, Any]]:
        """Get full list of active database engines for catalog UI showcase."""
        engines = await self.repository.get_all_active_engines()
        result = []
        for engine in engines:
            result.append({
                "id": engine.id,
                "name": engine.name,
                "engine_type": engine.engine_type,
                "category": engine.category,
                "icon_url": engine.icon_url,
                "description": engine.description,
                "versions": [v.version for v in engine.versions if not v.is_deprecated],
                "default_version": next((v.version for v in engine.versions if v.is_default), None)
            })
        return result

    async def get_chart_info(self, engine_type: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Get Helm chart repo URL and chart details for deployer service."""
        version_entity: DatabaseVersionEntity = await self.repository.get_chart_info(engine_type, version)
        return {
            "engine_type": engine_type,
            "version": version_entity.version,
            "helm_repo_url": version_entity.helm_repo_url,
            "chart_name": version_entity.chart_name,
            "chart_version": version_entity.chart_version
        }

    async def get_status_of_releases(self):
        """Get status of all database releases from DB and k8s clusters"""
        DISCOVERY_URL = os.getenv("DISCOVERY_SERVICE_URL", "http://discovery-service:8001")

        with httpx.Client() as client:
            try:
                resp = client.get(f"{DISCOVERY_URL}/api/v1/discovery/clusters")
                if resp.status_code != 200:
                    return []
                clusters = resp.json()
            except httpx.RequestException as e:
                return {"Can't get info about clusters": str(e)}

            if not clusters:
                return []

            clusters_map = {
                c.get("cluster_name"): {
                    "endpoint": c.get("endpoint"),
                    "token": c.get("token")
                }
                for c in clusters
            }

        
        PROVISIONING_URL = os.getenv("PROVISIONING_SERVICE_URL", "http://provisioner-service:8002")
        with httpx.Client() as client:
            try:
                resp = client.get(f"{PROVISIONING_URL}/api/v1/provisioning")
                if resp.status_code != 200:
                    return []
                databases = resp.json()
            except httpx.RequestException as e:
                return {"error": str(e)}

            if not databases:
                return []
            
            results = []

            for db in databases:
                release_name = db.get("name")
                cluster_name = db.get("cluster_name")
                namespace = db.get("namespace")

                cluster_info = clusters_map.get(cluster_name)

                if not cluster_info:
                    db["live_status"] = "Cluster Not Found"

                    results.append(db)
                    continue

                api_server_url = cluster_info.get("endpoint")
                token = cluster_info.get("token")

                try:
                    headers = {"Authorization": f"Bearer {token}"}
                    pods_url = f"{api_server_url}/api/v1/namespaces/{namespace}/pods"
                    resp = client.get(
                        pods_url,
                        params={"labelSelector": f"app.kubernetes.io/instance={release_name}"},
                        headers=headers,
                        verify=False,   
                        timeout=5.0
                    )

                    if resp.status_code == 200:
                        pods_data = resp.json().get("items", [])
                        if pods_data:
                            status = pods_data[0].get("status", {}).get("phase")
                            db["live_status"] = status

                            first_pod = pods_data[0]
                            pod_status = first_pod.get("status") or {}
                            status = pod_status.get("phase", "Unknown")
                            container_statuses = pod_status.get("containerStatuses") or []
                            
                            if container_statuses:
                                waiting = container_statuses[0].get("state", {}).get("waiting")
                                if waiting and waiting.get("reason"):
                                    status = waiting.get("reason")

                            db["live_status"] = status
                        
                        else:
                            db["live_status"] = "No Pods found in existing k8s cluster"


                    else:
                        db["live_status"] = "No connection to k8s cluster"

                except Exception as e:
                    db["live_status"] = "Unreachable"

                results.append(db)

        return results


                    




            
 



            

            

