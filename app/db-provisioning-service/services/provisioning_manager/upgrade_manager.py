import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class UpgradeManager:

    @staticmethod
    def prepare_upgrade_payload(
        db_id: str,
        cluster_id: str,
        namespace: str,
        values_yaml: str
    ) -> Dict[str, Any]:
 
        return {
            "db_id": db_id,
            "cluster_id": cluster_id,
            "namespace": namespace,
            "values_yaml": values_yaml,
            "action": "upgrade"
        }
