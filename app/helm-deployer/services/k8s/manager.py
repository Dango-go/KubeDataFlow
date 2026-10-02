import logging
from typing import List
from kubernetes_asyncio import client
from kubernetes_asyncio.client.exceptions import ApiException

from db.models.models import ClusterDB
from services.k8s.factory import K8sClientFactory

logger = logging.getLogger(__name__)

class K8sManager:

    # Healthceck connection to api server of cluster
    @staticmethod
    async def cluster_healthcheck(cluster: ClusterDB) -> bool:
        try:
            async with K8sClientFactory.create_from_cluster_entity(cluster) as net_client:

                k8s_client = client.CoreV1Api(net_client)  # object of CoreV1Api class

                await k8s_client.get_api_resources()
                return True

        except Exception as e:
            logger.error("Cluster ID=%s is not reachable: %s", cluster.id, e)
            return False

    # Need for "choice ns for deploy" in UI 
    @staticmethod
    async def get_namespaces(cluster: ClusterDB) -> List[str]:

        async with K8sClientFactory.create_from_cluster_entity(cluster) as net_client:
            k8s_client = client.CoreV1Api(net_client)
            
            namespaces_list = await k8s_client.list_namespace()
            
            return [ns.metadata.name for ns in namespaces_list.items]


    @staticmethod
    async def ensure_namespace_exists(cluster: ClusterDB, namespace: str) -> None:

        async with K8sClientFactory.create_from_cluster_entity(cluster) as net_client:
            v1_core = client.CoreV1Api(net_client)
            try:
                await v1_core.read_namespace(name=namespace)
            except ApiException as e:
                if e.status == 404:
         
                    body = client.V1Namespace(metadata=client.V1ObjectMeta(name=namespace))
                    await v1_core.create_namespace(body=body)
                else:
                    raise e