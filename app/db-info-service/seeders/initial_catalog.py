from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.engine import DatabaseEngineEntity
from models.version import DatabaseVersionEntity
from models.schema import ConfigSchemaEntity

# File initializes when main.py is run. All info in DB at this step.


async def seed_catalog(db: AsyncSession):
    """Seed initial database engines and versions if empty."""
    stmt = select(DatabaseEngineEntity)
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        return  # Catalog already seeded

    # 1. PostgreSQL
    postgres = DatabaseEngineEntity(
        name="PostgreSQL",
        engine_type="postgresql",
        category="Relational SQL",
        icon_url="https://raw.githubusercontent.com/postgresql/postgresql/master/doc/src/sgml/images/postgresql-logo.png",
        description="Powerful, open-source object-relational database system with high reliability and data integrity.",
        is_active=True
    )
    db.add(postgres)
    await db.flush() # save

    db.add_all([
        DatabaseVersionEntity(
            engine_id=postgres.id,
            version="16",
            helm_repo_url="https://charts.bitnami.com/bitnami",
            chart_name="postgresql",
            chart_version="13.1.5",
            is_default=True
        ),
        DatabaseVersionEntity(
            engine_id=postgres.id,
            version="15",
            helm_repo_url="https://charts.bitnami.com/bitnami",
            chart_name="postgresql",
            chart_version="12.10.0",
            is_default=False
        ),
        ConfigSchemaEntity(
            engine_id=postgres.id,
            json_schema={
                "type": "object",
                "properties": {
                    "max_connections": {"type": "integer", "title": "Max Connections", "default": 100, "minimum": 10, "maximum": 2000},
                    "shared_buffers": {"type": "string", "title": "Shared Buffers", "default": "128MB"},
                    "enable_ssl": {"type": "boolean", "title": "Enable SSL Encryption", "default": True}
                }
            }
        )
    ])

    # 2. Redis
    redis = DatabaseEngineEntity(
        name="Redis",
        engine_type="redis",
        category="In-Memory Key-Value",
        icon_url="https://redis.io/wp-content/uploads/2024/04/Logotype.svg",
        description="In-memory data structure store used as a database, cache, streaming engine, and message broker.",
        is_active=True
    )
    db.add(redis)
    await db.flush()

    db.add_all([
        DatabaseVersionEntity(
            engine_id=redis.id,
            version="7.2",
            helm_repo_url="https://charts.bitnami.com/bitnami",
            chart_name="redis",
            chart_version="18.0.1",
            is_default=True
        ),
        ConfigSchemaEntity(
            engine_id=redis.id,
            json_schema={
                "type": "object",
                "properties": {
                    "maxmemory_policy": {
                        "type": "string",
                        "title": "MaxMemory Policy",
                        "enum": ["allkeys-lru", "volatile-lru", "noeviction"],
                        "default": "allkeys-lru"
                    },
                    "appendonly": {"type": "boolean", "title": "Enable Persistence (AOF)", "default": True}
                }
            }
        )
    ])

    # 3. ClickHouse
    clickhouse = DatabaseEngineEntity(
        name="ClickHouse",
        engine_type="clickhouse",
        category="Columnar Analytical OLAP",
        icon_url="https://clickhouse.com/images/clickhouse-logo.svg",
        description="Fast open-source column-oriented database management system for real-time analytical reporting.",
        is_active=True
    )
    db.add(clickhouse)
    await db.flush()

    db.add_all([
        DatabaseVersionEntity(
            engine_id=clickhouse.id,
            version="24.1",
            helm_repo_url="https://charts.bitnami.com/bitnami",
            chart_name="clickhouse",
            chart_version="4.2.1",
            is_default=True
        ),
        ConfigSchemaEntity(
            engine_id=clickhouse.id,
            json_schema={
                "type": "object",
                "properties": {
                    "max_threads": {"type": "integer", "title": "Max Threads", "default": 8},
                    "max_execution_time": {"type": "integer", "title": "Max Query Execution Time (sec)", "default": 60}
                }
            }
        )
    ])

    await db.commit()
