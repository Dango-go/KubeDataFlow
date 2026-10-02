import httpx
from typing import List, Dict, Any
from providers.base import BaseClusterScanner


class DigitalOceanClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        token = credentials.get("token")
        if not token:
            raise ValueError("DigitalOcean token is missing")

        headers = {"Authorization": f"Bearer {token}"}
        url = "https://api.digitalocean.com/v2/kubernetes/clusters"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                raise RuntimeError(f"DigitalOcean API error: {response.text}")

            data = response.json()
            clusters = data.get("kubernetes_clusters", [])
            clusters_data = []
            for c in clusters:
                clusters_data.append({
                    "name": c.get("name"),
                    "region": c.get("region"),
                    "version": c.get("version"),
                    "status": c.get("status", {}).get("state", "running"),
                    "endpoint": c.get("endpoint"),
                    "raw": c
                })
            return clusters_data
