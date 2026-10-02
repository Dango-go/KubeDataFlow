import yaml
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ValidationEngine:
    """Двигун валідації маніфестів, ім'ян, ресурсів та YAML конфігів."""

    @staticmethod
    def validate_yaml_syntax(yaml_content: str) -> Dict[str, Any]:
        """Синтаксична перевірка YAML тексту."""
        try:
            parsed = yaml.safe_load(yaml_content)
            if not isinstance(parsed, dict):
                raise ValueError("YAML content must resolve to a valid dictionary")
            return parsed
        except Exception as e:
            logger.error("YAML Validation failed: %s", str(e))
            raise ValueError(f"Invalid YAML syntax: {str(e)}")

    @staticmethod
    def validate_resource_limits(cpu: float, ram: float, disk: float) -> bool:
        """Перевіряє коректність виділених ресурсів."""
        if cpu < 0.1 or cpu > 128.0:
            raise ValueError("CPU cores must be between 0.1 and 128.0")
        if ram < 0.25 or ram > 512.0:
            raise ValueError("RAM size in GB must be between 0.25 and 512.0")
        if disk < 1.0 or disk > 20000.0:
            raise ValueError("Storage disk size in GB must be between 1.0 and 20000.0")
        return True
