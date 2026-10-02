import logging
from typing import Dict, Any, Optional
from services.operator_manager.validator import Validator
from services.operator_manager.crd_builder import CRDBuilder
from services.operator_manager.runner import CRDRunner
from services.k8s.client_factory import K8sClientFactory
import httpx
import os

logger = logging.getLogger(__name__)


class ServiceYAMLManager:
    def __init__(self):
        self.validator = Validator()
        self.builder = CRDBuilder()
        self.runner = CRDRunner()

    async def apply_manifest(
        self,
        #api_server_url: str,
        #auth_token: str,
        resource_name: str,
        target_namespace: str,
        content: str | Dict[str, Any],
        cluster_name: str,
        #ca_cert_data: Optional[str] = None
    ) -> Dict[str, Any]:
        name = self.validator.validate_name(resource_name)
        namespace = self.validator.validate_namespace(target_namespace)
        
        if isinstance(content, str):
            manifest = self.builder.parse_yaml(content)
        else:
            manifest = content

        group, version, kind, plural = self.builder.extract_gvk(manifest) # create prular kind 

        DISCOVERY_URL = os.environ.get("DISCOVERY_URL", "http://discovery-service:8001")
        async with httpx.AsyncClient() as client:
            response = await client.get(url=f"{DISCOVERY_URL}/api/v1/discovery/cluster/{cluster_name}")
        
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch cluster '{cluster_name}' from discovery: {response.text}")

        cluster_data = response.json()
        api_server_url = cluster_data["endpoint"]
        auth_token = cluster_data["token"]
        ca_cert_data = cluster_data["ca_cert"]

        if not api_server_url or not auth_token:
            raise ValueError(f"Cluster '{cluster_name}' is missing API endpoint or access token.")

        api_net_client = K8sClientFactory.create_client(
            api_server_url=api_server_url,
            auth_token=auth_token,
            ssl_ca_cert=ca_cert_data
        )

        try:
            return await self.runner.apply(
                api_client=api_net_client,
                kind=kind,
                group=group,
                version=version,
                namespace=namespace,
                plural=plural,
                name=name,
                body=manifest,
            )
        finally:
            await api_net_client.close()

    async def get_resource_status(
        self,
        api_server_url: str,
        auth_token: str,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
        ca_cert_data: Optional[str] = None
    ) -> Dict[str, Any]:
        name = self.validator.validate_name(name)
        namespace = self.validator.validate_namespace(namespace)

        api_net_client = K8sClientFactory.create_client(
            api_server_url=api_server_url,
            auth_token=auth_token,
            ssl_ca_cert=ca_cert_data
        )

        try:
            return await self.runner.get(
                api_client=api_net_client,
                group=group,
                version=version,
                namespace=namespace,
                kind=kind,
                plural=plural,
                name=name,
            )
        finally:
            await api_net_client.close()

    async def delete_manifest(
        self,
        api_server_url: str,
        auth_token: str,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
        ca_cert_data: Optional[str] = None
    ) -> Dict[str, Any]:
        name = self.validator.validate_name(name)
        namespace = self.validator.validate_namespace(namespace)

        api_net_client = K8sClientFactory.create_client(
            api_server_url=api_server_url,
            auth_token=auth_token,
            ssl_ca_cert=ca_cert_data
        )

        try:
            return await self.runner.delete(
                api_client=api_net_client,
                group=group,
                version=version,
                namespace=namespace,
                kind=kind,
                plural=plural,
                name=name,
            )
        finally:
            await api_net_client.close()
