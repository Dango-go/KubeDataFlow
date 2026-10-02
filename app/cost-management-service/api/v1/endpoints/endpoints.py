from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from core.database import get_db
from services.cost_calculator import CostCalculatorEngine, PROVIDER_MULTIPLIERS
from config import settings
from api.v1.endpoints.schemas import (
    CostEstimateRequest,
    CostEstimateResponse,
    CostSummaryResponse,
    InstanceCostItem,
    ForecastResponse,
    PricingMatrixResponse,
    ProviderRateItem
)

router = APIRouter(prefix="/api/v1/cost", tags=["cost-management"])

# Mock active instances data for demonstrative FinOps analytics
MOCK_INSTANCES = [
    {
        "id": "db-inst-01",
        "name": "users-service-db",
        "engine_type": "postgresql",
        "cluster_name": "aws-eks-us-east-1",
        "namespace": "production",
        "provider": "aws",
        "cpu_cores": 4.0,
        "ram_gb": 16.0,
        "storage_gb": 100.0,
    },
    {
        "id": "db-inst-02",
        "name": "cache-redis-cluster",
        "engine_type": "redis",
        "cluster_name": "aws-eks-us-east-1",
        "namespace": "production",
        "provider": "aws",
        "cpu_cores": 2.0,
        "ram_gb": 8.0,
        "storage_gb": 20.0,
    },
    {
        "id": "db-inst-03",
        "name": "analytics-clickhouse",
        "engine_type": "clickhouse",
        "cluster_name": "gcp-gke-europe-west1",
        "namespace": "analytics",
        "provider": "gcp",
        "cpu_cores": 8.0,
        "ram_gb": 32.0,
        "storage_gb": 500.0,
    }
]


# POST /api/v1/cost/estimate - Pre-flight calculation before DB deployment
@router.post("/estimate", response_model=CostEstimateResponse)
async def estimate_cost(request: CostEstimateRequest):
    """Calculates estimated hourly, daily, and monthly cost for a given database configuration."""
    calc = CostCalculatorEngine.calculate_instance_cost(
        cpu_cores=request.cpu_cores,
        ram_gb=request.ram_gb,
        storage_gb=request.storage_gb,
        backup_storage_gb=request.backup_storage_gb or 0.0,
        provider=request.provider or "aws"
    )

    return CostEstimateResponse(
        engine_type=request.engine_type,
        provider=request.provider or "aws",
        hourly_cost=calc["hourly_total"],
        daily_cost=calc["daily_total"],
        monthly_cost=calc["monthly_total"],
        breakdown=calc["breakdown"]
    )


# GET /api/v1/cost/summary - Overall monthly infrastructure spend summary
@router.get("/summary", response_model=CostSummaryResponse)
async def get_cost_summary(db: AsyncSession = Depends(get_db)):
    """Retrieves overall monthly spend, compute vs storage breakdown, and instance details."""
    instance_items: List[InstanceCostItem] = []
    total_spend = 0.0
    total_compute = 0.0
    total_storage = 0.0

    for inst in MOCK_INSTANCES:
        calc = CostCalculatorEngine.calculate_instance_cost(
            cpu_cores=inst["cpu_cores"],
            ram_gb=inst["ram_gb"],
            storage_gb=inst["storage_gb"],
            provider=inst["provider"]
        )
        monthly = calc["monthly_total"]
        compute_m = calc["breakdown"]["cpu_monthly"] + calc["breakdown"]["ram_monthly"]
        storage_m = calc["breakdown"]["storage_monthly"]

        total_spend += monthly
        total_compute += compute_m
        total_storage += storage_m

        instance_items.append(
            InstanceCostItem(
                id=inst["id"],
                name=inst["name"],
                engine_type=inst["engine_type"],
                cluster_name=inst["cluster_name"],
                namespace=inst["namespace"],
                provider=inst["provider"],
                cpu_cores=inst["cpu_cores"],
                ram_gb=inst["ram_gb"],
                storage_gb=inst["storage_gb"],
                compute_monthly_cost=round(compute_m, 2),
                storage_monthly_cost=round(storage_m, 2),
                total_monthly_cost=round(monthly, 2)
            )
        )

    return CostSummaryResponse(
        total_monthly_budget=round(total_spend, 2),
        compute_cost_total=round(total_compute, 2),
        storage_cost_total=round(total_storage, 2),
        active_instances_count=len(instance_items),
        instances=instance_items
    )


# GET /api/v1/cost/forecast - Financial budget forecasting
@router.get("/forecast", response_model=ForecastResponse)
async def get_budget_forecast():
    """Generates 30, 60, and 90-day financial budget projections for infrastructure planning."""
    # Compute current monthly spend
    summary = await get_cost_summary()
    current_spend = summary.total_monthly_budget

    forecast = CostCalculatorEngine.generate_budget_forecast(current_spend, growth_rate_percent=5.0)

    return ForecastResponse(
        current_monthly_spend=forecast["current_monthly_spend"],
        forecast_30_days=forecast["forecast_30_days"],
        forecast_60_days=forecast["forecast_60_days"],
        forecast_90_days=forecast["forecast_90_days"],
        projected_quarterly_total=forecast["projected_quarterly_total"]
    )


# GET /api/v1/cost/pricing-matrix - Pricing matrix rates per cloud provider
@router.get("/pricing-matrix", response_model=PricingMatrixResponse)
async def get_pricing_matrix():
    """Returns the pricing matrix for CPU, RAM, Storage across supported Cloud Providers."""
    rates = []
    for provider, mult in PROVIDER_MULTIPLIERS.items():
        rates.append(
            ProviderRateItem(
                provider=provider,
                multiplier=mult,
                cpu_hourly=round(settings.BASE_CPU_HOURLY_RATE * mult, 4),
                ram_gb_hourly=round(settings.BASE_RAM_GB_HOURLY_RATE * mult, 4),
                storage_gb_hourly=round(settings.BASE_STORAGE_GB_HOURLY_RATE * mult, 5),
                backup_gb_hourly=round(settings.BASE_BACKUP_GB_HOURLY_RATE * mult, 5)
            )
        )
    return PricingMatrixResponse(rates=rates)
