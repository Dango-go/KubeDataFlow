import re
import yaml
from pathlib import Path
from typing import Dict, Any


class HelmValidator:
     
    RELEASE_NAME_REGEX = re.compile(r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$")

    @classmethod
    def validate_release_name(cls, release_name: str) -> None:
        """
        Validates the Helm release name according to K8s/Helm DNS-1123 standards.
        """
        if not release_name:
            raise ValueError("Release name cannot be empty.")

        if len(release_name) > 53:
            raise ValueError(
                f"Release name '{release_name}' is too long (maximum 53 characters allowed for Helm)."
            )

        if not cls.RELEASE_NAME_REGEX.match(release_name):
            raise ValueError(
                f"Release name '{release_name}' does not match DNS-1123 format. "
                "Only lowercase alphanumeric characters and hyphens are allowed (cannot start or end with a hyphen)."
            )

    @classmethod
    def validate_namespace(cls, namespace: str) -> None:
        """
        Validates the K8s Namespace name.
        """
        if not namespace:
            raise ValueError("Namespace cannot be empty.")

        if len(namespace) > 63:
            raise ValueError(f"Namespace '{namespace}' is too long (maximum 63 characters allowed).")

        if not cls.RELEASE_NAME_REGEX.match(namespace):
            raise ValueError(
                f"Namespace '{namespace}' contains invalid characters. "
                "Only lowercase alphanumeric characters and hyphens are allowed."
            )

    @classmethod
    def validate_yaml_content(cls, content: str) -> Dict[str, Any]:
        """
        Validates YAML content syntax (e.g., values.yaml).
        Returns parsed dictionary or raises ValueError on syntax error.
        """
        if not content or not content.strip():
            return {}

        try:
            parsed = yaml.safe_load(content)
            if parsed is not None and not isinstance(parsed, dict):
                raise ValueError("Content of values.yaml must be a valid key-value dictionary.")
            return parsed or {}
        except yaml.YAMLError as e:
            raise ValueError(f"YAML syntax error in values.yaml: {str(e)}")

    @classmethod
    def validate_chart_directory(cls, chart_path: str) -> Path:
        """
        Validates that the unpacked chart directory exists and contains Chart.yaml.
        """
        path = Path(chart_path)
        if not path.exists() or not path.is_dir():
            raise FileNotFoundError(f"Chart directory at path '{chart_path}' was not found.")

        chart_yaml = path / "Chart.yaml"
        if not chart_yaml.exists():
            raise FileNotFoundError(
                f"Directory '{chart_path}' is not a valid Helm chart (missing Chart.yaml)."
            )

        return path
