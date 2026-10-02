import { DatabaseCatalogItem, DeployedDatabase, CloudCredential, K8sCluster, DatabaseMetrics } from '../types';

// Crisp inline SVG Data URIs matching user-provided logo images
const CLICKHOUSE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="5" y="70" width="14" height="20" fill="%23FF0000"/><rect x="27" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="49" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="71" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="91" y="40" width="7" height="25" fill="%23FFCC00"/></svg>`;

const QUESTDB_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 A35 35 0 1 0 75 75 L90 90 L75 75 A35 35 0 0 0 50 10 Z M50 28 A17 17 0 1 1 33 45 A17 17 0 0 1 50 28 Z" fill="%23D93672"/><path d="M40 50 L85 90 L95 80 L50 40 Z" fill="%23D93672"/></svg>`;

const DRAGONFLY_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 15 C44 15 40 22 40 28 L45 50 L45 85 L50 92 L55 85 L55 50 L60 28 C60 22 56 15 50 15 Z" fill="%23FFFFFF"/><path d="M45 30 C28 15 8 22 14 34 C20 42 40 40 45 42 Z" fill="%23FFFFFF"/><path d="M55 30 C72 15 92 22 86 34 C80 42 60 40 55 42 Z" fill="%23FFFFFF"/><path d="M45 46 C28 38 10 46 16 54 C22 60 40 54 45 52 Z" fill="%23FFFFFF"/><path d="M55 46 C72 38 90 46 84 54 C78 60 60 54 55 52 Z" fill="%23FFFFFF"/></svg>`;

export const CATALOG_ITEMS: DatabaseCatalogItem[] = [
  // Relational Databases
  {
    id: 'pg',
    name: 'PostgreSQL',
    engine_type: 'postgresql',
    category: 'relational',
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    description: 'Advanced open-source relational database supporting SQL & JSON queries.',
    badge: 'SQL',
    versions: ['16', '15', '14']
  },
  {
    id: 'mysql',
    name: 'MySQL Enterprise',
    engine_type: 'mysql',
    category: 'relational',
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    description: 'Reliable, fast multi-threaded relational database management system.',
    badge: 'SQL',
    versions: ['8.0', '5.7']
  },
  {
    id: 'mariadb',
    name: 'MariaDB Server',
    engine_type: 'mariadb',
    category: 'relational',
    icon_url: 'https://www.vectorlogo.zone/logos/mariadb/mariadb-icon.svg',
    description: 'Community-developed fork of MySQL designed for high concurrency.',
    badge: 'SQL',
    versions: ['11.2', '10.11']
  },
  {
    id: 'cockroach',
    name: 'CockroachDB',
    engine_type: 'cockroach',
    category: 'relational',
    icon_url: 'https://www.vectorlogo.zone/logos/cockroachlabs/cockroachlabs-icon.svg',
    description: 'Distributed SQL database built for global cloud applications.',
    badge: 'Distributed SQL',
    versions: ['23.2', '23.1']
  },

  // NoSQL Databases
  {
    id: 'mongo',
    name: 'MongoDB Atlas',
    engine_type: 'mongodb',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    description: 'Flexible document-based NoSQL database with JSON-like documents.',
    badge: 'Document',
    versions: ['7.0', '6.0']
  },
  {
    id: 'cassandra',
    name: 'Apache Cassandra',
    engine_type: 'cassandra',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/apache_cassandra/apache_cassandra-icon.svg',
    description: 'Wide-column NoSQL store designed to handle massive volumes of data.',
    badge: 'Wide-Column',
    versions: ['4.1', '4.0']
  },
  {
    id: 'couchbase',
    name: 'Couchbase Capella',
    engine_type: 'couchbase',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/couchbase/couchbase-icon.svg',
    description: 'Distributed NoSQL cloud database with built-in full-text search.',
    badge: 'Document / KV',
    versions: ['7.2', '7.1']
  },
  {
    id: 'scylla',
    name: 'ScyllaDB Enterprise',
    engine_type: 'scylladb',
    category: 'nosql',
    icon_url: '/scylladb.png', // EXACT User Uploaded ScyllaDB Cyan Monster Mascot Logo
    description: 'Ultra-low latency C++ drop-in replacement for Apache Cassandra.',
    badge: 'Ultra-Fast NoSQL',
    versions: ['5.4', '5.2']
  },

  // Vector Databases
  {
    id: 'qdrant',
    name: 'Qdrant Vector DB',
    engine_type: 'qdrant',
    category: 'vector',
    icon_url: '/qdrant.png', // EXACT User Uploaded 3D Isometric q-Cube Logo
    description: 'High-performance vector similarity search engine written in Rust.',
    badge: 'AI Vector',
    versions: ['1.8', '1.7']
  },
  {
    id: 'milvus',
    name: 'Milvus Distributed',
    engine_type: 'milvus',
    category: 'vector',
    icon_url: '/milvus.png', // EXACT User Uploaded White Eye/Vector Emblem on Dark Background
    description: 'Open-source vector database built for GenAI and embedding search.',
    badge: 'AI Vector',
    versions: ['2.3', '2.2']
  },
  {
    id: 'chroma',
    name: 'ChromaDB',
    engine_type: 'chroma',
    category: 'vector',
    icon_url: '/chroma.png', // EXACT User Uploaded Chroma Colored Circles Emblem Logo
    description: 'AI-native open-source embedding database for LLM applications.',
    badge: 'LLM Embeddings',
    versions: ['0.4.22']
  },
  {
    id: 'weaviate',
    name: 'Weaviate Cloud',
    engine_type: 'weaviate',
    category: 'vector',
    icon_url: '/weaviate.png', // EXACT User Uploaded Weaviate W Logo on Deep Navy Background
    description: 'Vector search engine with built-in ML models and semantic search.',
    badge: 'Semantic Vector',
    versions: ['1.24', '1.23']
  },

  // In-Memory Databases
  {
    id: 'redis',
    name: 'Redis Enterprise',
    engine_type: 'redis',
    category: 'inmemory',
    icon_url: 'https://www.vectorlogo.zone/logos/redis/redis-icon.svg',
    description: 'In-memory key-value data store used as cache and message broker.',
    badge: 'In-Memory',
    versions: ['7.2', '7.0']
  },
  {
    id: 'keydb',
    name: 'KeyDB High-Perf',
    engine_type: 'keydb',
    category: 'inmemory',
    icon_url: '/keydb.png', // EXACT User Uploaded KeyDB Geometric Yellow Triangle Cube Logo
    description: 'Multi-threaded open-source drop-in replacement for Redis.',
    badge: 'Multi-Threaded',
    versions: ['6.3', '6.2']
  },
  {
    id: 'dragonfly',
    name: 'DragonflyDB',
    engine_type: 'dragonfly',
    category: 'inmemory',
    icon_url: DRAGONFLY_LOGO_SVG,
    description: 'Modern in-memory datastore designed for multi-core hardware.',
    badge: 'Next-Gen Cache',
    versions: ['1.14']
  },

  // Time-Series Databases
  {
    id: 'clickhouse',
    name: 'ClickHouse OLAP',
    engine_type: 'clickhouse',
    category: 'timeseries',
    icon_url: CLICKHOUSE_LOGO_SVG,
    description: 'Column-oriented DBMS for real-time analytics & time-series logs.',
    badge: 'Columnar OLAP',
    versions: ['24.1', '23.8']
  },
  {
    id: 'influx',
    name: 'InfluxDB 3.0',
    engine_type: 'influxdb',
    category: 'timeseries',
    icon_url: '/influxdb.png', // EXACT User Uploaded White Geometric Polyhedron Logo
    description: 'Purpose-built time-series engine for IoT metrics and telemetry.',
    badge: 'Time-Series',
    versions: ['3.0', '2.7']
  },
  {
    id: 'timescale',
    name: 'TimescaleDB',
    engine_type: 'timescaledb',
    category: 'timeseries',
    icon_url: '/timescaledb.png', // EXACT User Uploaded Yellow Circle Black Tiger Silhouette
    description: 'Relational database for time-series data built on PostgreSQL.',
    badge: 'Time-Series SQL',
    versions: ['2.14', '2.13']
  },
  {
    id: 'questdb',
    name: 'QuestDB SQL',
    engine_type: 'questdb',
    category: 'timeseries',
    icon_url: QUESTDB_LOGO_SVG,
    description: 'Fast open-source time-series database with SQL interface.',
    badge: 'High-Throughput',
    versions: ['7.3']
  }
];

