import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class DesiredStateManager:

    @staticmethod
    def calculate_resource_diff(current_spec: Dict[str, Any], desired_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate resource diff for scaling. Get current_spec and desired_spec in dicts. """
        diff = {}
        for key in ['cpu', 'ram', 'disk']:
            if key in desired_spec and desired_spec[key] != current_spec.get(key):
                diff[key] = {
                    'from': current_spec.get(key),
                    'to': desired_spec[key]
                }
        return diff
