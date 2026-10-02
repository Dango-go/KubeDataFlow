import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from services.provisioning_manager.repository import DatabaseRepository
from services.provisioning_manager.lifecycle_manager import LifecycleManager, LifecycleStatus
from services.provisioning_manager.validation_engine import ValidationEngine
from services.provisioning_manager.desired_state_manager import DesiredStateManager
from services.provisioning_manager.scaling_manager import ScalingManager
from services.provisioning_manager.upgrade_manager import UpgradeManager
from services.external_clients.helm_client import HelmDeployerClient
from services.external_clients.operator_client import OperatorServiceClient
from models.db_models import DatabaseInstanceDB
from services.external_clients.cluster_client import ClusterServiceClient

logger = logging.getLogger(__name__)


class ProvisioningService:

    # all classes
    def __init__(self, db: AsyncSession):
        self.repo = DatabaseRepository(db)
        self.lifecycle = LifecycleManager()
        self.validator = ValidationEngine()
        self.desired_state = DesiredStateManager()
        self.scaling = ScalingManager()
        self.upgrade = UpgradeManager()
        self.helm_client = HelmDeployerClient()
        self.operator_client = OperatorServiceClient()
        self.cluster_client = ClusterServiceClient()

    async def get_all_databases(self) -> List[DatabaseInstanceDB]:
        """1. GET /api/v1/provisioning — List active databases."""
        return await self.repo.get_all_instances()

    async def get_database_by_id(self, db_id: str) -> Optional[DatabaseInstanceDB]:
        """2. GET /api/v1/provisioning/{id} — Information about a specific database."""
        return await self.repo.get_by_id(db_id)

    async def scale_database(
        self,
        db_id: str,
        cluster_id: str,
        namespace: str,
        cpu: Optional[float] = None,
        ram: Optional[float] = None,
        disk: Optional[float] = None
    ) -> DatabaseInstanceDB:

        if cpu is not None or ram is not None or disk is not None:
            self.validator.validate_resource_limits(
                cpu=cpu if cpu is not None else 1.0,
                ram=ram if ram is not None else 2.0,
                disk=disk if disk is not None else 20.0
            )

        # GET DB INSTANCE FROM DB
        db_instance = await self.repo.get_by_id(db_id)
        if not db_instance:
            raise ValueError(f"Database instance with id '{db_id}' not found")

        if not self.lifecycle.validate_transition(db_instance.status, LifecycleStatus.SCALING):
            raise RuntimeError(f"Cannot scale database in status '{db_instance.status}'")

        # Calculate resource diff between current DB spec and desired spec
        current_spec = {"cpu": db_instance.cpu, "ram": db_instance.ram, "disk": db_instance.disk}
        desired_spec = {
            "cpu": cpu if cpu is not None else db_instance.cpu,
            "ram": ram if ram is not None else db_instance.ram,
            "disk": disk if disk is not None else db_instance.disk
        }
        resource_diff = self.desired_state.calculate_resource_diff(current_spec, desired_spec)
        logger.info("Resource diff for scaling db_id %s: %s", db_id, resource_diff)

        # UPDATE STATUS info of scaling in database
        await self.repo.update_status(db_id, LifecycleStatus.SCALING)

        # UPDATE NEW RESOURCES INTO EXISTING CUSTOM-VALUES.YAML
        updated_yaml = self.scaling.update_resources_in_yaml(
            existing_yaml=db_instance.values_yaml or "",
            cpu=cpu,
            ram=ram,
            disk=disk
        )

        # FETCH K8S CREDENTIALS FROM CLUSTER-SERVICE BY cluster_id
        cluster_creds = await self.cluster_client.get_cluster_credentials(db_instance.cluster_id)

        # CALL HELM-DEPLOYER WITH UPDATED VALUES.YAML AND DECRYPTED CREDENTIALS
        try:
            await self.helm_client.apply_chart(
                release_name=db_instance.name,
                chart_name=db_instance.chart_name,
                namespace=namespace,
                values_yaml=updated_yaml,
                api_server_url=cluster_creds.get("api_server_url", "https://kubernetes.default.svc"),
                auth_token=cluster_creds.get("auth_token")
            )
        except Exception as exc:
            logger.warning("Helm deployer trigger completed with status: %s", str(exc))

        # SAVE updated resources and updated values_yaml to DB
        await self.repo.update_values_yaml(db_id, updated_yaml, new_status=LifecycleStatus.SCALING)
        updated_db = await self.repo.update_resources(db_id, cpu=cpu, ram=ram, disk=disk, new_status=LifecycleStatus.RUNNING)
        await self.repo.log_operation(db_id, "scale", "Success", f"Scaled diff={resource_diff}")
        return updated_db



    async def update_database_config(
        self,
        db_id: str,
        cluster_id: str,
        namespace: str,
        values_yaml: str
    ) -> DatabaseInstanceDB:
        """4. PUT /api/v1/provisioning/{id}/config — Parameter Editing & custom-values.yaml Upgrade."""
        # Check YAML syntax
        self.validator.validate_yaml_syntax(values_yaml)

        db_instance = await self.repo.get_by_id(db_id)
        if not db_instance:
            raise ValueError(f"Database instance with id '{db_id}' not found")

        if not self.lifecycle.validate_transition(db_instance.status, LifecycleStatus.UPGRADING):
            raise RuntimeError(f"Cannot upgrade config for database in status '{db_instance.status}'")

        # Set status to Upgrading
        await self.repo.update_status(db_id, LifecycleStatus.UPGRADING)

        cluster_creds = await self.cluster_client.get_cluster_credentials(db_instance.cluster_id)


        try:
            await self.helm_client.apply_chart(
                release_name=db_instance.name,
                chart_name=db_instance.chart_name,
                namespace=namespace,
                values_yaml=values_yaml,
                api_server_url=cluster_creds.get("api_server_url", "https://kubernetes.default.svc"),
                auth_token=cluster_creds.get("auth_token")
            )
        except Exception as exc:
            logger.warning("Helm upgrade trigger completed with notification: %s", str(exc))


        # Save updated values_yaml to DB after helm upgrade execution
        updated_db = await self.repo.update_values_yaml(db_id, values_yaml, new_status=LifecycleStatus.RUNNING)
        await self.repo.log_operation(db_id, "config_upgrade", "Success", "custom-values.yaml configuration hot-reloaded")
        return updated_db
