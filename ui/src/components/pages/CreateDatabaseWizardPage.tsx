import React, { useState, useEffect, useRef } from 'react';
import { CATALOG_ITEMS, K8S_CLUSTERS as MOCK_CLUSTERS } from '../../services/mockData';
import { DATABASE_CHARTS_CATALOG, DatabaseChartOption } from '../../services/chartCatalog';
import { apiClient } from '../../services/apiClient';
import { K8sCluster } from '../../types';
import { YamlCodeEditor } from '../common/YamlCodeEditor';
import { 
  PlusCircle, 
  Settings, 
  FileCode2, 
  Server, 
  HardDrive, 
  Cpu, 
  Play, 
  FilePlus, 
  Database,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Boxes,
  FolderTree,
  Save,
  Download,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Wand2,
  Lock,
  X,
  FileText,
  Tag,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  Layers,
  Zap,
  Check,
  Bookmark
} from 'lucide-react';

interface CreateDatabaseWizardPageProps {
  initialEngineType?: string;
  onSuccess: () => void;
}

interface HelmChartFileItem {
  name: string;
  path: string;
  content: string;
}

// Pre-defined Helm Chart File tree for each database engine
const HELM_CHART_FILES: Record<string, HelmChartFileItem[]> = {
  postgresql: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `primary:\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 2GB\n    work_mem = 16MB\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n    limits:\n      cpu: 2000m\n      memory: 8Gi\n  persistence:\n    enabled: true\n    size: 50Gi\nreadReplicas:\n  replicaCount: 2`
    },
    {
      name: 'templates/primary/statefulset.yaml',
      path: 'templates/primary/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}\n  labels:\n    app.kubernetes.io/component: primary\nspec:\n  replicas: 1\n  serviceName: {{ include "postgresql.primary.fullname" . }}-headless\n  template:\n    spec:\n      containers:\n        - name: postgresql\n          image: docker.io/bitnami/postgresql:16.2.0`
    },
    {
      name: 'templates/configmap.yaml',
      path: 'templates/configmap.yaml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}-configuration\ndata:\n  postgresql.conf: |\n    max_connections = 250\n    shared_buffers = 2GB\n    work_mem = 16MB\n    maintenance_work_mem = 256MB`
    },
    {
      name: 'templates/secrets.yaml',
      path: 'templates/secrets.yaml',
      content: `apiVersion: v1\nkind: Secret\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}\ntype: Opaque\nstringData:\n  postgres-password: "CHANGE_ME_IN_VAULT"\n  password: "SECURE_APP_DB_PASSWORD"`
    },
    {
      name: 'Chart.yaml',
      path: 'Chart.yaml',
      content: `apiVersion: v2\nname: postgresql\ndescription: Bitnami Helm chart for PostgreSQL database\nversion: 15.5.2\nappVersion: 16.2.0`
    }
  ],
  redis: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `architecture: replication\nmaster:\n  persistence:\n    enabled: true\n    size: 20Gi\n  resources:\n    requests:\n      cpu: 500m\n      memory: 2Gi\nreplica:\n  replicaCount: 3`
    },
    {
      name: 'templates/master/statefulset.yaml',
      path: 'templates/master/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "redis.master.fullname" . }}\nspec:\n  replicas: 1\n  serviceName: {{ include "redis.master.fullname" . }}-headless`
    },
    {
      name: 'templates/configmap.yaml',
      path: 'templates/configmap.yaml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "redis.fullname" . }}-configuration\ndata:\n  redis.conf: |\n    maxmemory-policy allkeys-lru\n    appendonly yes\n    save 60 1`
    }
  ],
  clickhouse: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `shards: 2\nreplicas: 2\nresources:\n  requests:\n    cpu: 2000m\n    memory: 8Gi\npersistence:\n  size: 200Gi`
    },
    {
      name: 'templates/statefulset.yaml',
      path: 'templates/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "clickhouse.fullname" . }}\nspec:\n  serviceName: {{ include "clickhouse.fullname" . }}-headless`
    },
    {
      name: 'templates/configmap-users.xml',
      path: 'templates/configmap-users.xml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "clickhouse.fullname" . }}-users\ndata:\n  users.xml: |\n    <clickhouse>\n      <users>\n        <default>\n          <password></password>\n        </default>\n      </users>\n    </clickhouse>`
    }
  ]
};

