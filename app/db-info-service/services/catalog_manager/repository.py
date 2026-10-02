from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.engine import DatabaseEngineEntity
from models.version import DatabaseVersionEntity
from models.schema import ConfigSchemaEntity
from core.exceptions import EngineNotFoundError, VersionNotSupportedError


class CatalogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_active_engines(self) -> List[DatabaseEngineEntity]:
        """Fetch all active database engines and their supported versions."""
        stmt = (
            select(DatabaseEngineEntity)
            .where(DatabaseEngineEntity.is_active == True)
            .options(
                selectinload(DatabaseEngineEntity.versions)
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_chart_info(self, engine_type: str, version_str: Optional[str] = None) -> DatabaseVersionEntity:
        """Fetch Helm chart deployment details for a specific engine and version."""
        stmt = (
            select(DatabaseEngineEntity)
            .where(
                DatabaseEngineEntity.engine_type == engine_type,
                DatabaseEngineEntity.is_active == True
            )
            .options(
                selectinload(DatabaseEngineEntity.versions)
            )
        )
        result = await self.db.execute(stmt)
        engine = result.scalar_one_or_none()

        if not engine:
            raise EngineNotFoundError(f"Database engine '{engine_type}' was not found in catalog.")

        if version_str:
            for v in engine.versions:
                if v.version == version_str:
                    return v
            raise VersionNotSupportedError(f"Version '{version_str}' is not supported for '{engine_type}'.")
        else:
            for v in engine.versions:
                if v.is_default:
                    return v
            if engine.versions:
                return engine.versions[0]

        raise VersionNotSupportedError(f"No valid version found for engine '{engine_type}'.")

    async def create_engine(
        self,
        name: str,
        engine_type: str,
        category: str,
        icon_url: Optional[str] = None,
        description: Optional[str] = None
    ) -> DatabaseEngineEntity:
        """Create a new database engine entry in catalog."""
        engine = DatabaseEngineEntity(
            name=name,
            engine_type=engine_type,
            category=category,
            icon_url=icon_url,
            description=description,
            is_active=True
        )
        self.db.add(engine)
        await self.db.flush()
        return engine
