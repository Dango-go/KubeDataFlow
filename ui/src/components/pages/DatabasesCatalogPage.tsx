import React, { useState, useEffect } from 'react';
import { CATALOG_ITEMS, INITIAL_DEPLOYED_DBS, getEngineMonogram } from '../../services/mockData';
import { DeployedDatabase, CategoryType } from '../../types';
import { apiClient } from '../../services/apiClient';
import { DatabaseManagementCatalogPage } from './DatabaseManagementCatalogPage';
import { DatabaseEngineOverviewPage } from './DatabaseEngineOverviewPage';
import { 
  Database, 
  Settings, 
  Activity, 
  DollarSign, 
  Plus, 
  FileCode2,
  ArrowLeft,
  Wrench,
  Layers,
  Terminal,
  RefreshCw
} from 'lucide-react';

interface DatabasesCatalogPageProps {
  onNavigateCreate: (engineType?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onTitleChange?: (title: string | null) => void;
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

export const DatabasesCatalogPage: React.FC<DatabasesCatalogPageProps> = ({ 
  onNavigateCreate,
  onNavigateTab,
  onTitleChange 
}) => {
  const [selectedDb, setSelectedDb] = useState<DeployedDatabase | null>(null);
  const [activeDbTab, setActiveDbTab] = useState<'config' | 'monitoring' | 'budget'>('config');

  // Deployed active databases list state & refresh loader
  const [deployedDbs, setDeployedDbs] = useState<DeployedDatabase[]>(INITIAL_DEPLOYED_DBS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDeployedDbs = async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.getDeployedDatabases();
      if (data && data.length > 0) {
        setDeployedDbs(data);
      }
    } catch (e) {
      console.warn('Failed to refresh deployed databases:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchDeployedDbs();
  }, []);

  // Selected item for Engine Overview (Catalog Card Click)
  const [selectedEngineOverviewItem, setSelectedEngineOverviewItem] = useState<any>(null);

  // Selected item for Management Catalog Page (Running DB Instance Click)
  const [selectedManagementCatalogItem, setSelectedManagementCatalogItem] = useState<any>(null);
  const [selectedManagementDb, setSelectedManagementDb] = useState<DeployedDatabase | null>(null);

  // Flow A: Click Engine Card in Catalog Grid -> Open Engine Overview Page (Create DB, Active instances of this engine, Docs)
  const handleOpenCatalogItem = (item: any) => {
    setSelectedEngineOverviewItem(item);
    onTitleChange?.(`${item.name} Engine Catalog`);
  };

  // Flow B: Click Active Running DB in Table -> Open Management Database Console
  const handleOpenFastManagement = (db: DeployedDatabase) => {
    const dbEngine = (db.engine_type || '').toLowerCase();
    const found = CATALOG_ITEMS.find((c) => (c.engine_type || '').toLowerCase() === dbEngine) || CATALOG_ITEMS[0];
    const customItem = {
      ...found,
      name: `${db.name} (${found.name})`,
      engine_type: db.engine_type,
    };
    setSelectedManagementDb(db);
    setSelectedManagementCatalogItem(customItem);
    onTitleChange?.('Management Database Console');
  };

  const handleBackToCatalog = () => {
    setSelectedEngineOverviewItem(null);
    setSelectedManagementCatalogItem(null);
    setSelectedManagementDb(null);
    onTitleChange?.(null);
  };

  // Track image load errors for fallbacks
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const categories: { id: CategoryType; label: string; count: number }[] = [
    { id: 'relational', label: 'Relational Databases', count: 4 },
    { id: 'nosql', label: 'NoSQL / Non-Relational Databases', count: 4 },
    { id: 'vector', label: 'Vector Databases', count: 4 },
    { id: 'inmemory', label: 'In-Memory Databases', count: 3 }, // 3 In-Memory engines (Redis, KeyDB, Dragonfly)
    { id: 'timeseries', label: 'Time-Series Databases', count: 4 },
  ];

  // Fully ready databases (No "Under Development" badge)
  const readyEngines = ['postgresql', 'mongodb', 'redis'];

  // Render Engine Overview Page if engine card clicked
  if (selectedEngineOverviewItem) {
    return (
      <DatabaseEngineOverviewPage
        item={selectedEngineOverviewItem}
        deployedDbs={deployedDbs}
        onBack={handleBackToCatalog}
        onNavigateCreate={onNavigateCreate}
        onOpenManagementConsole={handleOpenFastManagement}
      />
    );
  }

  // Render Running Instance Management Console if running instance clicked
  if (selectedManagementCatalogItem) {
    return (
      <DatabaseManagementCatalogPage
        item={selectedManagementCatalogItem}
        selectedDb={selectedManagementDb}
        deployedDbs={deployedDbs}
        onBack={handleBackToCatalog}
        onNavigateCreate={onNavigateCreate}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-10 text-slate-100">
      {/* 1. Database Technologies Catalog Section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Database Engine Catalog</h3>
          <p className="text-xs text-slate-400">Select a category or database engine below to quickly provision a new instance</p>
        </div>

        {categories.map((cat) => {
          const items = CATALOG_ITEMS.filter((item) => item.category === cat.id);
          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-sky"></span>
                  {cat.label}
                </h4>
                <span className="text-xs text-slate-500 font-medium">{items.length} Engines Available</span>
              </div>

              {/* 4 CARDS PER ROW SQUARE GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((item) => {
                  const mono = getEngineMonogram(item.engine_type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCatalogItem(item)}
                      className="bg-bg-card border border-accent-darkBorder rounded-2xl p-4 hover:border-brand-sky hover:shadow-xl hover:shadow-brand-sky/10 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden min-h-[200px]"
                    >

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-11 h-11 rounded-xl ${mono.bg} ${mono.border} border flex items-center justify-center font-mono font-black text-sm tracking-wider ${mono.text} ${mono.glow} shadow-md group-hover:scale-105 group-hover:border-brand-sky/60 transition-all`}>
                            {mono.code}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-main text-slate-300 border border-accent-darkBorder">
                            {item.badge}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-base group-hover:text-brand-sky transition-colors">
                          {item.name}
                        </h5>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* STATIC FOOTER FOR VERSION */}
                      <div className="mt-4 pt-3 border-t border-accent-darkBorder/60 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Version: {item.versions[0]}</span>
                        <span className="text-brand-sky text-[11px] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Catalog &rarr;
                        </span>
                      </div>

                      {/* HOVER PLUS BUTTON FOR QUICK CREATION */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateCreate(item.engine_type);
                          }}
                          title="Provision Database Instance"
                          className="bg-brand-blue hover:bg-brand-blue/90 text-white p-1.5 rounded-lg shadow-lg border border-brand-sky/40 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* 2. Deployed Active Databases List Section */}
      <section className="space-y-4 pt-6 border-t border-accent-darkBorder">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Active Deployed Database Instances</h3>
            <p className="text-xs text-slate-400">Inspect status, configuration, metrics, and monthly budget for your active instances</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeployedDbs}
              disabled={isRefreshing}
              className="bg-bg-main hover:bg-accent-darkHover text-slate-200 border border-accent-darkBorder font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              title="Refresh / Update deployed database list from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-sky ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Update List</span>
            </button>

            <button
              onClick={() => onNavigateCreate()}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand-blue/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Database</span>
            </button>
          </div>
        </div>

        {/* Selected DB Details View or List Table */}
        {selectedDb ? (
          /* DETAILED VIEW WITH 3 TABS: Configuration, Monitoring, Budget */
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDb(null)}
                  className="p-2 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Instances
                </button>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedDb.name}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      ● {selectedDb.status.toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">Cluster: {selectedDb.cluster_name} | Namespace: {selectedDb.namespace}</p>
                </div>
              </div>

              {/* 3 Tabs: Configuration, Monitoring, Budget */}
              <div className="flex items-center bg-bg-[#FDFBF7] p-1 rounded-xl border border-accent-darkBorder">
                <button
                  onClick={() => setActiveDbTab('config')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeDbTab === 'config' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> Configuration
                </button>
                <button
                  onClick={() => setActiveDbTab('monitoring')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeDbTab === 'monitoring' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Monitoring
                </button>
                <button
                  onClick={() => setActiveDbTab('budget')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeDbTab === 'budget' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> Budget
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeDbTab === 'config' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                    <span className="text-xs text-slate-400 font-medium">Engine & Version</span>
                    <p className="text-sm font-bold text-white mt-1 uppercase">{selectedDb.engine_type} v{selectedDb.version}</p>
                  </div>
                  <div className="p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                    <span className="text-xs text-slate-400 font-medium">Allocated CPU & RAM</span>
                    <p className="text-sm font-bold text-white mt-1">{selectedDb.cpu_usage_m}m Cores / {selectedDb.memory_usage_mb} MB RAM</p>
                  </div>
                  <div className="p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                    <span className="text-xs text-slate-400 font-medium">Persistent Storage (PVC)</span>
                    <p className="text-sm font-bold text-white mt-1">{selectedDb.storage_gb} GB SSD</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-brand-sky" /> Active values.yaml Configuration:
                  </h5>
                  <pre className="bg-brand-dark text-slate-200 p-4 rounded-xl text-xs font-mono border border-slate-800 overflow-x-auto leading-relaxed">
                    {selectedDb.values_yaml}
                  </pre>
                </div>
              </div>
            )}

            {activeDbTab === 'monitoring' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl">
                    <span className="text-xs text-slate-400">CPU Usage</span>
                    <h5 className="text-2xl font-bold text-white mt-1">32.4%</h5>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="bg-brand-sky h-full w-[32.4%]"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl">
                    <span className="text-xs text-slate-400">Memory Usage</span>
                    <h5 className="text-2xl font-bold text-white mt-1">{selectedDb.memory_usage_mb} MB</h5>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="bg-brand-cyan h-full w-[64%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDbTab === 'budget' && (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-bg-main to-brand-dark border border-accent-darkBorder text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Monthly Cost Breakdown</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">${selectedDb.monthly_cost.toFixed(2)} / mo</h3>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                      K8s Compute + PVC Disk Included
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* INSTANCES TABLE LIST */
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-main text-slate-400 text-xs uppercase border-b border-accent-darkBorder">
                  <th className="p-4 font-semibold">Instance Name</th>
                  <th className="p-4 font-semibold">Engine & Version</th>
                  <th className="p-4 font-semibold">Cluster</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Resources</th>
                  <th className="p-4 font-semibold text-right">Monthly Cost</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-darkBorder/60 text-sm">
                {deployedDbs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No deployed database instances found.
                    </td>
                  </tr>
                ) : (
                  deployedDbs.map((db) => (
                    <tr 
                      key={db.id} 
                      onClick={() => handleOpenFastManagement(db)}
                      className="hover:bg-accent-darkHover transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        {isCrdResource(db) ? (
                          <span className="text-xs font-bold text-brand-sky font-mono uppercase tracking-wider">
                            crd
                          </span>
                        ) : (
                          <Database className="w-4 h-4 text-brand-sky" />
                        )}
                        <span className="hover:underline text-brand-sky font-bold">{db.name}</span>
                      </td>
                      <td className="p-4 text-slate-300 capitalize">
                        {db.engine_type} <span className="text-xs text-slate-500">v{db.version}</span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-mono">{db.cluster_name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          ● {db.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        {db.cpu_usage_m}m CPU / {db.storage_gb}GB SSD
                      </td>
                      <td className="p-4 font-extrabold text-white text-right">${db.monthly_cost.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFastManagement(db);
                          }}
                          className="text-xs font-bold bg-brand-blue hover:bg-brand-blue/90 text-white px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-brand-blue/20 flex items-center gap-1.5 mx-auto"
                        >
                          <Terminal className="w-3.5 h-3.5 text-white" /> Fast Management
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
