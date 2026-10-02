import React, { useState, useEffect } from 'react';
import { INITIAL_DEPLOYED_DBS, K8S_CLUSTERS, CATALOG_ITEMS } from '../../services/mockData';
import { DeployedDatabase, K8sCluster, CategoryType } from '../../types';
import { apiClient } from '../../services/apiClient';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Zap, 
  Clock, 
  Database, 
  BarChart3,
  Search,
  Filter,
  Check,
  Globe,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowUpRight,
  Wifi,
  Sliders,
  CheckCircle2,
  X,
  PieChart,
  LineChart,
  TrendingUp,
  AlertTriangle,
  Radio,
  Gauge,
  Layers as LayersIcon
} from 'lucide-react';

type DatabaseTypeFilter = 'ALL' | 'RELATIONAL' | 'NOSQL' | 'INMEMORY' | 'VECTOR' | 'TIMESERIES';
type CloudProviderFilter = 'ALL' | 'AWS' | 'GCP' | 'AZURE' | 'DIGITALOCEAN' | 'ONPREMISE';
type MetricCategoryFilter = 'ALL' | 'COMPUTE' | 'DATABASE' | 'STORAGE_IO' | 'NETWORK_REPL';

export const MonitoringPage: React.FC = () => {
  const [deployedDbs, setDeployedDbs] = useState<DeployedDatabase[]>([]);
  const [clustersList, setClustersList] = useState<K8sCluster[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  
  // Left Panel Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<DatabaseTypeFilter>('ALL');
  const [cloudFilter, setCloudFilter] = useState<CloudProviderFilter>('ALL');
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | '7d'>('1h');
  const [isLiveAutoRefresh, setIsLiveAutoRefresh] = useState<boolean>(true);
  const [metricCategory, setMetricCategory] = useState<MetricCategoryFilter>('ALL');

  // Fetch deployed databases and clusters
  useEffect(() => {
    apiClient.getDeployedDatabases().then((dbs) => {
      if (dbs && dbs.length > 0) {
        setDeployedDbs(dbs);
        setSelectedDbId((prev) => prev || dbs[0].id);
      }
    }).catch((err) => {
      console.warn('Could not fetch deployed DBs:', err);
    });

    apiClient.getUserClusters(1).then((cls) => {
      if (cls && cls.length > 0) {
        setClustersList(cls);
      }
    }).catch((err) => {
      console.warn('Could not fetch user clusters:', err);
    });
  }, []);

  const allDbs = deployedDbs.length > 0 ? deployedDbs : INITIAL_DEPLOYED_DBS;
  const allClusters = clustersList.length > 0 ? clustersList : K8S_CLUSTERS;

  const fallbackDb: DeployedDatabase = {
    id: '1',
    name: 'prod-postgres-main',
    engine_type: 'postgresql',
    version: '16',
    cluster_name: 'lenovo-prod-k8s',
    namespace: 'databases',
    status: 'running',
    cpu_usage_m: 2000,
    memory_usage_mb: 4096,
    storage_gb: 50,
    monthly_cost: 69.50,
    created_at: new Date().toISOString(),
    values_yaml: ''
  };

  // Helper to find category of any engine
  const getCategoryForEngine = (engineType: string): string => {
    const catalogItem = CATALOG_ITEMS.find(
      (item) => item.engine_type.toLowerCase() === engineType.toLowerCase()
    );
    if (catalogItem) return catalogItem.category.toUpperCase();
    if (['postgresql', 'mysql', 'mariadb', 'cockroach', 'clickhouse'].includes(engineType.toLowerCase())) {
      return 'RELATIONAL';
    }
    if (['mongodb', 'cassandra', 'couchbase', 'scylladb'].includes(engineType.toLowerCase())) {
      return 'NOSQL';
    }
    if (['redis', 'keydb', 'dragonfly'].includes(engineType.toLowerCase())) {
      return 'INMEMORY';
    }
    if (['qdrant', 'milvus', 'chroma', 'weaviate'].includes(engineType.toLowerCase())) {
      return 'VECTOR';
    }
    if (['influxdb', 'timescaledb', 'questdb'].includes(engineType.toLowerCase())) {
      return 'TIMESERIES';
    }
    return 'RELATIONAL';
  };

  // Helper to map cluster name to Cloud Provider
  const getCloudProviderForCluster = (clusterName: string): { name: string; key: CloudProviderFilter; iconColor: string } => {
    const cluster = allClusters.find((c) => c.name === clusterName);
    if (!cluster) {
      return { name: 'On-Premise', key: 'ONPREMISE', iconColor: 'text-amber-400' };
    }
    const prov = cluster.provider.toUpperCase();
    if (prov.includes('AWS') || prov.includes('EKS')) {
      return { name: 'AWS EKS', key: 'AWS', iconColor: 'text-amber-500' };
    }
    if (prov.includes('GCP') || prov.includes('GKE')) {
      return { name: 'GCP GKE', key: 'GCP', iconColor: 'text-rose-400' };
    }
    if (prov.includes('AZURE') || prov.includes('AKS')) {
      return { name: 'Azure AKS', key: 'AZURE', iconColor: 'text-sky-400' };
    }
    if (prov.includes('DIGITALOCEAN') || prov.includes('DOKS')) {
      return { name: 'DigitalOcean', key: 'DIGITALOCEAN', iconColor: 'text-blue-400' };
    }
    return { name: 'On-Premise', key: 'ONPREMISE', iconColor: 'text-emerald-400' };
  };

  // Helper to find engine icon
  const getEngineIconUrl = (engineType: string): string => {
    const item = CATALOG_ITEMS.find((c) => c.engine_type.toLowerCase() === engineType.toLowerCase());
    return item?.icon_url || 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png';
  };

  // Filter databases
  const filteredDbs = allDbs.filter((db) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = db.name.toLowerCase().includes(q);
      const matchEngine = db.engine_type.toLowerCase().includes(q);
      const matchCluster = db.cluster_name.toLowerCase().includes(q);
      if (!matchName && !matchEngine && !matchCluster) return false;
    }

    // 2. Database Type Filter
    if (typeFilter !== 'ALL') {
      const dbCategory = getCategoryForEngine(db.engine_type);
      if (dbCategory !== typeFilter) return false;
    }

    // 3. Cloud Provider Filter
    if (cloudFilter !== 'ALL') {
      const provInfo = getCloudProviderForCluster(db.cluster_name);
      if (provInfo.key !== cloudFilter) return false;
    }

    return true;
  });

  const selectedDb: DeployedDatabase = 
    filteredDbs.find((db) => db.id === selectedDbId) ||
    allDbs.find((db) => db.id === selectedDbId) ||
    filteredDbs[0] ||
    allDbs[0] ||
    fallbackDb;

  const currentCategory = getCategoryForEngine(selectedDb.engine_type);
  const currentProvider = getCloudProviderForCluster(selectedDb.cluster_name);

  // 14 Comprehensive Performance & Health Metrics
  const ALL_METRICS_LIST = [
    {
      id: 'cpu_usage',
      category: 'COMPUTE',
      title: 'CPU Utilization',
      subtitle: 'Cores requested vs throttled limit',
      unit: '% Cores',
      icon: Cpu,
      color: 'text-sky-400',
      current: '24.8%'
    },
    {
      id: 'memory_usage',
      category: 'COMPUTE',
      title: 'Memory Working Set',
      subtitle: 'Resident set memory size (RSS) & Cache',
      unit: 'MB / GB',
      icon: HardDrive,
      color: 'text-purple-400',
      current: selectedDb.memory_usage_mb ? `${selectedDb.memory_usage_mb} MB` : '4,096 MB'
    },
    {
      id: 'qps_operations',
      category: 'DATABASE',
      title: 'Queries Per Second (QPS)',
      subtitle: 'Total query volume, reads and writes',
      unit: 'req/sec',
      icon: Zap,
      color: 'text-amber-400',
      current: '1,420 qps'
    },
    {
      id: 'query_latency',
      category: 'DATABASE',
      title: 'Query Latency (p95 / p99)',
      subtitle: 'Response time percentiles & slow logs',
      unit: 'ms',
      icon: Clock,
      color: 'text-rose-400',
      current: '2.4 ms'
    },
    {
      id: 'active_connections',
      category: 'DATABASE',
      title: 'Active Client Connections',
      subtitle: 'Client pool vs max allocated limit',
      unit: 'sockets',
      icon: Server,
      color: 'text-indigo-400',
      current: '34 / 200'
    },
    {
      id: 'cache_hit_ratio',
      category: 'DATABASE',
      title: 'Buffer Cache Hit Ratio',
      subtitle: 'Shared buffers & memory page hit efficiency',
      unit: '% hit rate',
      icon: PieChart,
      color: 'text-cyan-400',
      current: '99.4%'
    },
    {
      id: 'iops_throughput',
      category: 'STORAGE_IO',
      title: 'Disk I/O & IOPS Bandwidth',
      subtitle: 'Read/Write operations per second & Volume MBps',
      unit: 'IOPS / MBps',
      icon: Activity,
      color: 'text-emerald-400',
      current: '480 IOPS'
    },
    {
      id: 'disk_growth',
      category: 'STORAGE_IO',
      title: 'Disk Storage & Volume Growth',
      subtitle: 'PVC volume consumption vs quota capacity',
      unit: 'GB / %',
      icon: HardDrive,
      color: 'text-blue-400',
      current: selectedDb.storage_gb ? `${Math.round(selectedDb.storage_gb * 0.42)} / ${selectedDb.storage_gb} GB` : '21 / 50 GB'
    },
    {
      id: 'wal_write_volume',
      category: 'STORAGE_IO',
      title: 'Storage WAL / Journal Flush Rate',
      subtitle: 'Write-ahead log throughput & flush sync rate',
      unit: 'MB/s',
      icon: TrendingUp,
      color: 'text-teal-400',
      current: '4.2 MB/s'
    },
    {
      id: 'network_traffic',
      category: 'NETWORK_REPL',
      title: 'Network Ingress / Egress',
      subtitle: 'Interface bandwidth & socket transfer rate',
      unit: 'KB/s / MB/s',
      icon: Wifi,
      color: 'text-teal-400',
      current: '12.8 MB/s'
    },
    {
      id: 'replication_lag',
      category: 'NETWORK_REPL',
      title: 'Replication Lag & Sync Health',
      subtitle: 'Replica delay, byte offset & cluster state',
      unit: 'ms lag',
      icon: Radio,
      color: 'text-emerald-400',
      current: '0 ms (Sync)'
    },
    {
      id: 'deadlocks_aborts',
      category: 'DATABASE',
      title: 'Deadlocks & Transaction Aborts',
      subtitle: 'Lock contention, rollbacks and conflict rate',
      unit: 'events/min',
      icon: AlertTriangle,
      color: 'text-orange-400',
      current: '0 events'
    },
    {
      id: 'table_index_scans',
      category: 'DATABASE',
      title: 'Index vs Sequential Scan Efficiency',
      subtitle: 'B-tree index lookups vs expensive full table scans',
      unit: '% Index',
      icon: Gauge,
      color: 'text-fuchsia-400',
      current: '96.2%'
    },
    {
      id: 'error_rate',
      category: 'DATABASE',
      title: 'Error Rate & Failed Commands',
      subtitle: 'Server errors, timeouts & client disconnects',
      unit: 'errors/s',
      icon: AlertTriangle,
      color: 'text-red-400',
      current: '0.00 /s'
    }
  ];

  const displayedCharts = ALL_METRICS_LIST.filter((item) => {
    if (metricCategory === 'ALL') return true;
    return item.category === metricCategory;
  });

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-blue/20 text-brand-sky flex items-center justify-center font-bold border border-brand-sky/30 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Monitoring & Performance Metrics</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select deployed database instances to inspect metrics, health status and performance telemetry
            </p>
          </div>
        </div>

        {/* Global Controls: Time Range & Live Switch */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-bg-main p-1 rounded-xl border border-accent-darkBorder">
            {(['15m', '1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLiveAutoRefresh(!isLiveAutoRefresh)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isLiveAutoRefresh
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-bg-main border-accent-darkBorder text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveAutoRefresh ? 'animate-spin' : ''}`} />
            {isLiveAutoRefresh ? 'Auto 5s' : 'Paused'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP ROW: LEFT SELECTOR PANEL + RIGHT ACTIVE DB DETAILS  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* 1. LEFT PANEL: DEPLOYED DATABASES SELECTOR & FILTERS */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-accent-darkBorder/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-sky" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Deployed Databases
              </span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-brand-blue/20 text-brand-sky border border-brand-sky/20">
              {filteredDbs.length} of {allDbs.length}
            </span>
          </div>

          {/* Search Box Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search database by name..."
              className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/50 focus:border-brand-sky text-white text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 transition-all font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* DATABASE TYPE FILTER BAR */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Database Type
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold tracking-wider">
              {(['ALL', 'RELATIONAL', 'NOSQL', 'INMEMORY', 'VECTOR', 'TIMESERIES'] as DatabaseTypeFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTypeFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap uppercase transition-all border ${
                    typeFilter === tab
                      ? 'bg-brand-blue/30 text-brand-sky border-brand-sky/50 shadow-md font-extrabold'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CLOUD PROVIDER FILTER BAR */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cloud Provider
            </label>
            <div className="flex items-center gap-1 flex-wrap text-[11px] font-semibold">
              {[
                { label: 'All Clouds', key: 'ALL' },
                { label: 'AWS', key: 'AWS' },
                { label: 'GCP', key: 'GCP' },
                { label: 'Azure', key: 'AZURE' },
                { label: 'DigitalOcean', key: 'DIGITALOCEAN' },
                { label: 'On-Premise', key: 'ONPREMISE' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCloudFilter(c.key as CloudProviderFilter)}
                  className={`px-2.5 py-1 rounded-lg transition-all border text-[10px] font-bold ${
                    cloudFilter === c.key
                      ? 'bg-slate-800 text-white border-brand-sky/50 shadow-sm'
                      : 'bg-bg-main/60 text-slate-400 border-accent-darkBorder/60 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* DATABASE INSTANCES CARDS LIST */}
          {/* ======================================================== */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredDbs.map((db) => {
              const isSelected = selectedDb.id === db.id;
              const prov = getCloudProviderForCluster(db.cluster_name);
              const iconUrl = getEngineIconUrl(db.engine_type);
              const cat = getCategoryForEngine(db.engine_type);

              return (
                <div
                  key={db.id}
                  onClick={() => setSelectedDbId(db.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-blue/15 border-brand-sky ring-1 ring-brand-sky/40 shadow-lg shadow-brand-blue/10'
                      : 'bg-bg-main/70 border-accent-darkBorder hover:border-slate-700 hover:bg-bg-main'
                  }`}
                >
                  {/* Left Accent indicator when active */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-sky rounded-r"></div>
                  )}

                  <img
                    src={iconUrl}
                    alt={db.name}
                    className="w-8 h-8 object-contain rounded-lg bg-slate-950 p-1 border border-accent-darkBorder shrink-0 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {db.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {db.status || 'running'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-300">{db.engine_type} {db.version ? `v${db.version}` : ''}</span>
                      <span>•</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800/80 rounded text-slate-400">{cat}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-800/60 font-mono">
                      <span className={`truncate flex items-center gap-1 ${prov.iconColor}`}>
                        <Globe className="w-3 h-3 shrink-0" />
                        {prov.name} ({db.cluster_name})
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {db.storage_gb ? `${db.storage_gb}GB` : '50GB'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDbs.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-accent-darkBorder rounded-xl">
                <Database className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No matching databases</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search query or filters</p>
              </div>
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* 2. RIGHT OVERVIEW BANNER: ACTIVE DB DETAILS & HEALTH     */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Top Banner Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-accent-darkBorder/80 pb-5">
              <div className="flex items-center gap-4">
                <img
                  src={getEngineIconUrl(selectedDb.engine_type)}
                  alt={selectedDb.name}
                  className="w-14 h-14 object-contain rounded-2xl bg-slate-950 p-2.5 border border-accent-darkBorder shadow-inner shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white">
                      {selectedDb.name}
                    </h3>
                    <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Healthy & Running
                    </span>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      {currentCategory}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1.5 font-mono flex-wrap">
                    <span>Engine: <strong className="text-white capitalize">{selectedDb.engine_type} {selectedDb.version}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className={`w-3.5 h-3.5 ${currentProvider.iconColor}`} />
                      <span>{currentProvider.name}</span>
                      <strong className="text-slate-300">({selectedDb.cluster_name})</strong>
                    </span>
                    <span>•</span>
                    <span>Namespace: <strong className="text-slate-300">{selectedDb.namespace || 'databases'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Cost / Month Badge */}
              <div className="bg-bg-main/90 border border-accent-darkBorder px-4 py-2.5 rounded-xl text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estimated Cost</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  ${selectedDb.monthly_cost ? Number(selectedDb.monthly_cost).toFixed(2) : '69.50'}<span className="text-xs font-normal text-slate-400">/mo</span>
                </span>
              </div>
            </div>

            {/* Middle Grid: Key Specs & Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="bg-bg-main/80 p-4 rounded-xl border border-accent-darkBorder">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-sky-400" /> CPU Limit</span>
                  <span className="font-bold text-sky-400 font-mono">24.8%</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {selectedDb.cpu_usage_m ? `${selectedDb.cpu_usage_m}m` : '2000m'}
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full w-[25%]"></div>
                </div>
              </div>

              <div className="bg-bg-main/80 p-4 rounded-xl border border-accent-darkBorder">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-purple-400" /> Memory</span>
                  <span className="font-bold text-purple-400 font-mono">52%</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {selectedDb.memory_usage_mb ? `${selectedDb.memory_usage_mb} MB` : '4,096 MB'}
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full w-[52%]"></div>
                </div>
              </div>

              <div className="bg-bg-main/80 p-4 rounded-xl border border-accent-darkBorder">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> Storage</span>
                  <span className="font-bold text-emerald-400 font-mono">42%</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {selectedDb.storage_gb ? `${selectedDb.storage_gb} GB` : '50 GB'}
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full w-[42%]"></div>
                </div>
              </div>

              <div className="bg-bg-main/80 p-4 rounded-xl border border-accent-darkBorder">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Workload QPS</span>
                  <span className="font-bold text-amber-400 font-mono">Active</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  1,420 <span className="text-xs font-normal text-slate-400">qps</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Status Banner in Overview */}
          <div className="p-3.5 mt-4 bg-slate-900/60 border border-brand-sky/20 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-sky shrink-0" />
              <span>
                Streaming live metrics from <strong>{selectedDb.cluster_name}</strong> (namespace: <code className="text-brand-sky">{selectedDb.namespace || 'databases'}</code>).
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Collector Connected
            </span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. FULL-WIDTH LOWER SECTION: METRICS & TELEMETRY VISUALIZER */}
      {/* ======================================================== */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6 w-full">
        
        {/* Charts Section Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-accent-darkBorder/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-blue/20 border border-brand-sky/30 text-brand-sky">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Metrics & Telemetry Visualizer</span>
                <span className="text-xs font-mono font-normal normal-case px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {displayedCharts.length} Channels Active
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-spectrum telemetry graphs for database instance <span className="font-mono text-brand-sky font-bold">"{selectedDb.name}"</span> on <span className="text-slate-300 font-semibold">{currentProvider.name}</span>
              </p>
            </div>
          </div>

          {/* Category Filter Tabs & Range Display */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-bg-main p-1 rounded-xl border border-accent-darkBorder text-xs font-bold">
              {[
                { label: 'All Metrics (14)', key: 'ALL' },
                { label: 'Compute', key: 'COMPUTE' },
                { label: 'Database Ops', key: 'DATABASE' },
                { label: 'Storage & I/O', key: 'STORAGE_IO' },
                { label: 'Network & Repl', key: 'NETWORK_REPL' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setMetricCategory(cat.key as MetricCategoryFilter)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    metricCategory === cat.key
                      ? 'bg-brand-blue text-white shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-slate-400 bg-bg-main px-3 py-1.5 rounded-xl border border-accent-darkBorder hidden sm:inline-block">
              Window: <strong className="text-white">{timeRange}</strong>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2-COLUMN WIDE RESPONSIVE GRID OF METRIC CHARTS           */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {displayedCharts.map((chart) => {
            const IconComponent = chart.icon;
            return (
              <div
                key={chart.id}
                className="p-6 bg-bg-main/90 border border-accent-darkBorder hover:border-brand-sky/40 rounded-2xl space-y-4 transition-all shadow-xl group flex flex-col justify-between"
              >
                {/* Chart Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${chart.color} shadow-inner`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white block">
                        {chart.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {chart.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0 shadow-sm">
                      {chart.unit}
                    </span>
                  </div>
                </div>

                {/* Expanded Chart Area Wireframe & Simulated Waveform */}
                <div className="h-48 w-full rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between p-4 text-center relative overflow-hidden group-hover:border-slate-700 transition-all shadow-inner">
                  {/* Grid Lines Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

                  {/* Top chart bar with live value */}
                  <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Prometheus Stream
                    </span>
                    <span className="text-sm font-bold text-white bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
                      Live: <span className="text-brand-sky font-extrabold">{chart.current}</span>
                    </span>
                  </div>

                  {/* SVG Wave Placeholder representing dynamic live graph */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                    <div className="w-full h-16 relative flex items-center justify-center">
                      <svg className="w-full h-full text-brand-sky/40 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 60">
                        <defs>
                          <linearGradient id={`grad-${chart.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,35 Q 50,15 100,28 T 200,18 T 300,32 T 400,20 L 400,60 L 0,60 Z"
                          fill={`url(#grad-${chart.id})`}
                        />
                        <path
                          d="M 0,35 Q 50,15 100,28 T 200,18 T 300,32 T 400,20"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-1">
                      PromQL: <code className="text-slate-300 font-semibold">{chart.id}&#123;pod="{selectedDb.name}-0"&#125;</code>
                    </span>
                  </div>

                  {/* Time range axis markers */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-1.5">
                    <span>-{timeRange}</span>
                    <span>-{(timeRange === '7d' ? '3.5d' : timeRange === '24h' ? '12h' : timeRange === '6h' ? '3h' : timeRange === '1h' ? '30m' : '7.5m')}</span>
                    <span className="text-emerald-400 font-semibold">Now (0s)</span>
                  </div>
                </div>

                {/* Expanded Bottom stats footer */}
                <div className="grid grid-cols-4 gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800/60 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase">Min</span>
                    <strong className="text-slate-300">--</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase">Avg</span>
                    <strong className="text-slate-300">--</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase">Max</span>
                    <strong className="text-slate-300">--</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase">Current</span>
                    <strong className="text-emerald-400">{chart.current}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Wide Telemetry Summary Footer */}
        <div className="p-4 bg-slate-900/60 border border-brand-sky/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-sky shrink-0" />
            <span>
              All 14 performance & health telemetry channels are active for database <strong className="text-white">{selectedDb.name}</strong> ({selectedDb.engine_type} on {selectedDb.cluster_name}).
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
            <span>Interval: <strong className="text-slate-200">5s</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">✓ Ready for Prometheus / VictoriaMetrics</span>
          </div>
        </div>

      </div>

    </div>
  );
};