export const INITIAL_DEPLOYED_DBS: DeployedDatabase[] = [];

export const CLOUD_CREDENTIALS: CloudCredential[] = [];

export const K8S_CLUSTERS: K8sCluster[] = [];

export const METRICS_SAMPLE: DatabaseMetrics = {
  db_id: 'db-1',
  cpu_usage: [15, 22, 18, 45, 32, 28, 40, 55, 30, 25, 20, 18],
  memory_usage: [45, 48, 52, 55, 58, 62, 60, 64, 65, 68, 66, 64],
  disk_io: [120, 150, 210, 450, 320, 180, 240, 310, 290, 190, 160, 140],
  active_connections: [14, 18, 25, 42, 38, 30, 45, 52, 48, 35, 28, 22],
  qps: [850, 920, 1100, 2400, 1800, 1400, 1950, 2200, 1750, 1300, 1050, 980],
  cache_hit_ratio: [98.2, 98.5, 97.9, 99.1, 98.8, 98.4, 99.0, 98.7, 98.9, 99.2, 98.6, 98.9],
  slow_queries_duration: [12, 8, 45, 120, 85, 30, 60, 95, 40, 15, 10, 5]
};

export interface EngineMonogram {
  code: string;
  bg: string;
  text: string;
  border: string;
  glow: string;
}

export const getEngineMonogram = (engineType: string = ''): EngineMonogram => {
  const normalized = (engineType || '').toLowerCase().trim();
  const dict: Record<string, EngineMonogram> = {
    postgresql: { code: 'PG', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/10' },
    postgres:   { code: 'PG', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/10' },
    mysql:      { code: 'MY', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    mariadb:    { code: 'MA', bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/10' },
    cockroach:  { code: 'CR', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    mongodb:    { code: 'MG', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    mongo:      { code: 'MG', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    cassandra:  { code: 'CS', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' },
    couchbase:  { code: 'CB', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/10' },
    scylladb:   { code: 'SC', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10' },
    scylla:     { code: 'SC', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10' },
    qdrant:     { code: 'QD', bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', glow: 'shadow-pink-500/10' },
    milvus:     { code: 'MV', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' },
    chroma:     { code: 'CH', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
    weaviate:   { code: 'WV', bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/10' },
    redis:      { code: 'RD', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/10' },
    keydb:      { code: 'KD', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    dragonfly:  { code: 'DF', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', glow: 'shadow-fuchsia-500/10' },
    clickhouse: { code: 'CK', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10' },
    influxdb:   { code: 'IF', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
    influx:     { code: 'IF', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
    timescaledb:{ code: 'TS', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    timescale:  { code: 'TS', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    questdb:    { code: 'QT', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/10' },
  };

  if (dict[normalized]) return dict[normalized];
  const code = normalized.slice(0, 2).toUpperCase() || 'DB';
  return { code, bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/10' };
};