export const CreateDatabaseWizardPage: React.FC<CreateDatabaseWizardPageProps> = ({
  initialEngineType = 'postgresql',
  onSuccess
}) => {
  const [selectedEngine, setSelectedEngine] = useState(
    CATALOG_ITEMS.find((item) => item.engine_type === initialEngineType) || CATALOG_ITEMS[0]
  );
  const [selectedVersion, setSelectedVersion] = useState(selectedEngine.versions[0]);
  const [dbName, setDbName] = useState(`my-${selectedEngine.engine_type}-db`);

  // Selected Chart in ArtifactHub / Catalog
  const initialChart = DATABASE_CHARTS_CATALOG.find(
    (c) => c.engine_type === initialEngineType
  ) || DATABASE_CHARTS_CATALOG[0];

  const [selectedChartOption, setSelectedChartOption] = useState<DatabaseChartOption>(initialChart);

  // Search Combobox state
  const [chartSearchQuery, setChartSearchQuery] = useState<string>('');
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState<boolean>(false);
  const chartDropdownRef = useRef<HTMLDivElement>(null);

  // Cascading Dependent Selects for Provider -> Cluster
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');

  // Custom resource values input state
  const [customCpu, setCustomCpu] = useState<string>('2');
  const [customRam, setCustomRam] = useState<string>('8');
  const [customDisk, setCustomDisk] = useState<string>('50');

  // Selected preset for resources: 'Custom' | 'Small' | 'Medium' | 'Large'
  const [selectedPreset, setSelectedPreset] = useState<'Custom' | 'Small' | 'Medium' | 'Large'>('Medium');

  // 2 INSTALLATION MODES: 'helm' (Helm values.yaml) or 'crd' (Operator Service CRD Manifest)
  const [installMode, setInstallMode] = useState<'helm' | 'crd'>('helm');

  // Selected File inside Helm Chart & Load/Installed state
  const [selectedHelmFile, setSelectedHelmFile] = useState<string>('values.yaml');
  const [isChartLoaded, setIsChartLoaded] = useState<boolean>(false);
  const [isChartInstalled, setIsChartInstalled] = useState<boolean>(false);
  const [deployErrorMsg, setDeployErrorMsg] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let res = '';
    for (let i = 0; i < 20; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res + 'Secured';
  };

  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [dbPassword, setDbPassword] = useState<string>(generateRandomPassword());
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // YAML editor content for Helm (Mode 1)
  const [yamlContent, setYamlContent] = useState<string>('');
  
  // Modal & User custom YAML files state
  const [showAddCustomFileModal, setShowAddCustomFileModal] = useState<boolean>(false);
  const [newCustomFileName, setNewCustomFileName] = useState<string>('my-custom-values.yaml');
  const [userCustomFiles, setUserCustomFiles] = useState<Array<{ name: string; path: string; content: string }>>([]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [helmChartNameInput, setHelmChartNameInput] = useState<string>(initialChart.chart_name);
  const [helmChartVersionInput, setHelmChartVersionInput] = useState<string>(initialChart.default_version);
  const [helmActionStatus, setHelmActionStatus] = useState<string>('');
  const [isExecutingHelmAction, setIsExecutingHelmAction] = useState<boolean>(false);

  // CRD Manifest content for Operator Service (Mode 2) - starts completely blank
  const [crdManifestContent, setCrdManifestContent] = useState<string>('');
  const [showSavedChartsModal, setShowSavedChartsModal] = useState<boolean>(false);

  const [isDeploying, setIsDeploying] = useState(false);
  const [clustersList, setClustersList] = useState<K8sCluster[]>(MOCK_CLUSTERS);

  // Close chart search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(e.target as Node)) {
        setIsChartDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    apiClient.getUserClusters(1).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setClustersList([...fetched, ...MOCK_CLUSTERS.filter((m) => !fetched.some((f) => f.id === m.id))]);
      }
    }).catch((e) => {
      console.warn('Failed to load user clusters for wizard:', e);
    });
  }, []);

  // Filtered charts in the catalog
  const filteredCharts = DATABASE_CHARTS_CATALOG.filter((c) => {
    if (!chartSearchQuery.trim()) return true;
    const q = chartSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.chart_name.toLowerCase().includes(q) ||
      c.publisher.toLowerCase().includes(q) ||
      c.engine_type.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSelectChart = (chart: DatabaseChartOption) => {
    setSelectedChartOption(chart);
    const foundEngine = CATALOG_ITEMS.find((item) => item.engine_type === chart.engine_type);
    if (foundEngine) {
      setSelectedEngine(foundEngine);
      setSelectedVersion(chart.app_version || foundEngine.versions[0]);
    }
    setHelmChartNameInput(chart.chart_name);
    setHelmChartVersionInput(chart.default_version);
    setIsChartInstalled(false);
    setIsChartLoaded(false);
    setYamlContent('');
    setIsChartDropdownOpen(false);
  };

  const handleCreateCustomFile = () => {
    let cleanName = newCustomFileName.trim();
    if (!cleanName) return;
    if (!cleanName.endsWith('.yaml') && !cleanName.endsWith('.yml')) {
      cleanName = `${cleanName}.yaml`;
    }

    const initialContent = `# ${cleanName} — Custom Helm Configuration Overrides\n# Type or paste your custom YAML values below:\n\n`;
    const newFileObj = {
      name: cleanName,
      path: cleanName,
      content: initialContent
    };

    setUserCustomFiles((prev) => [...prev, newFileObj]);
    setSelectedHelmFile(cleanName);
    setYamlContent(initialContent);
    setShowAddCustomFileModal(false);
    setNewCustomFileName('');
  };

  const handleSelectHelmFile = async (filePath: string) => {
    setSelectedHelmFile(filePath);
    try {
      const realContent = await apiClient.getHelmFile(dbName, filePath);
      if (realContent) {
        setYamlContent(realContent);
        return;
      }
    } catch (err) {
      console.warn('Backend file not found, falling back to local template:', err);
    }

    const chartFiles = HELM_CHART_FILES[selectedEngine.engine_type] || HELM_CHART_FILES['postgresql'];
    const allFiles = [...chartFiles, ...userCustomFiles];
    const found = allFiles.find((f) => f.path === filePath);
    if (found) {
      setYamlContent(found.content);
    }
  };

  const handleSaveChart = async () => {
    try {
      await apiClient.saveHelmFile(dbName, selectedHelmFile || 'values.yaml', yamlContent);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      setHelmActionStatus(`⚠️ Save error: ${err.message || 'Failed to save file'}`);
      setTimeout(() => setHelmActionStatus(''), 5000);
    }
  };

  const handleExecuteHelmAction = async (action: 'install' | 'upgrade') => {
    setIsExecutingHelmAction(true);
    setHelmActionStatus(`Executing 'helm ${action} ${dbName} ${helmChartNameInput}'...`);
    try {
      if (action === 'install') {
        const fullChart = helmChartNameInput.trim() || selectedChartOption.chart_name;
        const chartParts = fullChart.split('/');
        const repoName = chartParts.length > 1 ? chartParts[0] : 'bitnami';
        const chartName = chartParts.length > 1 ? chartParts[1] : chartParts[0];

        await apiClient.pullHelmChart({
          chart_repo_url: selectedChartOption.chart_repo_url || `https://charts.bitnami.com/${repoName}`,
          chart_name: chartName,
          chart_version: helmChartVersionInput.trim() || '15.5.2',
          release_name: dbName
        });

        setIsChartLoaded(true);
        setIsChartInstalled(true);
        const targetFile = selectedHelmFile || 'values.yaml';
        setSelectedHelmFile(targetFile);

        try {
          const fetchedContent = await apiClient.getHelmFile(dbName, targetFile);
          if (fetchedContent) {
            setYamlContent(fetchedContent);
          }
        } catch (e) {
          console.warn('Could not auto-fetch pulled chart file:', e);
        }
      } else {
        const targetFile = selectedHelmFile || 'values.yaml';
        if (yamlContent && yamlContent.trim()) {
          try {
            await apiClient.saveHelmFile(dbName, targetFile, yamlContent);
          } catch (e) {
            console.warn('Failed to save file before helm apply:', e);
          }
        }
        const curCluster = clustersList.find((cls) => cls.name === selectedCluster || cls.id === selectedCluster);
        await apiClient.applyHelmRelease({
          cluster_name: selectedCluster || 'default-prod',
          release_name: dbName,
          chart_name: selectedEngine.engine_type,
          api_server_url: curCluster?.api_url,
          ca_cert_data: curCluster?.ca_cert_data,
          token: curCluster?.token,
          user_name: curCluster?.user_name,
          namespace: 'databases',
          target_values_file: targetFile
        });
      }
      setHelmActionStatus(
        `✓ Successfully executed 'helm ${action} ${dbName}' on cluster ${selectedCluster || 'default'}`
      );
    } catch (err: any) {
      setHelmActionStatus(`⚠️ Helm action error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsExecutingHelmAction(false);
      setTimeout(() => setHelmActionStatus(''), 7000);
    }
  };

  // Filter clusters based on selected Cloud Provider
  const availableClusters = selectedProvider
    ? clustersList.filter((cls) => {
        const prov = cls.provider.toLowerCase();
        if (selectedProvider === 'aws') return prov.includes('aws') || prov.includes('eks');
        if (selectedProvider === 'gcp') return prov.includes('gcp') || prov.includes('gke');
        if (selectedProvider === 'azure') return prov.includes('azure') || prov.includes('aks');
        if (selectedProvider === 'digitalocean') return prov.includes('digitalocean') || prov.includes('doks');
        if (selectedProvider === 'onprem') return prov.includes('on-premise');
        return true;
      })
    : [];

  const handleProviderChange = (prov: string) => {
    setSelectedProvider(prov);
    setSelectedCluster('');
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployErrorMsg(null);
    setHelmActionStatus('');
    try {
      let cpuM = (parseInt(customCpu, 10) || 2) * 1000;
      let ramMb = (parseInt(customRam, 10) || 8) * 1024;
      let storageGb = parseInt(customDisk, 10) || 50;

      const targetClusterName = selectedCluster || (clustersList[0]?.name ?? 'onprem-prod-k8s');

      if (installMode === 'crd') {
        await apiClient.applyOperatorManifest({
          cluster_name: targetClusterName,
          resource_name: dbName,
          target_namespace: 'databases',
          content: crdManifestContent
        });
      } else {
        // Save the YAML content to the target file on the backend first
        const targetFile = selectedHelmFile || 'values.yaml';
        try {
          if (yamlContent && yamlContent.trim()) {
            await apiClient.saveHelmFile(dbName, targetFile, yamlContent);
          }
        } catch (saveErr) {
          console.warn('Auto-save YAML before deploy warning:', saveErr);
        }

        const curCluster = clustersList.find((cls) => cls.name === targetClusterName || cls.id === targetClusterName);
        await apiClient.applyHelmRelease({
          cluster_name: targetClusterName,
          release_name: dbName,
          chart_name: selectedEngine.engine_type,
          api_server_url: curCluster?.api_url,
          ca_cert_data: curCluster?.ca_cert_data,
          token: curCluster?.token,
          user_name: curCluster?.user_name,
          namespace: 'databases',
          target_values_file: targetFile,
          chart_content: yamlContent
        });
      }

      await apiClient.deployDatabase({
        name: dbName,
        engine_type: selectedEngine.engine_type,
        version: selectedVersion,
        cluster_name: targetClusterName,
        namespace: 'databases',
        cpu_usage_m: cpuM,
        memory_usage_mb: ramMb,
        storage_gb: storageGb,
        monthly_cost: (cpuM / 1000) * 15.0 + (ramMb / 1024) * 4.0 + storageGb * 0.15,
        values_yaml: installMode === 'crd' ? crdManifestContent : yamlContent,
        deployment_type: installMode === 'crd' ? 'crd' : 'helm'
      });

      onSuccess();
    } catch (err: any) {
      const errMsg = err?.message || 'Error occurred during provisioning deployment';
      setDeployErrorMsg(errMsg);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-100">
      {/* Header Card with Gradient Glassmorphism */}
      <div className="bg-gradient-to-br from-[#0e1726]/95 via-[#0b1120]/95 to-[#070d18]/95 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-brand-sky" />
              Create New Database Instance
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select engine parameters and preferred installation mode (Helm values.yaml or K8s Operator CRD)
            </p>
          </div>

          {/* Saved Charts Button */}
          <button
            type="button"
            onClick={() => setShowSavedChartsModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-brand-sky/50 text-xs font-bold transition-all shadow-md flex items-center gap-2 group cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Saved Charts</span>
          </button>
        </div>

        {/* TWO INSTALLATION MODE BUTTONS: Helm Chart (Blue) vs Operator CRD (Sky-Blue) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* MODE 1: YAML Editor (Helm Chart) - Deep Blue Theme */}
          <button
            type="button"
            onClick={() => setInstallMode('helm')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 group cursor-pointer ${
              installMode === 'helm'
                ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/40 text-white shadow-lg shadow-blue-900/30 hover:bg-blue-900/80 hover:border-blue-400 hover:shadow-blue-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-blue-950/50 hover:border-blue-500/60 hover:text-blue-100 hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all ${
              installMode === 'helm'
                ? 'bg-blue-600/30 text-blue-300 group-hover:bg-blue-600/50 group-hover:text-white'
                : 'bg-slate-800/60 text-slate-400 group-hover:bg-blue-600/30 group-hover:text-blue-300'
            }`}>
              <FileCode2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className={`font-bold text-sm block transition-colors ${
                installMode === 'helm' ? 'text-white group-hover:text-blue-200' : 'text-slate-300 group-hover:text-blue-300'
              }`}>
                1. YAML Editor (Helm Chart)
              </span>
              <span className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal block mt-0.5">
                Direct editing of `values.yaml` and option to add custom configuration files.
              </span>
            </div>
          </button>

          {/* MODE 2: K8s Custom Resource (Operator Service CRD) - Sky Blue Theme */}
          <button
            type="button"
            onClick={() => setInstallMode('crd')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 group cursor-pointer ${
              installMode === 'crd'
                ? 'bg-sky-950/70 border-sky-400 ring-2 ring-sky-400/40 text-white shadow-lg shadow-sky-900/30 hover:bg-sky-900/80 hover:border-sky-300 hover:shadow-sky-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-sky-950/50 hover:border-sky-400/60 hover:text-sky-100 hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all ${
              installMode === 'crd'
                ? 'bg-sky-600/30 text-sky-300 group-hover:bg-sky-600/50 group-hover:text-white'
                : 'bg-slate-800/60 text-slate-400 group-hover:bg-sky-600/30 group-hover:text-sky-300'
            }`}>
              <Boxes className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className={`font-bold text-sm block transition-colors ${
                installMode === 'crd' ? 'text-white group-hover:text-sky-200' : 'text-slate-300 group-hover:text-sky-300'
              }`}>
                2. Custom Resource (CRD)
              </span>
              <span className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal block mt-0.5">
                Kubernetes Operator CRD Manifest (CloudNativePG / KubeDB via operator-service).
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* Main Configuration Form Container */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* ======================================================== */}
        {/* STEP 1: INITIAL MANDATORY FIELDS FOR MODES 1 & 2 */}
        {/* ======================================================== */}
        {installMode !== 'crd' && (
          <div className="space-y-6">
            <div className="border-b border-accent-darkBorder pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-sky flex items-center gap-2">
                  <Database className="w-4 h-4" /> Deploy Management Catalog
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Specify instance ID, database engine / operator chart, cloud provider, and target cluster</p>
              </div>

              {/* Engine Version Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Engine Version:</span>
                {selectedEngine.versions.map((ver) => (
                  <button
                    key={ver}
                    onClick={() => setSelectedVersion(ver)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedVersion === ver
                        ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                        : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover hover:text-white'
                    }`}
                  >
                    v{ver}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* FIELD 1: Database Name (Release name) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Database Instance Name (Release name)
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g., my-app-db"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1.5 block leading-relaxed">
                  Changing the instance name deploys a new unique Helm release with its own isolated configuration and resources.
                </span>
              </div>

              {/* FIELD 2: ARTIFACTHUB / CHARTS SEARCH & SELECT COMBOBOX */}
              <div ref={chartDropdownRef} className="relative">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Database Engine & Chart</span>
                  <span className="text-[10px] text-brand-sky font-mono font-normal">ArtifactHub Catalog</span>
                </label>

                {/* Selected Chart Display / Search Trigger */}
                <div
                  onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                  className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/60 text-white text-sm rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-all shadow-inner"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={selectedChartOption.icon_url}
                      alt={selectedChartOption.name}
                      className="w-5 h-5 object-contain rounded shrink-0 bg-slate-900 p-0.5"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="truncate text-xs font-semibold">
                      <span className="text-white font-bold block truncate">{selectedChartOption.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedChartOption.chart_name}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isChartDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Search Dropdown Popover */}
                {isChartDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-brand-sky/40 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50 space-y-2.5 max-h-[380px] overflow-y-auto animate-fadeIn">
                    {/* Search Input */}
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-brand-sky absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        autoFocus
                        value={chartSearchQuery}
                        onChange={(e) => setChartSearchQuery(e.target.value)}
                        placeholder="Search chart by name (CloudNativePG, Bitnami, Redis, Altinity)..."
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-brand-sky"
                      />
                    </div>

                    {/* Charts List */}
                    <div className="space-y-1.5">
                      {filteredCharts.map((chart) => {
                        const isSelected = selectedChartOption.id === chart.id;
                        return (
                          <div
                            key={chart.id}
                            onClick={() => handleSelectChart(chart)}
                            className={`p-2 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-brand-blue/30 border border-brand-sky/50 text-white'
                                : 'hover:bg-slate-900 border border-transparent text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={chart.icon_url}
                                alt={chart.name}
                                className="w-5 h-5 object-contain rounded shrink-0 bg-slate-900 p-0.5"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="truncate">
                                <span className="font-bold text-xs text-white block truncate">{chart.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  {chart.publisher} • {chart.chart_name}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-sky shrink-0 mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AUTOMATIC HELM CHART MAPPING DISPLAY */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand-sky font-mono bg-brand-blue/10 px-2.5 py-1 rounded-lg border border-brand-sky/20">
                  <PackageCheck className="w-3.5 h-3.5 shrink-0 text-brand-sky" />
                  <span className="truncate">
                    Chart: <strong>{selectedChartOption.chart_name}</strong>
                  </span>
                </div>
              </div>

              {/* FIELD 3: Cluster Selection (Cascading Dependent Selects) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Cloud Provider / Environment
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  >
                    <option value="">-- Select Cloud Provider --</option>
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="onprem">On-Premise</option>
                  </select>
                </div>

                {/* Target Cluster (Activated only after provider selected) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Kubernetes Cluster
                  </label>
                  <select
                    disabled={!selectedProvider}
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    className={`w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all font-semibold border ${
                      !selectedProvider
                        ? 'bg-bg-main/50 text-slate-600 border-accent-darkBorder/40 cursor-not-allowed'
                        : 'bg-bg-main border-accent-darkBorder text-white focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky'
                    }`}
                  >
                    <option value="">
                      {!selectedProvider ? '⚠️ First select a Cloud Provider' : '-- Select Target Cluster --'}
                    </option>
                    {availableClusters.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} ({cls.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* DATABASE SECURITY & CREDENTIALS CARD */}
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md mt-6">
              <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-sky" /> Database Security & Credentials Setup
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Automatically injected during DB initialization
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Password Mode Toggle Buttons */}
                <div className="lg:col-span-5 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Password Generation Mode <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode('auto');
                        if (!dbPassword) {
                          setDbPassword(generateRandomPassword());
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        passwordMode === 'auto'
                          ? 'bg-brand-blue/20 text-brand-sky border-brand-sky ring-1 ring-brand-sky/30'
                          : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Auto-Generated
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode('custom');
                        setDbPassword('');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        passwordMode === 'custom'
                          ? 'bg-brand-blue/20 text-brand-sky border-brand-sky ring-1 ring-brand-sky/30'
                          : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> Custom Password
                    </button>
                  </div>
                </div>

                {/* Password Input & Generation Controls */}
                <div className="lg:col-span-7 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Database Admin Password <span className="text-rose-400">*</span>
                    </label>
                    {passwordMode === 'auto' && (
                      <button
                        type="button"
                        onClick={() => setDbPassword(generateRandomPassword())}
                        className="text-[11px] text-brand-sky font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-generate Random
                      </button>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      placeholder="Enter database admin password..."
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky font-semibold selection:bg-brand-sky/50 selection:text-white"
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {!dbPassword && (
                    <span className="text-[10px] text-rose-400 font-semibold block pt-1">
                      ⚠️ Password is required before deploying database
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: HELM CHART YAML EDITOR */}
        {/* ======================================================== */}
        {installMode === 'helm' && (
          <div className="space-y-5 pt-4 border-t border-accent-darkBorder">
            
            {/* HELM CHART NAME INPUT & INSTALL / UPGRADE BUTTONS TOOLBAR */}
            <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                {/* Inputs for Specific Helm Chart Name & Version */}
                <div className="flex-1 w-full space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-brand-sky" /> Target Helm Chart Repository & Name
                    </label>
                    <input
                      type="text"
                      value={helmChartNameInput}
                      onChange={(e) => setHelmChartNameInput(e.target.value)}
                      placeholder="e.g., bitnami/postgresql or oci://registry-1.docker.io/bitnamicharts/postgresql"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-sky" /> Chart Version
                    </label>
                    <input
                      type="text"
                      value={helmChartVersionInput}
                      onChange={(e) => {
                        setHelmChartVersionInput(e.target.value);
                        setIsChartInstalled(false);
                      }}
                      placeholder="e.g., 15.5.2"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                    />
                  </div>
                </div>

                {/* Install Chart Action Button */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0 relative group">
                  {isChartInstalled ? (
                    <button
                      onClick={() => handleExecuteHelmAction('install')}
                      disabled={isExecutingHelmAction}
                      title="Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes."
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isExecutingHelmAction ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white fill-emerald-600" />
                      )}
                      <span>{isExecutingHelmAction ? 'Installing...' : 'Chart Installed'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExecuteHelmAction('install')}
                      disabled={isExecutingHelmAction}
                      title="Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes."
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-brand-blue/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isExecutingHelmAction ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Download className="w-3.5 h-3.5 fill-white" />
                      )}
                      <span>{isExecutingHelmAction ? 'Installing Chart...' : 'Install Chart'}</span>
                    </button>
                  )}

                  {/* Hover Tooltip Warning */}
                  <div className="absolute right-0 bottom-full mb-2.5 hidden group-hover:block w-72 p-2.5 bg-slate-900/95 border border-amber-500/40 text-slate-200 text-[11px] rounded-xl shadow-2xl backdrop-blur-md z-30 pointer-events-none transition-all animate-fadeIn leading-relaxed">
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <span>⚠️ Overwrite Warning</span>
                    </div>
                    Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes.
                  </div>
                </div>
              </div>

              {/* Notification status for Helm actions */}
              {helmActionStatus && (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
                  <span>{helmActionStatus}</span>
                  <span className="text-[10px] text-slate-400">Target cluster: {selectedCluster || 'default'}</span>
                </div>
              )}
            </div>

            {/* DYNAMICALLY REVEALED HELM CHART EDITOR & TERMINAL ONLY AFTER INSTALL CHART */}
            {isChartInstalled && (
              <div className="space-y-4 animate-fadeIn pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-brand-sky" />
                    Helm Chart Editor ({selectedHelmFile || 'values.yaml'})
                  </label>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* SELECT FILE FROM HELM CHART DROPDOWN */}
                    <div className="flex items-center gap-1.5 bg-bg-main border border-accent-darkBorder rounded-lg px-2.5 py-1">
                      <FolderTree className="w-3.5 h-3.5 text-brand-sky" />
                      <select
                        value={selectedHelmFile || 'values.yaml'}
                        onChange={(e) => handleSelectHelmFile(e.target.value)}
                        className="bg-transparent text-slate-200 text-xs font-mono font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="values.yaml" className="bg-bg-card text-brand-sky font-bold">
                          📄 values.yaml
                        </option>
                        {userCustomFiles.map((file) => (
                          <option key={file.path} value={file.path} className="bg-bg-card text-emerald-400 font-bold">
                            ⚡ {file.name} (Custom)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ADD CUSTOM FILE BUTTON & SAVE / UPGRADE ACTIONS */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button 
                        onClick={() => setShowAddCustomFileModal(true)}
                        className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <FilePlus className="w-3.5 h-3.5" /> Add Custom File
                      </button>

                      <button 
                        onClick={handleSaveChart}
                        className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-md"
                      >
                        <Save className="w-3.5 h-3.5 text-emerald-400" /> Save Chart
                      </button>

                      <button
                        onClick={() => handleExecuteHelmAction('upgrade')}
                        disabled={isExecutingHelmAction}
                        className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isExecutingHelmAction ? 'animate-spin' : ''}`} /> Upgrade Chart
                      </button>

                      {saveSuccessMsg && (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1 animate-pulse font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Chart saved!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <YamlCodeEditor
                  value={yamlContent}
                  onChange={setYamlContent}
                  placeholder="Type or edit YAML configuration values here..."
                  minHeight="280px"
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: KUBERNETES CUSTOM RESOURCE (OPERATOR SERVICE CRD) */}
        {/* ======================================================== */}
        {installMode === 'crd' && (
          <div className="space-y-6 pt-4 border-t border-accent-darkBorder">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand-sky" /> 2. Kubernetes Custom Resource Deployment (Operator Service)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste your ready Custom Resource manifest (Operator CRD, CloudNativePG, KubeDB, Altinity, etc.) to deploy directly via operator-service
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                ● Operator Service API Ready
              </span>
            </div>

            {/* RESOURCE NAME, NAMESPACE & CASCADING CLUSTER SELECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource Name */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    required
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="e.g., my-custom-operator-cr"
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Custom Resource metadata.name</span>
                </div>
              </div>

              {/* Cloud Provider & Target Cluster (Cascading Dependent Selects) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Cloud Provider / Environment
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  >
                    <option value="">-- Select Cloud Provider --</option>
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="onprem">On-Premise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Kubernetes Cluster
                  </label>
                  <select
                    disabled={!selectedProvider}
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    className={`w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all font-semibold border ${
                      !selectedProvider
                        ? 'bg-bg-main/50 text-slate-600 border-accent-darkBorder/40 cursor-not-allowed'
                        : 'bg-bg-main border-accent-darkBorder text-white focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky'
                    }`}
                  >
                    <option value="">
                      {!selectedProvider ? '⚠️ First select a Cloud Provider' : '-- Select Target Cluster --'}
                    </option>
                    {availableClusters.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} ({cls.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* MANIFEST EDITOR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Custom Resource Manifest (YAML)
              </label>
              <YamlCodeEditor
                value={crdManifestContent}
                onChange={setCrdManifestContent}
                placeholder=""
                minHeight="320px"
              />
            </div>
          </div>
        )}

        {/* Deploy Error Message Banner */}
        {deployErrorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div>
              <strong className="block text-rose-300 font-bold mb-0.5">Deployment Failure:</strong>
              <span className="leading-relaxed">{deployErrorMsg}</span>
            </div>
            <button onClick={() => setDeployErrorMsg(null)} className="text-rose-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Deploy Action Bar */}
        <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {installMode === 'crd'
                ? `CRD manifest targeted for operator-service on ${selectedCluster || 'cluster'}`
                : `Deployment payload validated for cluster ${selectedCluster || 'target'}`}
            </span>
          </div>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
          >
            {isDeploying ? (
              <span>Deploying {installMode === 'crd' ? 'Operator Service' : 'Helm Deployer'}...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Deploy {installMode === 'crd' ? 'Operator CRD' : 'Helm Chart'}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 📄 ADD CUSTOM YAML FILE MODAL OVERLAY */}
      {/* ======================================================== */}
      {showAddCustomFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-sky/30 flex items-center justify-center">
                  <FilePlus className="w-5 h-5 text-brand-sky" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Custom YAML File</h3>
                  <p className="text-[11px] text-slate-400">Create a new empty YAML configuration file</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomFileModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-bg-main transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                YAML File Name
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={newCustomFileName}
                  onChange={(e) => setNewCustomFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCustomFile();
                  }}
                  placeholder="e.g. my-custom-values.yaml"
                  className="w-full bg-bg-main border border-accent-darkBorder rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-brand-sky transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                A blank code terminal editor will open immediately for this file once created.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-accent-darkBorder pt-4">
              <button
                type="button"
                onClick={() => setShowAddCustomFileModal(false)}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomFile}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-1.5 transition-all"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Create & Open Editor</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 🔖 SAVED CHARTS MODAL */}
      {/* ======================================================== */}
      {showSavedChartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Saved Chart Templates</h3>
                  <p className="text-[11px] text-slate-400">Pre-configured database packages and saved configuration templates</p>
                </div>
              </div>
              <button
                onClick={() => setShowSavedChartsModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-bg-main transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {DATABASE_CHARTS_CATALOG.map((chart) => (
                <div
                  key={chart.chart_name}
                  onClick={() => {
                    setSelectedChartOption(chart);
                    setShowSavedChartsModal(false);
                  }}
                  className="p-3.5 bg-bg-main border border-accent-darkBorder hover:border-brand-sky/60 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={chart.icon_url}
                      alt={chart.name}
                      className="w-7 h-7 object-contain rounded bg-slate-900 p-1 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-brand-sky transition-colors truncate">
                          {chart.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky font-semibold border border-brand-sky/30 shrink-0">
                          {chart.engine_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {chart.chart_name} • v{chart.default_version}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 group-hover:text-brand-sky flex items-center gap-1 shrink-0 transition-colors">
                    Load Chart →
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end border-t border-accent-darkBorder pt-3">
              <button
                type="button"
                onClick={() => setShowSavedChartsModal(false)}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
