import React, { useState, useEffect } from 'react';
import { INITIAL_DEPLOYED_DBS, K8S_CLUSTERS, CATALOG_ITEMS } from '../../services/mockData';
import { DeployedDatabase, K8sCluster } from '../../types';
import { apiClient } from '../../services/apiClient';
import { 
  DollarSign, 
  Cpu, 
  HardDrive, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  PieChart, 
  BarChart3, 
  Layers, 
  Globe, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Coins, 
  Zap, 
  ShieldAlert,
  Download
} from 'lucide-react';

export const CostPage: React.FC = () => {
  const [deployedDbs, setDeployedDbs] = useState<DeployedDatabase[]>([]);
  const [clustersList, setClustersList] = useState<K8sCluster[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('ALL');

  useEffect(() => {
    apiClient.getDeployedDatabases().then((dbs) => {
      if (dbs && dbs.length > 0) {
        setDeployedDbs(dbs);
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

  const totalCost = allDbs.reduce((sum, db) => sum + (db.monthly_cost || 0), 0);
  const computeCost = totalCost * 0.65;
  const storageCost = totalCost * 0.30;
  const networkCost = totalCost * 0.05;
  const potentialSavings = totalCost * 0.18; // 18% savings with automated right-sizing

  // Helper to map cluster name to Cloud Provider
  const getCloudProviderForCluster = (clusterName: string) => {
    const cluster = allClusters.find((c) => c.name === clusterName);
    if (!cluster) return { name: 'On-Premise', color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
    const prov = cluster.provider.toUpperCase();
    if (prov.includes('AWS') || prov.includes('EKS')) {
      return { name: 'AWS EKS', color: 'text-amber-500', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
    }
    if (prov.includes('GCP') || prov.includes('GKE')) {
      return { name: 'GCP GKE', color: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400' };
    }
    if (prov.includes('AZURE') || prov.includes('AKS')) {
      return { name: 'Azure AKS', color: 'text-sky-400', badge: 'bg-sky-500/10 border-sky-500/20 text-sky-400' };
    }
    if (prov.includes('DIGITALOCEAN') || prov.includes('DOKS')) {
      return { name: 'DigitalOcean', color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400' };
    }
    return { name: 'On-Premise', color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
  };

  const getEngineIconUrl = (engineType: string): string => {
    const item = CATALOG_ITEMS.find((c) => c.engine_type.toLowerCase() === engineType.toLowerCase());
    return item?.icon_url || 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png';
  };

  const filteredDbs = allDbs.filter((db) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = db.name.toLowerCase().includes(q);
      const matchEngine = db.engine_type.toLowerCase().includes(q);
      if (!matchName && !matchEngine) return false;
    }
    if (selectedClusterFilter !== 'ALL' && db.cluster_name !== selectedClusterFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Monthly Spend */}
        <div className="bg-gradient-to-tr from-bg-card via-bg-card to-brand-blue/15 border border-accent-darkBorder p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Monthly Spend</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-white mt-3 font-mono">
            ${totalCost.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ mo</span>
          </h3>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +3.8% from last cycle
          </p>
        </div>

        {/* Compute Allocation */}
        <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">K8s Compute (CPU & RAM)</span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 font-mono">${computeCost.toFixed(2)}</h3>
          <span className="text-xs text-slate-400 mt-1 block">65% of overall database infra</span>
        </div>

        {/* Storage Allocation */}
        <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Persistent Disks (PVC SSD)</span>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 font-mono">${storageCost.toFixed(2)}</h3>
          <span className="text-xs text-slate-400 mt-1 block">30% volume & snapshot storage</span>
        </div>

        {/* FinOps Potential Savings */}
        <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Savings</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-amber-400 mt-3 font-mono">${potentialSavings.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ mo</span></h3>
          <span className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" /> Potential 18% optimization
          </span>
        </div>

      </div>

      {/* 2. Active Database Instance Cost Breakdown */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-accent-darkBorder/80 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Database Cost Allocation & Resource Breakdown</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredDbs.length} Instances
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular monthly cost tracking per active database deployment across cloud clusters
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search instance..."
                className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/50 focus:border-brand-sky text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 transition-all font-semibold"
              />
            </div>

            <select
              value={selectedClusterFilter}
              onChange={(e) => setSelectedClusterFilter(e.target.value)}
              className="bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-sky transition-all font-semibold"
            >
              <option value="ALL">All Clusters</option>
              {allClusters.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Database Rows List */}
        <div className="space-y-3">
          {filteredDbs.map((db) => {
            const cost = db.monthly_cost || 50;
            const dbCompute = cost * 0.65;
            const dbStorage = cost * 0.30;
            const dbNetwork = cost * 0.05;
            const prov = getCloudProviderForCluster(db.cluster_name);
            const iconUrl = getEngineIconUrl(db.engine_type);

            return (
              <div 
                key={db.id} 
                className="p-5 bg-bg-main/80 border border-accent-darkBorder hover:border-slate-700 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all hover:bg-bg-main shadow-inner group"
              >
                {/* Left: DB Engine & Name */}
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={iconUrl}
                    alt={db.name}
                    className="w-11 h-11 object-contain rounded-xl bg-slate-950 p-2 border border-accent-darkBorder shadow-inner shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm group-hover:text-brand-sky transition-colors">{db.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {db.engine_type} {db.version ? `v${db.version}` : ''}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${prov.badge}`}>
                        {prov.name} ({db.cluster_name})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Namespace: <span className="text-slate-300">{db.namespace || 'databases'}</span> • Storage: <span className="text-slate-300">{db.storage_gb || 50}GB</span>
                    </p>
                  </div>
                </div>

                {/* Right: Cost breakdown columns */}
                <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-between w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800 text-xs font-mono">
                  
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Compute</span>
                    <span className="font-bold text-sky-400">${dbCompute.toFixed(2)}</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Storage</span>
                    <span className="font-bold text-purple-400">${dbStorage.toFixed(2)}</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Daily Cost</span>
                    <span className="font-bold text-slate-300">${(cost / 30).toFixed(2)}/d</span>
                  </div>

                  <div className="text-left sm:text-right pl-4 border-l border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Monthly Total</span>
                    <span className="text-lg font-extrabold text-emerald-400">${cost.toFixed(2)}</span>
                  </div>

                </div>
              </div>
            );
          })}

          {filteredDbs.length === 0 && (
            <div className="p-12 text-center text-slate-400 border border-dashed border-accent-darkBorder rounded-2xl space-y-2">
              <DollarSign className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">No database instances found</p>
              <p className="text-xs text-slate-400">Try changing your search query or cluster filter</p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Cost Optimization Recommendations Banner */}
      <div className="p-5 bg-slate-900/60 border border-brand-sky/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">FinOps Automated Cost Optimization Available</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Enable auto-scaling and storage deduplication policies to reduce idle database infrastructure costs by up to 18%.
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/80 text-white rounded-xl font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <span>View Optimization Rules</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
