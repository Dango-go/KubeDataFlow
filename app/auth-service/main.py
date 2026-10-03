from contextlib import asynccontextmanager
from fastapi import FastAPI
from api.v1.endpoints.auth import router 
from core.db import engine
from models.user import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Auth Microservice", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health")
def root():
    return {"status": "success"}

@app.get("/ready")
async def ready_check():
    return {"status": "ok"}