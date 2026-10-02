import httpx
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class OperatorServiceClient:
    """HTTP-Клієнт для взаємодії з асинхронним сервісом operator-service (K8s Dynamic CRD)."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "OPERATOR_SERVICE_URL", "http://localhost:8005")

    async def apply_manifest(
        self,
        api_server_url: str,
        auth_token: str,
        resource_name: str,
        target_namespace: str,
        content: Dict[str, Any],
        ca_cert_data: Optional[str] = None
    ) -> Dict[str, Any]:
        """Відправляв готовий CRD-маніфест (CloudNativePG / Redis Operator) на виконання в operator-service."""
        payload = {
            "api_server_url": api_server_url,
            "auth_token": auth_token,
            "resource_name": resource_name,
            "target_namespace": target_namespace,
            "content": content,
            "ca_cert_data": ca_cert_data
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/v1/operator/apply", json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error("Failed to execute operator apply via operator-service: %s", str(exc))
                raise RuntimeError(f"Operator service communication error: {str(exc)}")

    async def delete_resource(
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
        """Викликає видалення CRD-ресурсу в Kubernetes через operator-service."""
        payload = {
            "api_server_url": api_server_url,
            "auth_token": auth_token,
            "group": group,
            "version": version,
            "namespace": namespace,
            "kind": kind,
            "plural": plural,
            "name": name,
            "ca_cert_data": ca_cert_data
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/v1/operator/delete", json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error("Failed to delete CRD resource via operator-service: %s", str(exc))
                raise RuntimeError(f"Operator delete error: {str(exc)}")
