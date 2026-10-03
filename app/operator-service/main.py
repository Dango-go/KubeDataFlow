import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os


sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import settings
from api.v1.endpoints.endpoints import router as operator_router

app = FastAPI(
    title=settings.API_SERVICE_NAME,
    openapi_url=f"{settings.API_V1}/openapi.json",
    description="Kubernetes Operator & Dynamic CRD Management Microservice for Database Platform"
)

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(operator_router)


@app.get("/health")
def root():
    return {"status": "success"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
