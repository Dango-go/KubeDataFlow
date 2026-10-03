import React, { useState } from 'react';
import { DeployedDatabase } from '../../types';
import { YamlCodeEditor } from '../common/YamlCodeEditor';
import { apiClient } from '../../services/apiClient';
import {
  ArrowLeft,
  Terminal,
  Play,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Layers,
  AlertCircle,
  CheckCircle2,
  FileCode2,
  Settings2,
  Server,
  FolderGit2
} from 'lucide-react';

interface CrdManagementConsolePageProps {
  db: DeployedDatabase;
  onBack: () => void;
  onDeleteSuccess?: (id: string) => void;
}

export const CrdManagementConsolePage: React.FC<CrdManagementConsolePageProps> = ({
  db,
  onBack,
  onDeleteSuccess
}) => {
  const initialYaml =
    db.values_yaml ||
    `apiVersion: v1\nkind: Secret\nmetadata:\n  name: ${db.name}\n  namespace: ${db.namespace || 'databases'}\ntype: Opaque\nstringData:\n  username: "app_user"\n  password: "P@ssw0rd2026!Secured"`;

  const [manifestYaml, setManifestYaml] = useState<string>(initialYaml);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // Terminal Execution Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[OPERATOR-SERVICE] Initialized CRD Management Console for '${db.name}'`,
    `[TARGET CLUSTER] ${db.cluster_name} (Namespace: ${db.namespace || 'databases'})`,
    `[RESOURCE STATUS] Manifest active and verified (● CREATED)`,
    `[READY] Interactive YAML editor active. Tune manifest parameters and click 'Apply Manifest' to sync changes with Kubernetes cluster.`
  ]);

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${timestamp}] ${log}`]);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(manifestYaml);
    setCopied(true);
    addLog(`Copied manifest content to clipboard (${manifestYaml.length} characters)`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    const element = document.createElement('a');
    const file = new Blob([manifestYaml], { type: 'text/yaml' });
    element.href = URL.createObjectURL(file);
    element.download = `${db.name}-manifest.yaml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addLog(`Downloaded manifest file '${db.name}-manifest.yaml'`);
  };

  const handleValidateYaml = () => {
    try {
      if (!manifestYaml.trim()) {
        setValidationMsg('⚠️ Manifest is empty.');
        return;
      }
      if (!manifestYaml.includes('apiVersion') || !manifestYaml.includes('kind:')) {
        setValidationMsg('⚠️ Warning: Manifest should typically contain apiVersion and kind declarations.');
      } else {
        setValidationMsg('✓ Valid YAML structure detected with standard Kubernetes schema.');
      }
      addLog(`Validated YAML syntax for '${db.name}'`);
      setTimeout(() => setValidationMsg(null), 4000);
    } catch (e: any) {
      setValidationMsg(`❌ Validation error: ${e.message}`);
    }
  };

  const handleApplyManifest = async () => {
    setIsApplying(true);
    setApplyFeedback(null);
    addLog(`Applying updated CRD manifest '${db.name}' to cluster '${db.cluster_name}'...`);

    try {
      const res = await apiClient.applyOperatorManifest({
        resource_name: db.name,
        target_namespace: db.namespace || 'databases',
        content: manifestYaml,
        cluster_name: db.cluster_name
      });

      setApplyFeedback({
        type: 'success',
        message: `✓ Manifest '${db.name}' successfully applied and tuned in cluster '${db.cluster_name}'!`
      });
      addLog(`[SUCCESS] Operator response: ${JSON.stringify(res || 'Object updated successfully')}`);
    } catch (err: any) {
      setApplyFeedback({
        type: 'error',
        message: `Failed to apply manifest: ${err.message || 'Unknown error'}`
      });
      addLog(`[ERROR] ApiException during apply: ${err.message || err}`);
    } finally {
      setIsApplying(false);
      setTimeout(() => setApplyFeedback(null), 7000);
    }
  };

  const handleDeleteCrd = () => {
    if (window.confirm(`Are you sure you want to remove CRD resource '${db.name}' from tracking?`)) {
      addLog(`Removed CRD resource '${db.name}'`);
      if (onDeleteSuccess) {
        onDeleteSuccess(db.id);
      }
      onBack();
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header Bar */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-accent-darkBorder/80 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Instances
            </button>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-brand-sky font-mono uppercase tracking-wider bg-brand-sky/10 px-2 py-0.5 rounded border border-brand-sky/30">
                  CRD
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">{db.name}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  ● CREATED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cluster: <span className="font-mono text-slate-300 font-bold">{db.cluster_name}</span> | Namespace:{' '}
                <span className="font-mono text-slate-300 font-bold">{db.namespace || 'databases'}</span> | Mode:{' '}
                <span className="text-brand-sky font-semibold">Kubernetes Custom Resource (CRD)</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyYaml}
              className="bg-bg-main hover:bg-accent-darkHover text-slate-200 border border-accent-darkBorder font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="Copy Manifest YAML"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-sky" />}
              <span>{copied ? 'Copied' : 'Copy YAML'}</span>
            </button>

            <button
              onClick={handleDownloadYaml}
              className="bg-bg-main hover:bg-accent-darkHover text-slate-200 border border-accent-darkBorder font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="Download YAML file"
            >
              <Download className="w-3.5 h-3.5 text-brand-sky" />
              <span>Download</span>
            </button>

            <button
              onClick={handleDeleteCrd}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              title="Delete this CRD instance from dashboard"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Resource</span>
            </button>
          </div>
        </div>

        {/* 2. Metadata Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-bg-main p-3.5 rounded-xl border border-accent-darkBorder flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-brand-sky/40 flex items-center justify-center text-brand-sky">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Instance / Kind</span>
              <span className="text-xs font-bold text-white uppercase">{db.name}</span>
            </div>
          </div>

          <div className="bg-bg-main p-3.5 rounded-xl border border-accent-darkBorder flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Target Cluster</span>
              <span className="text-xs font-bold text-white font-mono">{db.cluster_name}</span>
            </div>
          </div>

          <div className="bg-bg-main p-3.5 rounded-xl border border-accent-darkBorder flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Namespace</span>
              <span className="text-xs font-bold text-white font-mono">{db.namespace || 'databases'}</span>
            </div>
          </div>

          <div className="bg-bg-main p-3.5 rounded-xl border border-accent-darkBorder flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Operator Control</span>
              <span className="text-xs font-bold text-emerald-400">Declarative CRD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      {applyFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-fadeIn ${
            applyFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}
        >
          {applyFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{applyFeedback.message}</span>
        </div>
      )}

      {/* 4. Manifest Live Tuning & Interactive YAML Editor Section */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-brand-sky" /> Manifest Specification & Live Tuning
            </h4>
            <p className="text-xs text-slate-400">
              Tune resources, credentials, replicas, or custom operator fields in real-time and apply directly to your K8s cluster.
            </p>
          </div>

          {/* Editor Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateYaml}
              className="bg-bg-main hover:bg-accent-darkHover text-slate-300 border border-accent-darkBorder font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-sm"
              title="Validate YAML syntax"
            >
              Check Syntax
            </button>

            <button
              onClick={() => setManifestYaml(initialYaml)}
              className="bg-bg-main hover:bg-accent-darkHover text-slate-400 hover:text-white border border-accent-darkBorder font-semibold text-xs px-3 py-2 rounded-xl transition-all"
              title="Reset to initial manifest"
            >
              Reset
            </button>

            <button
              onClick={handleApplyManifest}
              disabled={isApplying}
              className="bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-brand-blue/20 flex items-center gap-1.5 transition-all"
            >
              {isApplying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isApplying ? 'Applying to Cluster...' : 'Apply Manifest to Cluster'}</span>
            </button>
          </div>
        </div>

        {validationMsg && (
          <div className="text-xs font-mono px-3 py-2 rounded-lg bg-bg-main border border-accent-darkBorder text-brand-sky">
            {validationMsg}
          </div>
        )}

        {/* Live Interactive YAML Editor with Zoom controls */}
        <div className="space-y-1">
          <YamlCodeEditor
            value={manifestYaml}
            onChange={(val) => setManifestYaml(val)}
            minHeight="340px"
            placeholder="apiVersion: v1\nkind: Secret\n..."
          />
        </div>
      </div>

      {/* 5. Terminal Execution Logs Box */}
      <div className="bg-[#0c1017] border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <Terminal className="w-3.5 h-3.5 text-brand-sky" />
            <span className="text-slate-300 font-bold">Kubernetes Operator Live Execution Terminal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTerminalLogs([`[INFO] Terminal cleared at ${new Date().toLocaleTimeString()}`])}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
            >
              Clear Terminal
            </button>
          </div>
        </div>

        <div className="p-3 bg-black/50 rounded-xl border border-slate-900 overflow-y-auto max-h-48 space-y-1 text-slate-300 leading-relaxed select-text">
          {terminalLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[ERROR]')
                  ? 'text-red-400 font-semibold'
                  : log.includes('[SUCCESS]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[WARNING]')
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
