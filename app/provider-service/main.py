from fastapi import FastAPI
from app.api.v1.routers import router
from app.core.db import engine, Base
import app.domain.models

app = FastAPI(title="Provider Service", version="1.0.0")

@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(router)


@app.get("/health")
def root():
    return {"status": "success"}