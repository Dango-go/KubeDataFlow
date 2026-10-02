import yaml
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ScalingManager:

    @staticmethod
    def format_k8s_resources(cpu: Optional[float], ram: Optional[float], disk: Optional[float]) -> Dict[str, Any]:
        spec = {}
        if cpu is not None:
            spec['cpu_milli'] = f"{int(cpu * 1000)}m" # cpu 0.1 - 128 cores
        if ram is not None:
            spec['memory_gi'] = f"{ram}Gi"
        if disk is not None:
            spec['storage_gi'] = f"{disk}Gi"
        return spec

    @staticmethod
    def update_resources_in_yaml(
        existing_yaml: str,
        cpu: Optional[float] = None,
        ram: Optional[float] = None,
        disk: Optional[float] = None
    ) -> str:

        try:
            data = yaml.safe_load(existing_yaml) if existing_yaml else {}
            if not isinstance(data, dict):
                data = {}
        except Exception:
            data = {}

        if "resources" not in data or not isinstance(data["resources"], dict):
            data["resources"] = {"requests": {}, "limits": {}}

        if "requests" not in data["resources"]:
            data["resources"]["requests"] = {}
        if "limits" not in data["resources"]:
            data["resources"]["limits"] = {}

        if cpu is not None:
            data["resources"]["requests"]["cpu"] = f"{int(cpu * 1000)}m"
            data["resources"]["limits"]["cpu"] = f"{int(cpu * 1000)}m"
        if ram is not None:
            data["resources"]["requests"]["memory"] = f"{ram}Gi"
            data["resources"]["limits"]["memory"] = f"{ram}Gi"
        if disk is not None:
            if "persistence" not in data or not isinstance(data["persistence"], dict):
                data["persistence"] = {}
            data["persistence"]["size"] = f"{disk}Gi"

        return yaml.dump(data, default_flow_style=False)
