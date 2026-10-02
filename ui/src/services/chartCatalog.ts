export interface DatabaseChartOption {
  id: string;
  engine_type: string;
  name: string;
  publisher: string;
  chart_repo_url: string;
  chart_name: string;
  default_version: string;
  app_version: string;
  category: 'relational' | 'nosql' | 'inmemory' | 'vector' | 'timeseries';
  description: string;
  tags: string[];
  icon_url: string;
  default_values_yaml: string;
}

export const DATABASE_CHARTS_CATALOG: DatabaseChartOption[] = [
  // ==========================================
  // POSTGRESQL CHARTS
  // ==========================================
  {
    id: 'cnpg-postgresql',
    engine_type: 'postgresql',
    name: 'CloudNativePG (CNPG) Operator Chart',
    publisher: 'CloudNativePG / CNCF',
    chart_repo_url: 'https://cloudnative-pg.github.io/charts',
    chart_name: 'cnpg/cloudnative-pg',
    default_version: '0.21.0',
    app_version: '16.2',
    category: 'relational',
    description: 'Kubernetes native Helm chart for CloudNativePG operator managing HA PostgreSQL clusters, failover and backups.',
    tags: ['Operator Chart', 'HA Cluster', 'Barman Backups', 'CNCF'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    default_values_yaml: `crds:\n  create: true\nmonitoring:\n  podMonitorEnabled: true\nreplicaCount: 1`
  },
  {
    id: 'zalando-postgres',
    engine_type: 'postgresql',
    name: 'Zalando Postgres Operator Chart',
    publisher: 'Zalando Open Source',
    chart_repo_url: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator',
    chart_name: 'postgres-operator/postgres-operator',
    default_version: '1.11.0',
    app_version: '16.0',
    category: 'relational',
    description: 'Patroni-based HA PostgreSQL cluster operator Helm chart with Spilo Docker images.',
    tags: ['Operator Chart', 'Patroni HA', 'Spilo'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    default_values_yaml: `configKubernetes:\n  enable_pod_disruption_budget: true\n  storage_resize_mode: "pvc"`
  },
  {
    id: 'bitnami-postgresql',
    engine_type: 'postgresql',
    name: 'Bitnami PostgreSQL (Primary / Replicas)',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/postgresql',
    default_version: '15.5.2',
    app_version: '16.2.0',
    category: 'relational',
    description: 'Standard packaged Bitnami Helm chart for PostgreSQL Primary/Read-Replica deployment.',
    tags: ['Standalone Chart', 'Bitnami', 'Primary-Replica'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    default_values_yaml: `global:\n  postgresql:\n    auth:\n      postgresPassword: "DB_ADMIN_PASSWORD"\n      database: "appdb"\nprimary:\n  persistence:\n    enabled: true\n    size: 50Gi\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n    limits:\n      cpu: 2000m\n      memory: 8Gi\nreadReplicas:\n  replicaCount: 2`
  },

  // ==========================================
  // REDIS CHARTS
  // ==========================================
  {
    id: 'opstree-redis',
    engine_type: 'redis',
    name: 'Opstree Redis Operator Chart',
    publisher: 'OT-CONTAINER-KIT',
    chart_repo_url: 'https://ot-container-kit.github.io/helm-charts',
    chart_name: 'ot-container-kit/redis-operator',
    default_version: '0.16.0',
    app_version: '7.2.4',
    category: 'inmemory',
    description: 'Helm chart for Redis Operator supporting Standalone, Redis Cluster and Sentinel HA.',
    tags: ['Operator Chart', 'Redis Cluster', 'Sentinel HA'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/redis/redis.png',
    default_values_yaml: `redisOperator:\n  image:\n    tag: v0.16.0`
  },
  {
    id: 'bitnami-redis',
    engine_type: 'redis',
    name: 'Bitnami Redis (Replication / Sentinel)',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/redis',
    default_version: '19.6.4',
    app_version: '7.2.5',
    category: 'inmemory',
    description: 'High performance in-memory key-value store chart with Master-Slave replication.',
    tags: ['Standalone Chart', 'In-Memory', 'Bitnami'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/redis/redis.png',
    default_values_yaml: `architecture: replication\nauth:\n  enabled: true\n  password: "REDIS_SECURE_AUTH"\nmaster:\n  persistence:\n    enabled: true\n    size: 20Gi\nreplica:\n  replicaCount: 2`
  },

  // ==========================================
  // CLICKHOUSE CHARTS
  // ==========================================
  {
    id: 'altinity-clickhouse',
    engine_type: 'clickhouse',
    name: 'Altinity ClickHouse Operator Chart',
    publisher: 'Altinity',
    chart_repo_url: 'https://altinity.github.io/clickhouse-operator',
    chart_name: 'altinity/clickhouse-operator',
    default_version: '0.23.5',
    app_version: '24.3.2',
    category: 'relational',
    description: 'Helm chart for Altinity ClickHouse Operator managing sharded analytical clusters.',
    tags: ['Operator Chart', 'OLAP BigData', 'Altinity'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/clickhouse/clickhouse.png',
    default_values_yaml: `operator:\n  resources:\n    limits:\n      cpu: 500m\n      memory: 512Mi`
  },
  {
    id: 'bitnami-clickhouse',
    engine_type: 'clickhouse',
    name: 'Bitnami ClickHouse Helm Chart',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/clickhouse',
    default_version: '6.1.4',
    app_version: '24.1.8',
    category: 'relational',
    description: 'Pre-packaged Helm chart for ClickHouse with Keeper coordination.',
    tags: ['Standalone Chart', 'Fast Analytics', 'Bitnami'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/clickhouse/clickhouse.png',
    default_values_yaml: `shards: 2\nreplicas: 2\npersistence:\n  enabled: true\n  size: 100Gi`
  },

  // ==========================================
  // MONGODB CHARTS
  // ==========================================
  {
    id: 'mongodb-community-operator',
    engine_type: 'mongodb',
    name: 'MongoDB Community Operator Chart',
    publisher: 'MongoDB Inc.',
    chart_repo_url: 'https://mongodb.github.io/helm-charts',
    chart_name: 'mongodb/mongodb-community-operator',
    default_version: '0.9.0',
    app_version: '7.0.5',
    category: 'nosql',
    description: 'Official Helm chart for MongoDB Community Operator.',
    tags: ['Operator Chart', 'Official MongoDB'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    default_values_yaml: `operator:\n  createOperator: true`
  },
  {
    id: 'percona-mongodb-operator',
    engine_type: 'mongodb',
    name: 'Percona Server for MongoDB (PSMDB) Chart',
    publisher: 'Percona',
    chart_repo_url: 'https://percona.github.io/percona-helm-charts',
    chart_name: 'percona/psmdb-operator',
    default_version: '1.16.0',
    app_version: '7.0',
    category: 'nosql',
    description: 'Enterprise grade MongoDB operator chart with automated sharding and backups.',
    tags: ['Operator Chart', 'Percona Enterprise', 'Sharding'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    default_values_yaml: `pmm:\n  enabled: false`
  },
  {
    id: 'bitnami-mongodb',
    engine_type: 'mongodb',
    name: 'Bitnami MongoDB (Standalone / ReplicaSet)',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mongodb',
    default_version: '15.6.2',
    app_version: '7.0.9',
    category: 'nosql',
    description: 'Bitnami Helm chart for MongoDB document database.',
    tags: ['Standalone Chart', 'Document DB', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    default_values_yaml: `architecture: replicaset\nreplicaCount: 3\nauth:\n  rootPassword: "ADMIN_ROOT_PASSWORD"\npersistence:\n  size: 40Gi`
  },

  // ==========================================
  // MYSQL & MARIADB CHARTS
  // ==========================================
  {
    id: 'percona-xtradb-mysql',
    engine_type: 'mysql',
    name: 'Percona XtraDB Cluster (PXC) MySQL Operator Chart',
    publisher: 'Percona',
    chart_repo_url: 'https://percona.github.io/percona-helm-charts',
    chart_name: 'percona/pxc-operator',
    default_version: '1.14.0',
    app_version: '8.0.35',
    category: 'relational',
    description: 'Synchronous multi-master MySQL cluster operator Helm chart with HAProxy load balancing.',
    tags: ['Operator Chart', 'Galera Multi-Master', 'Percona'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    default_values_yaml: `pxc:\n  size: 3\nhaproxy:\n  enabled: true`
  },
  {
    id: 'bitnami-mysql',
    engine_type: 'mysql',
    name: 'Bitnami MySQL (Primary / Replicas)',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mysql',
    default_version: '11.1.18',
    app_version: '8.0.36',
    category: 'relational',
    description: 'Packaged Bitnami MySQL Helm chart with configurable primary/secondary topology.',
    tags: ['Standalone Chart', 'Bitnami'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    default_values_yaml: `architecture: replication\nauth:\n  rootPassword: "DB_ROOT_PASSWORD"\nprimary:\n  persistence:\n    size: 50Gi\nsecondary:\n  replicaCount: 2`
  },
  {
    id: 'bitnami-mariadb',
    engine_type: 'mariadb',
    name: 'Bitnami MariaDB Chart',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mariadb',
    default_version: '19.0.8',
    app_version: '11.2.3',
    category: 'relational',
    description: 'Community fork of MySQL optimized for performance with optional Galera cluster.',
    tags: ['Standalone Chart', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/mariadb/mariadb-icon.svg',
    default_values_yaml: `auth:\n  rootPassword: "MARIADB_ROOT_PASSWORD"\nprimary:\n  persistence:\n    size: 40Gi`
  },

  // ==========================================
  // SCYLLADB & CASSANDRA CHARTS
  // ==========================================
  {
    id: 'scylla-operator',
    engine_type: 'scylladb',
    name: 'ScyllaDB Operator Chart',
    publisher: 'ScyllaDB Inc.',
    chart_repo_url: 'https://operator.scylladb.com/charts',
    chart_name: 'scylla-operator/scylla',
    default_version: '1.12.0',
    app_version: '5.4.0',
    category: 'nosql',
    description: 'C++ Cassandra-compatible NoSQL database operator Helm chart.',
    tags: ['Operator Chart', 'Ultra-Low Latency', 'ScyllaDB'],
    icon_url: '/scylladb.png',
    default_values_yaml: `operator:\n  replicaCount: 1`
  },
  {
    id: 'bitnami-cassandra',
    engine_type: 'cassandra',
    name: 'Bitnami Apache Cassandra Chart',
    publisher: 'Bitnami / VMware Tanzu',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/cassandra',
    default_version: '11.0.3',
    app_version: '4.1.4',
    category: 'nosql',
    description: 'Wide-column distributed NoSQL store chart.',
    tags: ['Standalone Chart', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/apache_cassandra/apache_cassandra-icon.svg',
    default_values_yaml: `replicaCount: 3\npersistence:\n  size: 100Gi`
  },

  // ==========================================
  // VECTOR & OTHER CHARTS
  // ==========================================
  {
    id: 'qdrant-official',
    engine_type: 'qdrant',
    name: 'Qdrant Vector Database Chart',
    publisher: 'Qdrant Team',
    chart_repo_url: 'https://qdrant.github.io/qdrant-helm',
    chart_name: 'qdrant/qdrant',
    default_version: '0.9.0',
    app_version: '1.8.2',
    category: 'vector',
    description: 'Official Helm chart for Qdrant Vector DB with Raft consensus.',
    tags: ['Vector Search', 'AI & Embeddings', 'Official'],
    icon_url: 'https://raw.githubusercontent.com/qdrant/qdrant/master/docs/logo.svg',
    default_values_yaml: `replicaCount: 3\nconfig:\n  cluster:\n    enabled: true\npersistence:\n  size: 50Gi`
  },
  {
    id: 'milvus-operator',
    engine_type: 'milvus',
    name: 'Milvus Operator Chart',
    publisher: 'Milvus / LF AI & Data',
    chart_repo_url: 'https://zilliztech.github.io/milvus-operator',
    chart_name: 'milvus-operator/milvus-operator',
    default_version: '0.9.15',
    app_version: '2.3.10',
    category: 'vector',
    description: 'Helm chart for Milvus vector database operator.',
    tags: ['Operator Chart', 'LF AI & Data'],
    icon_url: 'https://raw.githubusercontent.com/milvus-io/milvus/master/assets/milvus_logo.svg',
    default_values_yaml: `operator:\n  replicaCount: 1`
  },
  {
    id: 'dragonfly-official',
    engine_type: 'dragonfly',
    name: 'Dragonfly Operator Chart',
    publisher: 'DragonflyDB Inc.',
    chart_repo_url: 'https://dragonflydb.github.io/helm-charts',
    chart_name: 'dragonfly/dragonfly-operator',
    default_version: '1.1.2',
    app_version: '1.16.0',
    category: 'inmemory',
    description: 'Next-generation in-memory data store operator Helm chart.',
    tags: ['Operator Chart', '25x Throughput'],
    icon_url: 'https://raw.githubusercontent.com/dragonflydb/dragonfly/main/docs/images/logo-dark.png',
    default_values_yaml: `dragonfly:\n  replicas: 2`
  },
  {
    id: 'timescaledb-official',
    engine_type: 'timescaledb',
    name: 'TimescaleDB Ha Chart',
    publisher: 'Timescale Inc.',
    chart_repo_url: 'https://charts.timescale.com',
    chart_name: 'timescale/timescaledb-single',
    default_version: '0.34.0',
    app_version: '2.14.2',
    category: 'timeseries',
    description: 'Time-series PostgreSQL hyper-tables chart.',
    tags: ['Time-Series SQL', 'Timescale'],
    icon_url: 'https://www.vectorlogo.zone/logos/timescale/timescale-icon.svg',
    default_values_yaml: `replicaCount: 2\npersistence:\n  size: 100Gi`
  }
];
