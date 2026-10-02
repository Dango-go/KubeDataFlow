from fastapi import FastAPI
from api.v1.endpoints.endpoints import router as endpoints_router
from core.database import engine, Base
import db.models.models

app = FastAPI()

app.include_router(endpoints_router)

@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def root():
    return {"status": "success"}