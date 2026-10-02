from fastapi import FastAPI
from api.v1.endpoints.endpoints import router as db_provisioning_router

app = FastAPI(
    title="db-provisioning-service",
    description="Database Provisioning Service for Kubernetes Clusters",
    version="1.0.0"
)

app.include_router(db_provisioning_router)

@app.get("/health")
def root():
    return {"status": "success"}