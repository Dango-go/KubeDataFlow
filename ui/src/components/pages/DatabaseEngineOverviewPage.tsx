import React, { useState } from 'react';
import { DatabaseCatalogItem, DeployedDatabase } from '../../types';
import { INITIAL_DEPLOYED_DBS, getEngineMonogram } from '../../services/mockData';
import { 
  ArrowLeft, 
  PlusCircle, 
  Database, 
  Server, 
  BookOpen, 
  Sliders, 
  CheckCircle, 
  FileCode2, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Cpu,
  HardDrive,
  Activity,
  Terminal as TerminalIcon
} from 'lucide-react';

interface DatabaseEngineOverviewPageProps {
  item: DatabaseCatalogItem;
  deployedDbs?: DeployedDatabase[];
  onBack: () => void;
  onNavigateCreate: (engineType: string) => void;
  onOpenManagementConsole: (db: DeployedDatabase) => void;
}

const isCrdResource = (db: DeployedDatabase): boolean => {
  if (db.deployment_type === 'crd') return true;
  if (db.deployment_type === 'helm') return false;
  if (db.engine_type?.toLowerCase() === 'crd') return true;
  if (db.values_yaml) {
    const trimmed = db.values_yaml.trim();
    if (trimmed.startsWith('apiVersion:') || trimmed.includes('\napiVersion:') || trimmed.includes('kind:') || trimmed.startsWith('kind:')) {
      return true;
    }
  }
  if (
    db.name.startsWith('secret-') ||
    db.name.startsWith('crd-') ||
    db.name.startsWith('cm-') ||
    db.name.startsWith('configmap-') ||
    db.name.startsWith('operator-')
  ) {
    return true;
  }
  return false;
};

// Engine documentation metadata dictionary
const ENGINE_DOCS_DATA: Record<string, {
  defaultPort: number;
  dockerImage: string;
  architecture: string;
  bestFor: string;
  connectionPattern: string;
  backupStrategy: string;
}> = {
  postgresql: {
    defaultPort: 5432,
    dockerImage: "bitnami/postgresql:16.2.0",
    architecture: "Primary-Replica StatefulSet with WAL-G continuous archiving",
    bestFor: "ACID compliant relational data, complex SQL joins, JSONB documents, AI vector search (pgvector).",
    connectionPattern: "postgresql://postgres:PASSWORD@host:5432/postgres?sslmode=require",
    backupStrategy: "Point-in-Time Recovery (PITR) via continuous WAL streaming to S3/GCS."
  },
  redis: {
    defaultPort: 6379,
    dockerImage: "bitnami/redis:7.2.4",
    architecture: "In-memory Sentinel cluster with RDB snapshots and AOF persistence",
    bestFor: "Ultra-low latency sub-millisecond caching, session storage, pub/sub messaging queues, vector search.",
    connectionPattern: "redis://:PASSWORD@host:6379/0",
    backupStrategy: "RDB snapshot persistence every 5 mins + AOF append-only log disk sync."
  },
  clickhouse: {
    defaultPort: 8123,
    dockerImage: "clickhouse/clickhouse-server:24.3",
    architecture: "Columnar OLAP cluster with ClickHouse Keeper Raft consensus",
    bestFor: "Real-time big data analytics, log aggregation, time-series dashboards, billions of rows/sec.",
    connectionPattern: "clickhouse://admin:PASSWORD@host:8123/default",
    backupStrategy: "Freezable volume snapshots with direct S3 object storage tiering."
  },
  mongodb: {
    defaultPort: 27017,
    dockerImage: "bitnami/mongodb:7.0.5",
    architecture: "Replica Set (1 Primary + 2 Secondaries) with automatic failover",
    bestFor: "Flexible JSON/BSON document storage, dynamic schema evolution, geospatial indexing.",
    connectionPattern: "mongodb://admin:PASSWORD@host:27017/admin?replicaSet=rs0",
    backupStrategy: "Percona OBM (Only Backup Manager) consistent oplog backups."
  }
};

