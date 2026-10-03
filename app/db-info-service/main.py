from contextlib import asynccontextmanager
from fastapi import FastAPI

from core.database import engine, Base, AsyncSessionLocal
from seeders.initial_catalog import seed_catalog
from api.v1.endpoints.catalog import router as catalog_router
from api.v1.endpoints.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create database tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed initial catalog (PostgreSQL, Redis, ClickHouse) if empty
    async with AsyncSessionLocal() as session:
        await seed_catalog(session)

    yield


app = FastAPI(
    title="DB Catalog Service",
    description="Microservice catalog for database engines, versions, resource presets, and schemas",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(catalog_router)
app.include_router(admin_router)


@app.get("/health")
def root():
    return {"status": "success"}
