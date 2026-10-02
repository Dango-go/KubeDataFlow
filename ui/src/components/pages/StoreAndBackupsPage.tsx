import React, { useState } from 'react';
import { 
  HardDrive, 
  Database, 
  RotateCcw, 
  Clock, 
  ShieldCheck, 
  Download, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FolderArchive, 
  Cloud, 
  Lock, 
  RefreshCw, 
  Sliders, 
  Play, 
  Trash2, 
  FileText,
  Search,
  Check
} from 'lucide-react';

interface BackupSnapshot {
  id: string;
  db_name: string;
  engine_type: string;
  size: string;
  created_at: string;
  type: 'Scheduled' | 'On-Demand' | 'Final-PreDelete';
  storage_target: string;
  status: 'Completed' | 'In-Progress' | 'Failed';
}

interface BackupSchedule {
  id: string;
  db_name: string;
  cron_expression: string;
  retention_days: number;
  last_run: string;
  next_run: string;
  is_active: boolean;
}

export const StoreAndBackupsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'snapshots' | 'schedules' | 'pitr' | 'storage'>('snapshots');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Mock Snapshots Data
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([
    {
      id: 'snap-pg-20260816-0100',
      db_name: 'my-postgresql-db',
      engine_type: 'postgresql',
      size: '14.8 GB',
      created_at: '2026-08-16 02:00:15 UTC',
      type: 'Scheduled',
      storage_target: 's3://databask-backups-us-east-1/pg/',
      status: 'Completed',
    },
    {
      id: 'snap-pg-ondemand-before-migration',
      db_name: 'my-postgresql-db',
      engine_type: 'postgresql',
      size: '14.7 GB',
      created_at: '2026-08-16 14:10:00 UTC',
      type: 'On-Demand',
      storage_target: 's3://databask-backups-us-east-1/pg/',
      status: 'Completed',
    },
    {
      id: 'snap-redis-prod-01',
      db_name: 'prod-redis-cache',
      engine_type: 'redis',
      size: '2.4 GB',
      created_at: '2026-08-16 04:00:00 UTC',
      type: 'Scheduled',
      storage_target: 's3://databask-backups-us-east-1/redis/',
      status: 'Completed',
    },
    {
      id: 'snap-clickhouse-analytics-daily',
      db_name: 'analytics-clickhouse',
      engine_type: 'clickhouse',
      size: '88.3 GB',
      created_at: '2026-08-15 23:30:00 UTC',
      type: 'Scheduled',
      storage_target: 'minio://onprem-backup-target/clickhouse/',
      status: 'Completed',
    },
  ]);

  // Mock Schedules Data
  const [schedules, setSchedules] = useState<BackupSchedule[]>([
    {
      id: 'sched-01',
      db_name: 'my-postgresql-db',
      cron_expression: '0 2 * * * (Daily at 02:00 AM)',
      retention_days: 30,
      last_run: '2026-08-16 02:00 UTC',
      next_run: '2026-08-17 02:00 UTC',
      is_active: true,
    },
    {
      id: 'sched-02',
      db_name: 'prod-redis-cache',
      cron_expression: '0 4 * * * (Daily at 04:00 AM)',
      retention_days: 14,
      last_run: '2026-08-16 04:00 UTC',
      next_run: '2026-08-17 04:00 UTC',
      is_active: true,
    },
    {
      id: 'sched-03',
      db_name: 'analytics-clickhouse',
      cron_expression: '30 23 * * * (Daily at 23:30 PM)',
      retention_days: 90,
      last_run: '2026-08-15 23:30 UTC',
      next_run: '2026-08-16 23:30 UTC',
      is_active: true,
    },
  ]);

  // PITR State
  const [selectedPitrDb, setSelectedPitrDb] = useState<string>('my-postgresql-db');
  const [pitrMinuteOffset, setPitrMinuteOffset] = useState<number>(15);
  const [isRestoringPitr, setIsRestoringPitr] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  const handleCreateInstantSnapshot = () => {
    const newSnap: BackupSnapshot = {
      id: `snap-instant-${Date.now().toString().slice(-6)}`,
      db_name: 'my-postgresql-db',
      engine_type: 'postgresql',
      size: '14.8 GB',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      type: 'On-Demand',
      storage_target: 's3://databask-backups-us-east-1/pg/',
      status: 'Completed',
    };
    setSnapshots([newSnap, ...snapshots]);
    showNotification('⚡ Instant Snapshot triggered & saved to S3 target bucket!');
  };

  const handleExecuteRestore = (snapId: string, dbName: string) => {
    showNotification(`🔄 Initiating restoration job from ${snapId} for database '${dbName}'...`);
  };

  const handleExecutePitrRestore = () => {
    setIsRestoringPitr(true);
    setTimeout(() => {
      setIsRestoringPitr(false);
      showNotification(`✓ Point-in-Time Recovery successfully completed for '${selectedPitrDb}'! Target state restored to T-${pitrMinuteOffset}m.`);
    }, 1800);
  };

  const filteredSnapshots = snapshots.filter(
    (s) => s.db_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-slate-100">
      
      {/* Top Banner & Title Header */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-accent-darkBorder/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-sky/40 flex items-center justify-center text-brand-sky shadow-md">
                <HardDrive className="w-5 h-5 text-brand-sky" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Store & Backups Management
                  <span className="text-xs font-bold bg-brand-blue/20 text-brand-sky border border-brand-sky/30 px-2.5 py-0.5 rounded-full">
                    S3 / MinIO Storage
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage automated backup schedules, S3 object storage targets, instant snapshots, and Point-in-Time Recovery (PITR).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCreateInstantSnapshot}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Instant Snapshot
            </button>

            <button
              onClick={() => showNotification('S3 Storage Target settings modal opened.')}
              className="bg-bg-main hover:bg-accent-darkHover border border-accent-darkBorder text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
            >
              <Cloud className="w-4 h-4 text-brand-sky" /> Connect S3 Storage
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Total Backups Stored <FolderArchive className="w-4 h-4 text-brand-sky" />
            </span>
            <div className="text-xl font-black text-white">148 Snapshots</div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Total Volume: 1.82 TB
            </span>
          </div>

          <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Backup Protection Status <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="text-xl font-black text-emerald-400">99.9% Protected</div>
            <span className="text-[11px] text-slate-400 font-semibold">3 Active DBs Scheduled</span>
          </div>

          <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Storage Targets <Cloud className="w-4 h-4 text-brand-sky" />
            </span>
            <div className="text-xl font-black text-white">2 Targets</div>
            <span className="text-[11px] text-slate-400 font-semibold">AWS S3 (US-East) & MinIO</span>
          </div>

          <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              RPO / RTO Target <Clock className="w-4 h-4 text-amber-400" />
            </span>
            <div className="text-xl font-black text-amber-400 font-mono">&lt; 1m / &lt; 5m</div>
            <span className="text-[11px] text-emerald-400 font-semibold">PITR Continuous WAL Active</span>
          </div>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-400 hover:text-white font-mono">✕</button>
        </div>
      )}

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center gap-2 border-b border-accent-darkBorder pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('snapshots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'snapshots'
              ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
              : 'bg-bg-card border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover hover:text-white'
          }`}
        >
          <FolderArchive className="w-4 h-4" /> Snapshots & Recovery ({snapshots.length})
        </button>

        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'schedules'
              ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
              : 'bg-bg-card border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Backup Schedules ({schedules.length})
        </button>

        <button
          onClick={() => setActiveSubTab('pitr')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'pitr'
              ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
              : 'bg-bg-card border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" /> Point-in-Time Recovery (PITR)
        </button>

        <button
          onClick={() => setActiveSubTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'storage'
              ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
              : 'bg-bg-card border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4 text-brand-sky" /> Object Storage Buckets (S3)
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SNAPSHOTS & RECOVERY */}
      {/* ======================================================== */}
      {activeSubTab === 'snapshots' && (
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-brand-sky" /> Stored Database Snapshots
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Click restore to roll back database to target snapshot point</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snapshot ID or DB name..."
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-accent-darkBorder rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-main text-slate-400 font-sans uppercase font-bold border-b border-accent-darkBorder text-[11px]">
                <tr>
                  <th className="p-3.5">Snapshot ID</th>
                  <th className="p-3.5">Database Instance</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Created Time</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Storage Location</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-darkBorder">
                {filteredSnapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-bg-main/60 transition-colors">
                    <td className="p-3.5 font-bold text-brand-sky flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-brand-sky shrink-0" />
                      {snap.id}
                    </td>
                    <td className="p-3.5 font-bold text-white font-sans">
                      {snap.db_name}
                      <span className="block text-[10px] text-slate-500 font-mono font-normal">Engine: {snap.engine_type}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-bold">{snap.size}</td>
                    <td className="p-3.5 text-slate-400">{snap.created_at}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        snap.type === 'Scheduled'
                          ? 'bg-brand-blue/20 text-brand-sky border-brand-sky/30'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                      }`}>
                        {snap.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 truncate max-w-[200px]" title={snap.storage_target}>
                      {snap.storage_target}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleExecuteRestore(snap.id, snap.db_name)}
                        className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-lg transition-all"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" /> Restore
                      </button>
                      <button
                        onClick={() => showNotification(`Downloading archive for ${snap.id}...`)}
                        className="bg-bg-main text-slate-300 hover:bg-accent-darkHover border border-accent-darkBorder text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                      >
                        <Download className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BACKUP SCHEDULES */}
      {/* ======================================================== */}
      {activeSubTab === 'schedules' && (
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-sky" /> Backup Policies & Cron Schedules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated recurring snapshots per database instance</p>
            </div>

            <button
              onClick={() => showNotification('New schedule dialog opened.')}
              className="bg-brand-blue text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Schedule Policy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schedules.map((sched) => (
              <div key={sched.id} className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
                  <span className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-brand-sky" /> {sched.db_name}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Active Policy
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Cron Schedule:</span>
                    <span className="text-brand-sky font-bold">{sched.cron_expression}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Retention Period:</span>
                    <span className="text-white font-bold">{sched.retention_days} Days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Last Run:</span>
                    <span className="text-slate-300">{sched.last_run}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Next Execution:</span>
                    <span className="text-emerald-400 font-bold">{sched.next_run}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-accent-darkBorder/60 flex items-center justify-between">
                  <button 
                    onClick={() => showNotification(`Executing manual run for schedule ${sched.id}...`)}
                    className="text-xs font-bold text-brand-sky hover:underline flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Run Now
                  </button>
                  <button className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: POINT-IN-TIME RECOVERY (PITR) */}
      {/* ======================================================== */}
      {activeSubTab === 'pitr' && (
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-accent-darkBorder pb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Point-in-Time Recovery (PITR Timeline)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Roll back database state to any exact second in the past using continuous WAL binary logs
            </p>
          </div>

          <div className="p-6 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Target Database Instance
                </label>
                <select
                  value={selectedPitrDb}
                  onChange={(e) => setSelectedPitrDb(e.target.value)}
                  className="w-full bg-bg-card border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                >
                  <option value="my-postgresql-db">my-postgresql-db (PostgreSQL 16)</option>
                  <option value="prod-redis-cache">prod-redis-cache (Redis 7.2)</option>
                  <option value="analytics-clickhouse">analytics-clickhouse (ClickHouse 24.1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Selected Restore Target Time
                </label>
                <div className="w-full bg-bg-card border border-accent-darkBorder text-amber-400 font-mono text-sm font-bold rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span>T - {pitrMinuteOffset} Minutes Ago</span>
                  <span className="text-xs text-slate-400">Continuous WAL Stream</span>
                </div>
              </div>
            </div>

            {/* Interactive Timeline Slider */}
            <div className="space-y-3 pt-4 border-t border-accent-darkBorder/60">
              <div className="flex justify-between text-xs font-bold text-slate-400 font-mono">
                <span>30 Minutes Ago</span>
                <span className="text-brand-sky">Current Time (NOW)</span>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                value={pitrMinuteOffset}
                onChange={(e) => setPitrMinuteOffset(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-bg-card rounded-lg appearance-none cursor-pointer accent-brand-sky"
              />

              <p className="text-xs text-slate-400 text-center font-mono pt-1">
                Target Timestamp: <strong className="text-white">2026-08-16 19:45:{30 - pitrMinuteOffset} UTC</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> PITR rollback creates a safe pre-restore snapshot automatically
              </span>

              <button
                onClick={handleExecutePitrRestore}
                disabled={isRestoringPitr}
                className="bg-amber-600 hover:bg-amber-600/90 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoringPitr ? 'animate-spin' : ''}`} />
                {isRestoringPitr ? 'Restoring to Target Timestamp...' : 'Execute Point-in-Time Recovery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: S3 OBJECT STORAGE BUCKETS */}
      {/* ======================================================== */}
      {activeSubTab === 'storage' && (
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand-sky" /> Connected Object Storage Buckets
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">S3-compatible targets for off-site backup storage & disaster recovery</p>
            </div>

            <button 
              onClick={() => showNotification('S3 bucket modal opened.')}
              className="bg-brand-blue text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add S3 Bucket Target
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-brand-sky" />
                  <div>
                    <h4 className="font-extrabold text-sm text-white">databask-backups-us-east-1</h4>
                    <span className="text-[10px] text-slate-400 font-mono">AWS S3 (us-east-1)</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Primary Bucket
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Endpoint URL:</span>
                  <span className="text-slate-200">s3.amazonaws.com</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Encryption:</span>
                  <span className="text-emerald-400 font-bold">AES-256 (KMS Enabled)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Occupied Space:</span>
                  <span className="text-white font-bold">1.45 TB</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="font-extrabold text-sm text-white">onprem-backup-target</h4>
                    <span className="text-[10px] text-slate-400 font-mono">On-Premise MinIO Cluster</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  On-Prem Secondary
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Endpoint URL:</span>
                  <span className="text-slate-200">minio.internal.company.net:9000</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Encryption:</span>
                  <span className="text-emerald-400 font-bold">TLS Encrypted</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Occupied Space:</span>
                  <span className="text-white font-bold">370 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
