import logging
from typing import Dict, Any
from kubernetes_asyncio.client.rest import ApiException
from kubernetes_asyncio import client

logger = logging.getLogger(__name__)


class CRDRunner:
    @staticmethod
    def _build_paths(group: str, version: str, namespace: str, plural: str, name: str):
        # Core group ("" or "core" like apiVersion: v1) uses /api/v1/namespaces/...
        # Named groups (like apiVersion: apps/v1 or postgresql.cnpg.io/v1) use /apis/{group}/{version}/namespaces/...
        if not group or group == "core":
            base_url = f"/api/{version}/namespaces/{namespace}/{plural}"
            item_url = f"/api/{version}/namespaces/{namespace}/{plural}/{name}"
        else:
            base_url = f"/apis/{group}/{version}/namespaces/{namespace}/{plural}"
            item_url = f"/apis/{group}/{version}/namespaces/{namespace}/{plural}/{name}"
        return base_url, item_url

    @classmethod
    async def apply(
        cls,
        api_client: client.ApiClient,
        kind: str, 
        group: str,
        version: str,
        namespace: str,
        plural: str,
        name: str,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        base_url, item_url = cls._build_paths(group, version, namespace, plural, name)
        auth_settings = ['BearerToken']
        create_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        patch_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/merge-patch+json'
        }

        try:
            logger.info("Applying K8s object %s/%s at endpoint %s", kind, name, base_url)
            # 1. Try CREATE (POST base_url)
            result = await api_client.call_api(
                resource_path=base_url,
                method='POST',
                header_params=create_headers,
                body=body,
                auth_settings=auth_settings,
                _return_http_data_only=True
            )
            return result
        except ApiException as e:
            if e.status == 409:  # Already exists -> PATCH
                logger.info("Object %s already exists at %s. Patching (merge-patch)...", name, item_url)
                result = await api_client.call_api(
                    resource_path=item_url,
                    method='PATCH',
                    header_params=patch_headers,
                    body=body,
                    auth_settings=auth_settings,
                    _return_http_data_only=True
                )
                return result
            elif e.status == 404:
                logger.error(
                    "404 Not Found at %s for kind '%s'. Verify group='%s', version='%s', plural='%s'. "
                    "If this is a CRD, ensure the operator is installed on the cluster.",
                    base_url, kind, group, version, plural
                )
            logger.error("ApiException during apply at %s: %s", base_url, e)
            raise e

    @classmethod
    async def get(
        cls,
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        _, item_url = cls._build_paths(group, version, namespace, plural, name)
        return await api_client.call_api(
            resource_path=item_url,
            method='GET',
            header_params={'Accept': 'application/json'},
            auth_settings=['BearerToken'],
            _return_http_data_only=True
        )

    @classmethod
    async def delete(
        cls,
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        _, item_url = cls._build_paths(group, version, namespace, plural, name)
        return await api_client.call_api(
            resource_path=item_url,
            method='DELETE',
            header_params={'Accept': 'application/json'},
            auth_settings=['BearerToken'],
            _return_http_data_only=True
        )
