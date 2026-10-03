from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseClusterScanner(ABC):
    @abstractmethod
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        """Сканує кластери в хмарі за наданими credentials."""
        pass
