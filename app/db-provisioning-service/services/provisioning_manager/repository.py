import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import DatabaseInstanceDB, DeploymentLogDB

logger = logging.getLogger(__name__)


class DatabaseRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_databases(self) -> List[DatabaseInstanceDB]:
        result = await self.db.execute(select(DatabaseInstanceDB))
        return list(result.scalars().all())

    async def get_all_instances(self) -> List[DatabaseInstanceDB]:
        return await self.get_all_databases()

    async def create_instance(
        self,
        name: str,
        engine_type: str,
        version: str,
        cluster_id: str = "cluster-1",
        cluster_name: str = "default-prod",
        namespace: str = "databases",
        cpu: float = 1.0,
        ram: float = 2.0,
        disk: float = 20.0,
        chart_name: str = "postgresql",
        values_yaml: Optional[str] = None
    ) -> DatabaseInstanceDB:
        instance = DatabaseInstanceDB(
            name=name,
            engine_type=engine_type,
            version=version,
            cluster_id=cluster_id,
            cluster_name=cluster_name,
            namespace=namespace,
            cpu=cpu,
            ram=ram,
            disk=disk,
            status="Running",
            chart_name=chart_name,
            values_yaml=values_yaml
        )
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def get_by_id(self, db_id: str) -> Optional[DatabaseInstanceDB]:

        result = await self.db.execute(
            select(DatabaseInstanceDB).where(DatabaseInstanceDB.id == db_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, db_id: str, new_status: str) -> Optional[DatabaseInstanceDB]:
        instance = await self.get_by_id(db_id)
        if instance:
            instance.status = new_status
            await self.db.commit()
            await self.db.refresh(instance)
        else:
            raise ValueError(f"Database instance with id '{db_id}' not found")
        return instance

    # update scaling
    async def update_resources(
        self,
        db_id: str,
        cpu: Optional[float] = None,
        ram: Optional[float] = None,
        disk: Optional[float] = None,
        new_status: str = "Running"
    ) -> Optional[DatabaseInstanceDB]:

        instance = await self.get_by_id(db_id)
        if instance:
            if cpu is not None:
                instance.cpu = cpu
            if ram is not None:
                instance.ram = ram
            if disk is not None:
                instance.disk = disk
            instance.status = new_status
            await self.db.commit()
            await self.db.refresh(instance)
        else:
            raise ValueError(f"Database instance with id '{db_id}' not found")
        return instance

    async def update_values_yaml(self, db_id: str, values_yaml: str, new_status: str = "Running") -> Optional[DatabaseInstanceDB]:
        instance = await self.get_by_id(db_id)
        if instance:
            instance.values_yaml = values_yaml
            instance.status = new_status
            await self.db.commit()
            await self.db.refresh(instance)
        return instance

    # log operation (db_provision_logs)
    async def log_operation(self, database_id: str, operation: str, status: str, details: str = ""):
        log_entry = DeploymentLogDB(
            database_id=database_id,
            operation=operation,
            status=status,
            details=details
        )
        self.db.add(log_entry)
        await self.db.commit()