export const DatabaseEngineOverviewPage: React.FC<DatabaseEngineOverviewPageProps> = ({
  item,
  deployedDbs = [],
  onBack,
  onNavigateCreate,
  onOpenManagementConsole
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'instances' | 'docs'>('overview');

  // Filter instances specifically for this engine type
  const allInstances = deployedDbs.length > 0 ? deployedDbs : INITIAL_DEPLOYED_DBS;
  const engineInstances = allInstances.filter(
    (db) => (db.engine_type || '').toLowerCase() === (item.engine_type || '').toLowerCase()
  );

  const docInfo = ENGINE_DOCS_DATA[item.engine_type] || {
    defaultPort: 5432,
    dockerImage: `bitnami/${item.engine_type}:latest`,
    architecture: "Kubernetes StatefulSet with persistent volume claims (PVC)",
    bestFor: item.description,
    connectionPattern: `${item.engine_type}://user:PASSWORD@host:port/dbname`,
    backupStrategy: "Automated persistent volume snapshot schedules."
  };

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* Top Header Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-accent-darkBorder"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>
          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            {(() => {
              const mono = getEngineMonogram(item.engine_type);
              return (
                <div className={`w-12 h-12 rounded-xl ${mono.bg} ${mono.border} border flex items-center justify-center font-mono font-black text-base tracking-wider ${mono.text} ${mono.glow} shadow-md`}>
                  {mono.code}
                </div>
              );
            })()}
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                {item.name} Engine Catalog
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                  {item.badge}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Official catalog specifications, active instances, and architecture documentation</p>
            </div>
          </div>
        </div>

        {/* ➕ PROVISION BUTTON */}
        <button
          onClick={() => onNavigateCreate(item.engine_type)}
          className="bg-gradient-to-r from-brand-blue via-brand-sky to-brand-cyan hover:opacity-90 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Provision New {item.name} Instance</span>
        </button>
      </div>

      {/* 3 Main Navigation Tabs */}
      <div className="flex items-center gap-2 bg-bg-card p-1.5 rounded-2xl border border-accent-darkBorder shadow-md w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
              : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>1. Provisioning & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('instances')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'instances'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
              : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>2. Active {item.name} Instances ({engineInstances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'docs'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
              : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>3. Engine Documentation & Architecture</span>
        </button>
      </div>

      {/* TAB 1: PROVISIONING & OVERVIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Spec Card */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl space-y-4 shadow-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Default Container Specs</span>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-accent-darkBorder/60">
                  <span className="text-slate-400">Default Service Port:</span>
                  <span className="font-mono font-bold text-brand-sky">{docInfo.defaultPort}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-accent-darkBorder/60">
                  <span className="text-slate-400">Container Image:</span>
                  <span className="font-mono text-slate-200">{docInfo.dockerImage}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-accent-darkBorder/60">
                  <span className="text-slate-400">Supported Versions:</span>
                  <span className="font-bold text-white">{item.versions.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-brand-cyan">{item.badge}</span>
                </div>
              </div>
            </div>

            {/* Use Case & Target workloads */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl space-y-4 shadow-xl md:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Workloads & Ideal Use Cases</span>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {docInfo.bestFor}
              </p>
              <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 font-semibold">Production Ready K8s Operator Certified</span>
                </div>
                <button
                  onClick={() => onNavigateCreate(item.engine_type)}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Create {item.name} Database &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE INSTANCES OF THIS SPECIFIC ENGINE */}
      {activeTab === 'instances' && (
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
            <div>
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-brand-cyan" /> Active Deployed {item.name} Databases
              </h4>
              <p className="text-xs text-slate-400">Running instances specifically using the {item.name} engine</p>
            </div>
            <span className="text-xs font-bold text-brand-sky px-3 py-1 rounded-lg bg-brand-blue/10 border border-brand-sky/20">
              {engineInstances.length} Active Deployed
            </span>
          </div>

          {engineInstances.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-slate-400 text-xs font-medium">No active {item.name} database instances currently running.</p>
              <button
                onClick={() => onNavigateCreate(item.engine_type)}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Deploy First {item.name} Instance</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {engineInstances.map((db) => (
                <div 
                  key={db.id}
                  className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 hover:border-brand-sky transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white flex items-center gap-2">
                      {isCrdResource(db) ? (
                        <span className="text-xs font-bold text-brand-sky font-mono uppercase tracking-wider">
                          crd
                        </span>
                      ) : (
                        <Database className="w-4 h-4 text-brand-sky" />
                      )}
                      <span>{db.name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> ● Running
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-accent-darkBorder/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Cluster</span>
                      <strong className="text-slate-200">{db.cluster_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Resources</span>
                      <strong className="text-slate-200">{db.cpu_usage_m}m / {db.memory_usage_mb}MB</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Storage</span>
                      <strong className="text-slate-200">{db.storage_gb} GB SSD</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-accent-darkBorder/40">
                    <span className="text-[11px] font-mono text-slate-500">ns: {db.namespace}</span>
                    
                    <button
                      onClick={() => onOpenManagementConsole(db)}
                      className="text-xs font-bold bg-brand-blue hover:bg-brand-blue/90 text-white px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Open Management Console &rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OFFICIAL DOCUMENTATION & ARCHITECTURE GUIDE */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-accent-darkBorder pb-4">
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-brand-sky" /> {item.name} Architecture & Operations Guide
              </h4>
              <p className="text-xs text-slate-400">Kubernetes operator architecture, backup policies, and connection patterns</p>
            </div>

            <div className="space-y-6 text-xs">
              {/* Architecture Section */}
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-cyan" /> Deployment Architecture
                </h5>
                <p className="text-slate-300 leading-relaxed bg-bg-main p-4 rounded-xl border border-accent-darkBorder">
                  {docInfo.architecture}
                </p>
              </div>

              {/* Connection Format Section */}
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-brand-sky" /> Connection String Pattern
                </h5>
                <pre className="bg-brand-dark text-brand-sky p-4 rounded-xl font-mono text-xs border border-accent-darkBorder overflow-x-auto">
                  {docInfo.connectionPattern}
                </pre>
              </div>

              {/* Backup & Disaster Recovery */}
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Backup & Recovery Strategy
                </h5>
                <p className="text-slate-300 leading-relaxed bg-bg-main p-4 rounded-xl border border-accent-darkBorder">
                  {docInfo.backupStrategy}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
