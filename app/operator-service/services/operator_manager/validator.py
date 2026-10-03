import re
import yaml
from typing import Dict, Any, Union


class Validator:

    K8S_NAME_REGEX = re.compile(r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$")

    @classmethod
    def validate_name(cls, name: str) -> str:
        if not name or len(name) > 63:
            raise ValueError(f"Invalid resource name '{name}': length must be between 1 and 63 chars.")
        if not cls.K8S_NAME_REGEX.match(name):
            raise ValueError(
                f"Invalid resource name '{name}': must consist of lower case alphanumeric characters or '-'."
            )
        return name

    @classmethod
    def validate_namespace(cls, namespace: str) -> str:
        if not namespace or len(namespace) > 63:
            raise ValueError(f"Invalid namespace '{namespace}': length must be between 1 and 63 chars.")
        if not cls.K8S_NAME_REGEX.match(namespace):
            raise ValueError(f"Invalid namespace '{namespace}': must consist of lower case alphanumeric characters or '-'.")
        return namespace


    @classmethod
    def validate_crd_content(cls, content: Union[Dict[str, Any]]):
        parsing_content = content
        if isinstance(parsing_content, str):
            try:
                parsing_content = yaml.safe_load(parsing_content)
            except yaml.YAMLError as e:
                raise ValueError(f"Invalid YAML content: {e}")

        if not isinstance(parsing_content, dict):
            raise ValueError(f"Invalid content type")
        
        required_fields = ["apiVersion", "kind", "spec"]
        missing = [field for field in required_fields if field not in parsing_content]
        if missing:
            raise ValueError(f"CRD manifest is missing required Kubernetes top-level fields: {', '.join(missing)}")
