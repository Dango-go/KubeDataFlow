import yaml
from typing import Dict, Any, Tuple


KNOWN_PLURALS = {
    # Core Kubernetes Resources (apiVersion: v1)
    ("", "Secret"): "secrets",
    ("", "ConfigMap"): "configmaps",
    ("", "Service"): "services",
    ("", "Pod"): "pods",
    ("", "ServiceAccount"): "serviceaccounts",
    ("", "PersistentVolumeClaim"): "persistentvolumeclaims",
    ("", "Namespace"): "namespaces",
    # CloudNativePG
    ("postgresql.cnpg.io", "Cluster"): "clusters",
    ("postgresql.cnpg.io", "Backup"): "backups",
    ("postgresql.cnpg.io", "ScheduledBackup"): "scheduledbackups",
    ("postgresql.cnpg.io", "Pooler"): "poolers",
    # Zalando Postgres
    ("acid.zalan.do", "postgresql"): "postgresqls",
    ("acid.zalan.do", "Postgresql"): "postgresqls",
    # Opstree Redis
    ("redis.redis.opstreelabs.in", "Redis"): "redis",
    ("redis.redis.opstreelabs.in", "RedisCluster"): "redisclusters",
    ("redis.redis.opstreelabs.in", "RedisReplication"): "redisreplications",
    # Altinity ClickHouse
    ("clickhouse.altinity.com", "ClickHouseInstallation"): "clickhouseinstallations",
    # MongoDB Community Operator
    ("mongodbcommunity.mongodb.com", "MongoDBCommunity"): "mongodbcommunity",
    # KubeDB
    ("kubedb.com", "Postgres"): "postgreses",
    ("kubedb.com", "Redis"): "redises",
    ("kubedb.com", "MongoDB"): "mongodbs",
    ("kubedb.com", "MySQL"): "mysqls",
    ("kubedb.com", "MariaDB"): "mariadbs",
    ("kubedb.com", "Elasticsearch"): "elasticsearches",
    # RabbitMQ
    ("rabbitmq.com", "RabbitmqCluster"): "rabbitmqclusters",
    # Percona
    ("psmdb.percona.com", "PerconaServerMongoDB"): "perconaservermongodbs",
    ("pg.percona.com", "PerconaPGCluster"): "perconapgclusters",
}


class CRDBuilder:
    @staticmethod
    def parse_yaml(content: str) -> Dict[str, Any]:
        try:
            return yaml.safe_load(content) # in python structures
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse YAML content from UI editor: {e}")

    @staticmethod
    def extract_gvk(manifest: Dict[str, Any]) -> Tuple[str, str, str, str]:
        api_version = manifest.get("apiVersion", "")
        kind = manifest.get("kind", "")

        # For crd manifests "/" is present
        if "/" in api_version:
            group, version = api_version.split("/", 1)
        else:
            group, version = "", api_version

        # Look up known operator plural or compute standard plural
        if (group, kind) in KNOWN_PLURALS:
            plural_url = KNOWN_PLURALS[(group, kind)]
        elif (group, kind.capitalize()) in KNOWN_PLURALS:
            plural_url = KNOWN_PLURALS[(group, kind.capitalize())]
        elif kind.lower().endswith("s") or kind.lower().endswith("sh") or kind.lower().endswith("ch"):
            plural_url = f"{kind.lower()}es"
        elif kind.lower().endswith("y") and not kind.lower().endswith(("ay", "ey", "oy", "uy")):
            plural_url = f"{kind.lower()[:-1]}ies"
        else:
            plural_url = f"{kind.lower()}s"   

        return group, version, kind, plural_url

    @staticmethod
    def prepare_manifest(
        manifest: Dict[str, Any],
        resource_name: str,
        target_namespace: str,
    ) -> Dict[str, Any]:
 
        metadata = manifest.setdefault("metadata", {})
        metadata["name"] = resource_name
        metadata["namespace"] = target_namespace

        labels = metadata.setdefault("labels", {})
        labels["app.kubernetes.io/managed-by"] = "db-idp-platform"

        return manifest
