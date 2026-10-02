from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Pre-flight cost calculation request
class CostEstimateRequest(BaseModel):
    engine_type: str = Field(..., description="e.g. postgresql, redis, clickhouse")
    cpu_cores: float = Field(..., description="Number of CPU cores e.g. 2.0")
    ram_gb: float = Field(..., description="RAM size in GB e.g. 8.0")
    storage_gb: float = Field(..., description="Storage size in GB e.g. 100.0")
    backup_storage_gb: Optional[float] = Field(10.0, description="Backup storage size in GB")
    provider: Optional[str] = Field("aws", description="Cloud provider e.g. aws, gcp, azure, digitalocean, on-premise")

# Cost estimate response
class CostEstimateResponse(BaseModel):
    engine_type: str
    provider: str
    hourly_cost: float
    daily_cost: float
    monthly_cost: float
    breakdown: Dict[str, float]

# Active instance cost breakdown
class InstanceCostItem(BaseModel):
    id: str
    name: str
    engine_type: str
    cluster_name: str
    namespace: str
    provider: str
    cpu_cores: float
    ram_gb: float
    storage_gb: float
    compute_monthly_cost: float
    storage_monthly_cost: float
    total_monthly_cost: float

# Overall cost summary
class CostSummaryResponse(BaseModel):
    total_monthly_budget: float
    compute_cost_total: float
    storage_cost_total: float
    active_instances_count: int
    instances: List[InstanceCostItem]

# Budget forecast response
class ForecastResponse(BaseModel):
    current_monthly_spend: float
    forecast_30_days: float
    forecast_60_days: float
    forecast_90_days: float
    projected_quarterly_total: float

# Pricing matrix rate item
class ProviderRateItem(BaseModel):
    provider: str
    multiplier: float
    cpu_hourly: float
    ram_gb_hourly: float
    storage_gb_hourly: float
    backup_gb_hourly: float

class PricingMatrixResponse(BaseModel):
    rates: List[ProviderRateItem]
