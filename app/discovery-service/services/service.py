import json
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, func, or_
from models.db_models import ClusterEntity
from api.v1.schemas import DiscoveryRequest, TokenCreateRequest
from providers.aws_scanner import AWSClusterScanner
from providers.gcp_scanner import GCPClusterScanner
from providers.digitalocean_scanner import DigitalOceanClusterScanner
from services.main_saver_token import Saving_cluster_token
import httpx
from config import settings


class ClusterScannerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scanners = {
            "aws": AWSClusterScanner(),
            "gcp": GCPClusterScanner(),
            "digitalocean": DigitalOceanClusterScanner(),
            "do": DigitalOceanClusterScanner(),
        }

    # Fetch official provider_type from provider-service DB by alias
    async def fetch_provider_type(self, alias: str, user_id: int = 1) -> Optional[str]:
        url = f"{settings.PROVIDER_SERVICE_URL}/api/v1/provider/credentials/{alias}?user_id={user_id}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("provider_type")
            except httpx.RequestError:
                pass
        return None

    # def for get creds directly from provider service
    async def fetch_credentials_from_provider_service(self, alias: str) -> Dict[str, Any]:
        url = f"{settings.PROVIDER_SERVICE_URL}/api/v1/provider/credentials/{alias}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("credentials", {})
            except httpx.RequestError:
                pass
        return {}


    async def discover_and_save(self, request: DiscoveryRequest) -> List[ClusterEntity]:
        # Authoritatively fetch provider_type from provider-service DB if not provided or to verify
        official_provider_type = await self.fetch_provider_type(request.alias, request.user_id)
        provider_type = (official_provider_type or request.provider_type).lower()

        scanner = self.scanners.get(provider_type)
        if not scanner:
            raise ValueError(f"Unsupported provider: {provider_type}")

        # get credentials directly from provider service
        creds = await self.fetch_credentials_from_provider_service(request.alias)
        if not creds:
            raise ValueError(f"No valid credentials found for alias '{request.alias}'. Please re-add credentials.")

        # SCANNING clusters with creds and region
        try:
            found_clusters = await scanner.scan_clusters(creds, region=request.region)
        except Exception as e:
            raise ValueError(f"Cluster scan failed for alias '{request.alias}': {e}")
            found_clusters = []


        saved_entities = []
        for c in found_clusters:
            clean_raw = json.loads(json.dumps(c.get("raw", {}), default=str)) if c.get("raw") else None
            existing = await self.db.execute(
                select(ClusterEntity).where(
                    ClusterEntity.user_id == request.user_id,
                    ClusterEntity.provider_alias == request.alias,
                    ClusterEntity.cluster_name == c["name"]
                )
            )
            entity = existing.scalars().first()

            if entity:
                entity.region = c["region"]
                entity.k8s_version = c.get("version")
                entity.status = c.get("status", "active")
                entity.endpoint = c.get("endpoint")
                entity.ca_cert = c.get("ca_cert")
                entity.raw_data = clean_raw
            else:
                entity = ClusterEntity(
                    user_id=request.user_id,
                    provider_type=provider_type,
                    provider_alias=request.alias,
                    cluster_name=c["name"],
                    region=c["region"],
                    k8s_version=c.get("version"),
                    status=c.get("status", "active"),
                    endpoint=c.get("endpoint"),
                    ca_cert=c.get("ca_cert"),
                    raw_data=clean_raw
                )
                self.db.add(entity)

            saved_entities.append(entity)


        cred_region = creds.get("aws_region") or creds.get("region")
        target_region = (request.region if request.region and str(request.region).strip() else None) or (cred_region if cred_region and str(cred_region).strip() else None) or "us-east-1"

        clean_alias = request.alias.strip()
        alias_condition = or_(
            ClusterEntity.provider_alias == clean_alias,
            ClusterEntity.provider_alias == request.alias,
            func.lower(func.trim(ClusterEntity.provider_alias)) == func.lower(clean_alias),
            (ClusterEntity.provider_type == provider_type) & (ClusterEntity.region == target_region)
        )

        found_names = [c["name"] for c in found_clusters]
        if found_names:
            await self.db.execute(
                delete(ClusterEntity).where(
                    ClusterEntity.user_id == request.user_id,
                    alias_condition,
                    ClusterEntity.cluster_name.not_in(found_names)  # If no cluster in found_names then delete
                )
            )
        # if in cloud 0 clusters
        else:
            await self.db.execute(
                delete(ClusterEntity).where(
                    ClusterEntity.user_id == request.user_id,
                    alias_condition
                )
            )

        await self.db.commit()
        for e in saved_entities:
            await self.db.refresh(e)

        return saved_entities

    async def get_clusters_by_user(self, user_id: int) -> List[ClusterEntity]:
        result = await self.db.execute(
            select(ClusterEntity).where(ClusterEntity.user_id == user_id)
        )
        return result.scalars().all()

    async def get_cluster_by_name(self, cluster_name: str) -> Optional[ClusterEntity]:
        result = await self.db.execute(
            select(ClusterEntity).where(ClusterEntity.cluster_name == cluster_name)
        )
        return result.scalars().first()

    async def delete_cluster_by_name(self, cluster_name: str, user_id: int = 1) -> bool:
        result = await self.db.execute(
            delete(ClusterEntity).where(
                ClusterEntity.cluster_name == cluster_name,
                ClusterEntity.user_id == user_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    # create token (for headers request from helm / kubectl) to get access creating resources in clusters 
    async def create_access_token(self,  request: TokenCreateRequest):

        # get type of cloud
        official_provider_type = await self.fetch_provider_type(request.alias, request.user_id)
        provider_type = (official_provider_type or "").strip().lower()
        
        if not provider_type:
            raise ValueError(f"No valid provider found for alias '{request.alias}'. Please re-add credentials.")

        # get creds from cloud
        creds = await self.fetch_credentials_from_provider_service(request.alias)
        if not creds:
            raise ValueError(f"No valid credentials found for alias '{request.alias}'. Please re-add credentials.")

        # create temp eks bearer access token 
        creater = self.scanners.get(provider_type)
        temp_token_create = await creater.creation_token(cloud_creds=creds, cluster_name=request.cluster_name)

        # create constant token
        token = await Saving_cluster_token.create_token_and_save(temp_token=temp_token_create,  api_server_url=request.api_server_url) 

        # save token to cluster
        existing = await self.db.execute(
            select(ClusterEntity).where(
                ClusterEntity.user_id == request.user_id,
                ClusterEntity.cluster_name == request.cluster_name
            )
        )
        entity = existing.scalars().first()
        if entity:
            entity.token = token
            await self.db.commit()
            await self.db.refresh(entity)

        return token

    async def authorize_cluster_access(self, cluster_name: str, alias: Optional[str] = None, user_id: int = 1) -> Dict[str, Any]:
        existing = await self.db.execute(
            select(ClusterEntity).where(
                ClusterEntity.user_id == user_id,
                ClusterEntity.cluster_name == cluster_name
            )
        )
        entity = existing.scalars().first()
        target_alias = alias or (entity.provider_alias if entity else None)
        if not target_alias:
            raise ValueError(f"Provider credential alias not found for cluster '{cluster_name}'")

        official_provider_type = await self.fetch_provider_type(target_alias, user_id)
        provider_type = (official_provider_type or (entity.provider_type if entity else "")).lower()

        if provider_type not in ["aws", "amazon"]:
            return {
                "status": "success",
                "message": f"Cluster '{cluster_name}' on {provider_type} does not require AWS Access Entry authorization.",
                "cluster_name": cluster_name
            }

        creds = await self.fetch_credentials_from_provider_service(target_alias)
        if not creds:
            raise ValueError(f"No valid credentials found for alias '{target_alias}'. Please check credentials in Vault.")

        aws_scanner: AWSClusterScanner = self.scanners.get("aws")
        region = entity.region if entity else None
        res = await aws_scanner.authorize_access_entry(credentials=creds, cluster_name=cluster_name, region=region)
        return res
