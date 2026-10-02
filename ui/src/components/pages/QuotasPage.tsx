import React, { useState } from 'react';
import { 
  Gauge, 
  Cpu, 
  HardDrive, 
  Database, 
  DollarSign, 
  ShieldCheck, 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Lock, 
  Globe, 
  Zap, 
  Layers
} from 'lucide-react';
import { INITIAL_DEPLOYED_DBS } from '../../services/mockData';

export const QuotasPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'settings'>('overview');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // 1. Compute current usage dynamically from active deployed databases
  const currentDbCount = INITIAL_DEPLOYED_DBS.length;
  const currentCpuUsed = INITIAL_DEPLOYED_DBS.reduce((sum, db) => sum + (db.cpu_usage_m / 1000), 0);
  const currentRamUsed = INITIAL_DEPLOYED_DBS.reduce((sum, db) => sum + Math.round(db.memory_usage_mb / 1024), 0);
  const currentStorageUsed = INITIAL_DEPLOYED_DBS.reduce((sum, db) => sum + db.storage_gb, 0);
  const currentMonthlySpend = INITIAL_DEPLOYED_DBS.reduce((sum, db) => sum + db.monthly_cost, 0);

  // 2. Global Quota Settings State (User customizable guardrails)
  const [quotaSettings, setQuotaSettings] = useState({
    // Compute & Memory Limits
    max_cpu_cores: 16,
    max_ram_gb: 64,
    max_single_db_cpu: 4,
    max_single_db_ram_gb: 16,

    // Storage Limits
    max_total_storage_gb: 500,
    max_single_disk_gb: 100,
    allowed_storage_classes: ['standard', 'gp3-sc'],

    // Instances & Replicas Limits
    max_db_instances: 10,
    max_replicas_per_db: 3,

    // Cost & Billing Guardrails
    max_monthly_budget_usd: 250,
    alert_threshold_percent: 80,
    auto_stop_on_overbudget: true,

    // Security & Access Restrictions
    allow_public_ip: false,
    enforce_ssl: true,
  });

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  // Helper percentage calculators
  const cpuPercent = Math.min(100, Math.round((currentCpuUsed / quotaSettings.max_cpu_cores) * 100));
  const ramPercent = Math.min(100, Math.round((currentRamUsed / quotaSettings.max_ram_gb) * 100));
  const storagePercent = Math.min(100, Math.round((currentStorageUsed / quotaSettings.max_total_storage_gb) * 100));
  const instancePercent = Math.min(100, Math.round((currentDbCount / quotaSettings.max_db_instances) * 100));
  const budgetPercent = Math.min(100, Math.round((currentMonthlySpend / quotaSettings.max_monthly_budget_usd) * 100));

  const getBadgeColor = (percent: number) => {
    if (percent >= 90) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (percent >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-gradient-to-r from-rose-500 to-red-400';
    if (percent >= 75) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-brand-blue via-brand-sky to-brand-cyan';
  };

  return (
    <div className="space-y-8 text-slate-100 pb-12">
      {/* 1. Header Banner & Sub-Tab Navigation */}
      <div className="flex items-center justify-between bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-sky to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Resource Quotas & Guardrails</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal cloud governance, custom resource limits, and automated budget guardrails
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-bg-main border border-accent-darkBorder rounded-xl">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Usage Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'settings'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Global Quota Settings</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-4 gap-6">
            {/* CPU Metric Card */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total CPU Cores</span>
                <Cpu className="w-5 h-5 text-brand-sky" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white">{currentCpuUsed}</h3>
                <span className="text-sm font-semibold text-slate-400">/ {quotaSettings.max_cpu_cores} Cores</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Consumption</span>
                  <span className={cpuPercent >= 80 ? 'text-amber-400' : 'text-brand-sky'}>{cpuPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(cpuPercent)}`} style={{ width: `${cpuPercent}%` }} />
                </div>
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RAM Memory</span>
                <Server className="w-5 h-5 text-brand-cyan" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white">{currentRamUsed}</h3>
                <span className="text-sm font-semibold text-slate-400">/ {quotaSettings.max_ram_gb} GB</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Consumption</span>
                  <span className={ramPercent >= 80 ? 'text-amber-400' : 'text-brand-cyan'}>{ramPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(ramPercent)}`} style={{ width: `${ramPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Storage Metric Card */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Storage Disks</span>
                <HardDrive className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white">{currentStorageUsed}</h3>
                <span className="text-sm font-semibold text-slate-400">/ {quotaSettings.max_total_storage_gb} GB</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Consumption</span>
                  <span className={storagePercent >= 80 ? 'text-amber-400' : 'text-emerald-400'}>{storagePercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(storagePercent)}`} style={{ width: `${storagePercent}%` }} />
                </div>
              </div>
            </div>

            {/* DB Count Card */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">DB Instances</span>
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white">{currentDbCount}</h3>
                <span className="text-sm font-semibold text-slate-400">/ {quotaSettings.max_db_instances} Max</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Quota Limit</span>
                  <span className="text-purple-400">{instancePercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(instancePercent)}`} style={{ width: `${instancePercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Guardrail Bar Card */}
          <div className="bg-gradient-to-r from-bg-card via-bg-main to-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Monthly Infrastructure Budget Guardrail</h4>
                <p className="text-xs text-slate-400">
                  Current spend: <span className="text-emerald-400 font-bold">${currentMonthlySpend.toFixed(2)}</span> of <span className="text-white font-bold">${quotaSettings.max_monthly_budget_usd}.00</span> maximum budget limit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-48 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Budget Spent</span>
                  <span className="text-emerald-400">{budgetPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${budgetPercent}%` }} />
                </div>
              </div>

              <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${getBadgeColor(budgetPercent)}`}>
                <ShieldCheck className="w-4 h-4" />
                <span>Guardrail Active</span>
              </div>
            </div>
          </div>

          {/* Active Database Quota Breakdown Table */}
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Database Quota Contribution</h3>
              <p className="text-xs text-slate-400">Real-time resource allocation per active deployed database instance</p>
            </div>

            <div className="space-y-3">
              {INITIAL_DEPLOYED_DBS.map((db) => (
                <div key={db.id} className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/30 text-brand-sky flex items-center justify-center font-bold text-sm">
                      {db.engine_type.toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{db.name}</h4>
                      <p className="text-xs text-slate-500">{db.cluster_name} • {db.namespace}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <span className="text-[11px] text-slate-400 block font-semibold">CPU Cores</span>
                      <span className="text-xs font-bold text-slate-200">{(db.cpu_usage_m / 1000).toFixed(1)} Cores</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] text-slate-400 block font-semibold">RAM</span>
                      <span className="text-xs font-bold text-slate-200 font-mono">{(db.memory_usage_mb / 1024).toFixed(0)} GB</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] text-slate-400 block font-semibold">PVC Storage</span>
                      <span className="text-xs font-bold text-slate-200">{db.storage_gb} GB SSD</span>
                    </div>

                    <div className="text-right pl-4 border-l border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-semibold">Cost</span>
                      <span className="text-xs font-extrabold text-emerald-400">${db.monthly_cost}/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. GLOBAL QUOTA SETTINGS SUB-TAB */}
      {activeSubTab === 'settings' && (
        <div className="space-y-8">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-bg-card via-bg-main to-bg-card border border-accent-darkBorder p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-brand-sky" />
              <div>
                <h3 className="font-bold text-white text-base">Global Quota Settings & Policy Controls</h3>
                <p className="text-xs text-slate-400">Configure custom limits, maximum instance bounds, and automated budget safety rules</p>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                isSaved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-brand-blue hover:bg-brand-blue/90 text-white shadow-brand-blue/30'
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Settings Saved!' : 'Save Quota Settings'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 1. Compute & RAM Limits Panel */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Cpu className="w-5 h-5 text-brand-sky" />
                <h4 className="font-bold text-white text-base">Compute & Memory Guardrails</h4>
              </div>

              {/* Total Max CPU Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Total CPU Cores (Platform Total)</span>
                  <span className="text-brand-sky font-bold text-sm">{quotaSettings.max_cpu_cores} Cores</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  step="2"
                  value={quotaSettings.max_cpu_cores}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_cpu_cores: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-sky"
                />
                <p className="text-[11px] text-slate-500">Maximum cumulative CPU cores allowed across all running databases</p>
              </div>

              {/* Total Max RAM Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Total RAM Memory</span>
                  <span className="text-brand-cyan font-bold text-sm">{quotaSettings.max_ram_gb} GB</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="256"
                  step="8"
                  value={quotaSettings.max_ram_gb}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_ram_gb: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
                <p className="text-[11px] text-slate-500">Maximum cumulative RAM memory allocation allowed across platform</p>
              </div>

              {/* Single DB CPU Limit Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Single DB CPU Limit</span>
                  <span className="text-white font-bold text-sm">{quotaSettings.max_single_db_cpu} Cores</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={quotaSettings.max_single_db_cpu}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_single_db_cpu: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[11px] text-slate-500">Prevents accidentally deploying a single database instance larger than this bound</p>
              </div>

              {/* Single DB RAM Limit Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Single DB RAM Limit</span>
                  <span className="text-white font-bold text-sm">{quotaSettings.max_single_db_ram_gb} GB</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="64"
                  step="2"
                  value={quotaSettings.max_single_db_ram_gb}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_single_db_ram_gb: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            {/* 2. Storage & Disk Volumes Panel */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white text-base">Storage & PVC Volume Limits</h4>
              </div>

              {/* Total Max Storage Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Total Storage Limit</span>
                  <span className="text-emerald-400 font-bold text-sm">{quotaSettings.max_total_storage_gb} GB SSD</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={quotaSettings.max_total_storage_gb}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_total_storage_gb: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <p className="text-[11px] text-slate-500">Maximum cumulative PVC disk storage quota across all clusters</p>
              </div>

              {/* Single Disk Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Single Disk Volume Size</span>
                  <span className="text-white font-bold text-sm">{quotaSettings.max_single_disk_gb} GB</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={quotaSettings.max_single_disk_gb}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_single_disk_gb: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[11px] text-slate-500">Upper limit for PVC disk volume size during wizard deployment</p>
              </div>

              {/* Allowed Storage Classes Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <span className="text-xs font-semibold text-slate-300 block">Allowed Kubernetes Storage Classes</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {['standard', 'gp3-sc', 'fast-nvme', 'high-iops'].map((sc) => {
                    const isSelected = quotaSettings.allowed_storage_classes.includes(sc);
                    return (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? quotaSettings.allowed_storage_classes.filter((c) => c !== sc)
                            : [...quotaSettings.allowed_storage_classes, sc];
                          setQuotaSettings({ ...quotaSettings, allowed_storage_classes: updated });
                        }}
                        className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{sc}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Cost & Budget Guardrails Panel */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-base">FinOps & Budget Guardrails</h4>
              </div>

              {/* Monthly Budget Limit */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Max Monthly Budget Limit ($ USD)</span>
                  <span className="text-amber-400 font-bold text-sm">${quotaSettings.max_monthly_budget_usd}.00 / mo</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={quotaSettings.max_monthly_budget_usd}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, max_monthly_budget_usd: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[11px] text-slate-500">Maximum projected monthly cost ceiling for cloud infrastructure</p>
              </div>

              {/* Alert Threshold Percent */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Alert Warning Threshold</span>
                  <span className="text-white font-bold text-sm">{quotaSettings.alert_threshold_percent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={quotaSettings.alert_threshold_percent}
                  onChange={(e) => setQuotaSettings({ ...quotaSettings, alert_threshold_percent: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[11px] text-slate-500">Triggers alert notifications when monthly spend crosses this percentage</p>
              </div>

              {/* Auto Stop Toggle */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white text-sm">Auto-Pause On Budget Exceed</h5>
                  <p className="text-[11px] text-slate-400">Automatically scale non-critical DB replicas to 0 if budget limit is breached</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotaSettings({ ...quotaSettings, auto_stop_on_overbudget: !quotaSettings.auto_stop_on_overbudget })}
                  className={`w-12 h-6 rounded-full transition-colors p-1 ${
                    quotaSettings.auto_stop_on_overbudget ? 'bg-brand-blue' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    quotaSettings.auto_stop_on_overbudget ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* 4. Security & Access Policy Controls Panel */}
            <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-white text-base">Network & Security Controls</h4>
              </div>

              {/* Enforce SSL Toggle */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Enforce Mandatory TLS/SSL</h5>
                    <p className="text-[11px] text-slate-400">Require all deployed database instances to encrypt connection strings</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuotaSettings({ ...quotaSettings, enforce_ssl: !quotaSettings.enforce_ssl })}
                  className={`w-12 h-6 rounded-full transition-colors p-1 ${
                    quotaSettings.enforce_ssl ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    quotaSettings.enforce_ssl ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Allow Public IP Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Allow Public External IPs</h5>
                    <p className="text-[11px] text-slate-400">Permit LoadBalancer public IPs (if disabled, ClusterIP internal only)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuotaSettings({ ...quotaSettings, allow_public_ip: !quotaSettings.allow_public_ip })}
                  className={`w-12 h-6 rounded-full transition-colors p-1 ${
                    quotaSettings.allow_public_ip ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    quotaSettings.allow_public_ip ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Active Security Guardrail summary box */}
              <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Security Guardrail Status</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Database deployment requests violating these security toggles will be rejected automatically before cluster execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
