import logging
from typing import Dict, Any, List
from config import settings

logger = logging.getLogger(__name__)

# Cloud provider multipliers
PROVIDER_MULTIPLIERS = {
    "aws": 1.0,
    "gcp": 1.05,
    "azure": 1.08,
    "digitalocean": 0.85,
    "on-premise": 0.50,
}

class CostCalculatorEngine:

    @staticmethod
    def calculate_instance_cost(
        cpu_cores: float,
        ram_gb: float,
        storage_gb: float,
        backup_storage_gb: float = 0.0,
        provider: str = "aws"
    ) -> Dict[str, float]:
        """
        Calculates hourly, daily, and monthly breakdown costs for a single DB instance.
        """
        multiplier = PROVIDER_MULTIPLIERS.get(provider.lower(), 1.0)

        # Base hourly calculations
        cpu_cost_hr = (cpu_cores * settings.BASE_CPU_HOURLY_RATE) * multiplier
        ram_cost_hr = (ram_gb * settings.BASE_RAM_GB_HOURLY_RATE) * multiplier
        storage_cost_hr = (storage_gb * settings.BASE_STORAGE_GB_HOURLY_RATE) * multiplier
        backup_cost_hr = (backup_storage_gb * settings.BASE_BACKUP_GB_HOURLY_RATE) * multiplier

        hourly_total = cpu_cost_hr + ram_cost_hr + storage_cost_hr + backup_cost_hr
        daily_total = hourly_total * 24.0
        monthly_total = daily_total * 30.0

        return {
            "hourly_total": round(hourly_total, 4),
            "daily_total": round(daily_total, 2),
            "monthly_total": round(monthly_total, 2),
            "breakdown": {
                "cpu_monthly": round(cpu_cost_hr * 24.0 * 30.0, 2),
                "ram_monthly": round(ram_cost_hr * 24.0 * 30.0, 2),
                "storage_monthly": round(storage_cost_hr * 24.0 * 30.0, 2),
                "backup_monthly": round(backup_cost_hr * 24.0 * 30.0, 2)
            }
        }

    @staticmethod
    def generate_budget_forecast(
        current_monthly_total: float,
        growth_rate_percent: float = 5.0
    ) -> Dict[str, Any]:
        """
        Generates 30-day, 60-day, and 90-day budget projections.
        """
        month1 = current_monthly_total
        month2 = month1 * (1.0 + (growth_rate_percent / 100.0))
        month3 = month2 * (1.0 + (growth_rate_percent / 100.0))

        return {
            "current_monthly_spend": round(current_monthly_total, 2),
            "forecast_30_days": round(month1, 2),
            "forecast_60_days": round(month2, 2),
            "forecast_90_days": round(month3, 2),
            "projected_quarterly_total": round(month1 + month2 + month3, 2)
        }
