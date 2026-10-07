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
        PROVISIONING_URL = os.getenv("PROVISIONING_SERVICE_URL", "http://provisioner-service:8002")
        DISCOVERY_URL = os.getenv("DISCOVERY_SERVICE_URL", "http://discovery-service:8001")
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

            for db in databases:
                release_name = db.get("name")
                cluster_name = db.get("cluster_name")
                namespace = db.get("namespace")
                current_status = db.get("status", "Running")
                cpu = db.get("cpu")
                ram = db.get("ram")
                disk = db.get("disk")
                status= db.get("status")
                created_at = db.get("created_at")
                monthly_cost = db.get("monthly_cost")

        with httpx.Client() as client:
            try:
                resp = client.get(f"{DISCOVERY_URL}/api/v1/discovery")
                if resp.status_code != 200:
                    return []
                clusters = resp.json()
            except httpx.RequestException as e:
                return {"error": str(e)}

            if not clusters:
                return []

            for cluster in clusters:
                cluster_name = cluster.get("cluster_name")
                

            

            

