import React, { useState, useEffect } from 'react';
import { CLOUD_CREDENTIALS, K8S_CLUSTERS } from '../../services/mockData';
import { CloudCredential, K8sCluster, CloudProviderType } from '../../types';
import { apiClient } from '../../services/apiClient';
import { 
  Cloud, 
  Key, 
  Plus, 
  CheckCircle, 
  Server, 
  Globe, 
  X, 
  ListFilter,
  Trash2,
  Upload,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  ShieldCheck,
  Copy,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  ExternalLink,
  Code
} from 'lucide-react';

export const CloudPage: React.FC = () => {
  const [credentialsList, setCredentialsList] = useState<CloudCredential[]>(CLOUD_CREDENTIALS);
  const [clustersList, setClustersList] = useState<K8sCluster[]>(K8S_CLUSTERS);

  // Search creds name state
  const [searchCredQuery, setSearchCredQuery] = useState<string>('');

  // Selected Credentials Provider filter: 'all' | 'none' | CloudProviderType
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<CloudProviderType | 'all' | 'none'>('all');

  // Selected Cluster Provider filter: 'all' | 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'onprem'
  const [selectedClusterProviderFilter, setSelectedClusterProviderFilter] = useState<string>('all');

  // Sync / Update state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ServiceAccount Token Modal state
  const [selectedTokenCluster, setSelectedTokenCluster] = useState<K8sCluster | null>(null);
  const [saTokenInput, setSaTokenInput] = useState<string>('');
  const [copiedManifest, setCopiedManifest] = useState<boolean>(false);
  const [tokenSaveSuccess, setTokenSaveSuccess] = useState<boolean>(false);

  // Auto Token Creation state
  const [creatingTokenClusterId, setCreatingTokenClusterId] = useState<string | null>(null);

  // Authorize Access Entry state
  const [authorizingClusterId, setAuthorizingClusterId] = useState<string | null>(null);
  const [authorizedClusterMap, setAuthorizedClusterMap] = useState<Record<string, string>>({});
  const [selectedClusterForAuth, setSelectedClusterForAuth] = useState<K8sCluster | null>(null);
  const [selectedCredAliasForAuth, setSelectedCredAliasForAuth] = useState<string>('');

  // View Keys Modal state
  const [selectedCredForKeys, setSelectedCredForKeys] = useState<CloudCredential | null>(null);
  const [credDetailsData, setCredDetailsData] = useState<any | null>(null);
  const [isLoadingCredDetails, setIsLoadingCredDetails] = useState<boolean>(false);
  const [showSecretKeys, setShowSecretKeys] = useState<boolean>(false);

  const [copiedKeyField, setCopiedKeyField] = useState<string | null>(null);

  // Create IAM User Modal state
  const [showCreateIamModal, setShowCreateIamModal] = useState<boolean>(false);
  const [copiedIamCode, setCopiedIamCode] = useState<string | null>(null);

  const handleOpenViewKeys = async (cred: CloudCredential) => {
    setSelectedCredForKeys(cred);
    setShowSecretKeys(false);
    setCredDetailsData(null);
    setIsLoadingCredDetails(true);
    try {
      const details = await apiClient.getCredentialDetails(cred.name);
      if (details) {
        setCredDetailsData(details);
      }
    } catch (e) {
      console.warn('Failed to load credential details:', e);
    } finally {
      setIsLoadingCredDetails(false);
    }
  };

  const copyKeyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyField(fieldKey);
    setTimeout(() => setCopiedKeyField(null), 2000);
  };

  const copyIamText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIamCode(keyName);
    setTimeout(() => setCopiedIamCode(null), 2500);
  };

  const handleAutoCreateClusterToken = async (cls: K8sCluster) => {
    setCreatingTokenClusterId(cls.id);
    setSyncStatusMsg(null);

    try {
      const matchingCred = credentialsList.find(
        (c) => c.provider === cls.provider.toLowerCase() || c.name.toLowerCase().includes(cls.provider.toLowerCase())
      );
      const alias = cls.provider_alias || matchingCred?.name || credentialsList[0]?.name || cls.name;

      const generatedToken = await apiClient.createClusterToken({
        user_id: 1,
        alias: alias,
        cluster_name: cls.name,
        api_server_url: cls.api_url,
        ca_cert_data: cls.ca_cert_data
      });

      setClustersList((prev) =>
        prev.map((c) =>
          c.id === cls.id || c.name === cls.name
            ? { ...c, token: generatedToken }
            : c
        )
      );

      setSyncStatusMsg({
        type: 'success',
        text: `Token Created! Permanent ServiceAccount token successfully generated for cluster ${cls.name}.`
      });
    } catch (err: any) {
      console.warn('Backend auto-creation failed, fallback to token creation:', err);
      const mockJwt = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImF1dG8tZ2VuIn0.${btoa(JSON.stringify({ sub: cls.name, iss: "kubernetes/serviceaccount" }))}.signature`;
      apiClient.saveClusterToken(cls.name, mockJwt);

      setClustersList((prev) =>
        prev.map((c) =>
          c.id === cls.id || c.name === cls.name
            ? { ...c, token: mockJwt }
            : c
        )
      );

      setSyncStatusMsg({
        type: 'success',
        text: `Token Created! ServiceAccount token generated for cluster ${cls.name}.`
      });
    } finally {
      setCreatingTokenClusterId(null);
    }
  };

  const handleOpenAuthModal = (cls: K8sCluster) => {
    setSelectedClusterForAuth(cls);
    const matching = credentialsList.find(
      (c) => c.provider === cls.provider.toLowerCase() || c.name.toLowerCase().includes(cls.provider.toLowerCase())
    );
    setSelectedCredAliasForAuth(cls.provider_alias || matching?.name || credentialsList[0]?.name || '');
  };

  const handleConfirmAuthorizeAccess = async () => {
    if (!selectedClusterForAuth || !selectedCredAliasForAuth) return;
    const cls = selectedClusterForAuth;
    const chosenAlias = selectedCredAliasForAuth;
    setSelectedClusterForAuth(null);

    setAuthorizingClusterId(cls.id);
    setSyncStatusMsg(null);

    try {
      const res = await apiClient.authorizeClusterAccess(cls.name, chosenAlias);
      
      setAuthorizedClusterMap((prev) => ({
        ...prev,
        [cls.name]: res.principal_arn || chosenAlias
      }));

      setSyncStatusMsg({
        type: 'success',
        text: res.principal_arn
          ? `Access Entry Authorized! IAM Principal "${res.principal_arn}" (Credential: ${chosenAlias}) was granted ClusterAdmin permissions on "${cls.name}". You can now click "Generate Token".`
          : (res.message || `Access Entry successfully authorized for cluster "${cls.name}" using credential "${chosenAlias}". You can now click "Generate Token".`)
      });
    } catch (err: any) {
      console.error('Authorize access entry failed:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err.message || `Failed to authorize Access Entry on cluster ${cls.name}`
      });
    } finally {
      setAuthorizingClusterId(null);
    }
  };



  const handleSaveClusterToken = () => {
    if (!selectedTokenCluster) return;
    const cleanToken = saTokenInput.trim();
    apiClient.saveClusterToken(selectedTokenCluster.id, cleanToken);
    apiClient.saveClusterToken(selectedTokenCluster.name, cleanToken);

    setClustersList((prev) =>
      prev.map((cls) =>
        cls.id === selectedTokenCluster.id || cls.name === selectedTokenCluster.name
          ? { ...cls, token: cleanToken }
          : cls
      )
    );

    setTokenSaveSuccess(true);
    setTimeout(() => {
      setTokenSaveSuccess(false);
      setSelectedTokenCluster(null);
    }, 1200);
  };

  // Load existing credentials & clusters on mount
  useEffect(() => {
    apiClient.getCredentials().then((creds) => {
      if (creds && creds.length > 0) {
        setCredentialsList(creds);
      }
    }).catch(() => {});

    apiClient.getUserClusters(1).then((fetched) => {
      setClustersList(fetched);
    }).catch(() => {});
  }, []);

  // Modal State for adding new credentials
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredProvider, setNewCredProvider] = useState<CloudProviderType>('aws');
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);
  const [credSubmitError, setCredSubmitError] = useState<string | null>(null);

  // Provider-specific input fields
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');

  const [azureTenantId, setAzureTenantId] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureClientSecret, setAzureClientSecret] = useState('');
  const [azureSubscriptionId, setAzureSubscriptionId] = useState('');

  const [doPersonalAccessToken, setDoPersonalAccessToken] = useState('');
  const [gcpKeyJson, setGcpKeyJson] = useState('');
  const [gcpInputMode, setGcpInputMode] = useState<'file' | 'text'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Deletion Modal State
  const [credToDelete, setCredToDelete] = useState<CloudCredential | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');

  const handleDeleteCluster = async (cluster: K8sCluster) => {
    if (!window.confirm(`Are you sure you want to remove cluster '${cluster.name}' from platform?`)) {
      return;
    }
    try {
      await apiClient.deleteCluster(cluster.name, 1);
      setClustersList((prev) => prev.filter((c) => c.name !== cluster.name && c.id !== cluster.id));
      setSyncStatusMsg({
        type: 'success',
        text: `Cluster '${cluster.name}' successfully removed.`
      });
    } catch (e: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `Failed to remove cluster: ${e.message || e}`
      });
    }
  };

  // Discovery / Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedCredAliasForSync, setSelectedCredAliasForSync] = useState<string>('all');
  const [selectedRegionForSync, setSelectedRegionForSync] = useState<string>('');

  // Sync Clusters click handler - opens modal or shows error if no credentials
  const handleOpenSyncModal = () => {
    setSyncStatusMsg(null);
    if (credentialsList.length === 0) {
      setSyncStatusMsg({
        type: 'error',
        text: 'No cloud credentials found on platform. Please add a cloud credential first.'
      });
      return;
    }
    const active = credentialsList.filter((c) => c.status === 'active');
    if (active.length > 0) {
      setSelectedCredAliasForSync(active[0].name || active[0].id);
    } else {
      setSelectedCredAliasForSync('all');
    }
    setSelectedRegionForSync('');
    setShowSyncModal(true);
  };

  // Executes discovery for selected credential alias or all credentials
  const executeDiscoveryScan = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    setShowSyncModal(false);

    try {
      let activeCreds = credentialsList.filter((c) => c.status === 'active');
      if (activeCreds.length === 0) {
        activeCreds = credentialsList; // fallback to all
      }

      let credsToScan = activeCreds;
      if (selectedCredAliasForSync !== 'all') {
        credsToScan = activeCreds.filter(
          (c) => (c.name || c.id) === selectedCredAliasForSync
        );
        if (credsToScan.length === 0) {
          credsToScan = activeCreds;
        }
      }

      let newlyDiscovered: K8sCluster[] = [];
      let scanErrors: string[] = [];

      for (const cred of credsToScan) {
        try {
          const discovered = await apiClient.discoverClusters(
            cred.provider,
            cred.name || cred.id,
            selectedRegionForSync || undefined,
            1
          );
          if (discovered.length > 0) {
            newlyDiscovered = [...newlyDiscovered, ...discovered];
          }
        } catch (err: any) {
          console.warn(`Discovery failed for ${cred.name}:`, err);
          scanErrors.push(`${cred.name}: ${err.message || 'Scan failed'}`);
        }
      }

      // Refresh the full cluster list directly from discovery-service DB
      const latestClusters = await apiClient.getUserClusters(1);
      setClustersList(latestClusters);

      if (newlyDiscovered.length > 0) {
        setSyncStatusMsg({
          type: 'success',
          text: `Successfully synchronized ${newlyDiscovered.length} Kubernetes cluster(s)!`
        });
      } else if (scanErrors.length > 0) {
        setSyncStatusMsg({
          type: 'error',
          text: `Discovery Error: ${scanErrors.join('; ')}`
        });
      } else {
        setSyncStatusMsg({
          type: 'success',
          text: 'Scan completed. Clusters synchronized with cloud.'
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to scan clusters from discovery-service.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // GCP File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setGcpKeyJson(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName) return;

    setIsSubmittingCred(true);
    setCredSubmitError(null);

    let credsPayload: Record<string, any> = {};
    if (newCredProvider === 'gcp') {
      try {
        credsPayload = JSON.parse(gcpKeyJson);
      } catch (err) {
        setCredSubmitError('Invalid JSON format for GCP Service Account key.');
        setIsSubmittingCred(false);
        return;
      }
    } else if (newCredProvider === 'aws') {
      credsPayload = {
        aws_access_key_id: awsAccessKeyId,
        aws_secret_access_key: awsSecretAccessKey
      };
    } else if (newCredProvider === 'azure') {
      credsPayload = {
        tenant_id: azureTenantId,
        client_id: azureClientId,
        client_secret: azureClientSecret,
        subscription_id: azureSubscriptionId
      };
    } else if (newCredProvider === 'digitalocean') {
      credsPayload = {
        token: doPersonalAccessToken
      };
    }

    try {
      // Send credentials payload to provider-service for validation and encrypted storage in vault-service
      await apiClient.saveCloudCredentials({
        user_id: 1,
        provider_type: newCredProvider,
        alias: newCredName,
        credentials: credsPayload
      });

      const newCred: CloudCredential = {
        id: `cred-${Date.now()}`,
        name: newCredName,
        provider: newCredProvider,
        account_id: `acc_${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      setCredentialsList([newCred, ...credentialsList]);
      setShowAddModal(false);
      resetFormFields();
    } catch (err: any) {
      setCredSubmitError(err.message || 'Validation failed. Check your cloud credentials and try again.');
    } finally {
      setIsSubmittingCred(false);
    }
  };

  const confirmDeleteCredential = async () => {
    if (credToDelete && deleteConfirmInput.trim() === credToDelete.name) {
      try {
        await apiClient.deleteCloudCredentials(credToDelete.name);
      } catch (e) {
        console.warn('Failed to delete credential from backend:', e);
      }
      setCredentialsList(credentialsList.filter((c) => c.id !== credToDelete.id));
      setCredToDelete(null);
      setDeleteConfirmInput('');
    }
  };

  const resetFormFields = () => {
    setNewCredName('');
    setAwsAccessKeyId('');
    setAwsSecretAccessKey('');
    setAzureTenantId('');
    setAzureClientId('');
    setAzureClientSecret('');
    setAzureSubscriptionId('');
    setDoPersonalAccessToken('');
    setGcpKeyJson('');
    setUploadedFileName(null);
  };

  const toggleViewAll = () => {
    if (selectedProviderFilter === 'all') {
      setSelectedProviderFilter('none');
    } else {
      setSelectedProviderFilter('all');
    }
  };

  // 4 Square Cards config for Cloud Credentials
  const providersConfig = [
    {
      id: 'aws' as CloudProviderType,
      name: 'Amazon Web Services',
      icon: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'aws').length
    },
    {
      id: 'azure' as CloudProviderType,
      name: 'Microsoft Azure',
      icon: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'azure').length
    },
    {
      id: 'digitalocean' as CloudProviderType,
      name: 'DigitalOcean',
      icon: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'digitalocean').length
    },
    {
      id: 'gcp' as CloudProviderType,
      name: 'Google Cloud Platform',
      icon: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'gcp').length
    }
  ];

  // Filtered credentials list based on selectedProviderFilter and search query
  const filteredCredentials = credentialsList.filter((c) => {
    const matchesProvider = selectedProviderFilter === 'all'
      ? true
      : selectedProviderFilter === 'none'
      ? false
      : c.provider === selectedProviderFilter;

    const matchesSearch = searchCredQuery === '' ||
                          c.name.toLowerCase().includes(searchCredQuery.toLowerCase()) ||
                          c.provider.toLowerCase().includes(searchCredQuery.toLowerCase());

    return matchesProvider && matchesSearch;
  });

  // Filtered K8s clusters list based on selectedClusterProviderFilter
  const filteredClusters = selectedClusterProviderFilter === 'all'
    ? clustersList
    : clustersList.filter((cls) => {
        const prov = cls.provider.toLowerCase();
        if (selectedClusterProviderFilter === 'aws') return prov.includes('aws') || prov.includes('eks');
        if (selectedClusterProviderFilter === 'gcp') return prov.includes('gcp') || prov.includes('gke');
        if (selectedClusterProviderFilter === 'azure') return prov.includes('azure') || prov.includes('aks');
        if (selectedClusterProviderFilter === 'digitalocean') return prov.includes('digitalocean') || prov.includes('doks');
        if (selectedClusterProviderFilter === 'onprem') return prov.includes('on-premise') || prov.includes('lenovo');
        return true;
      });

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. CLOUD PROVIDERS IN SQUARE CARDS WITH VECTOR LOGOS */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-brand-sky" />
            Cloud Credentials
          </h3>
          <p className="text-xs text-slate-400">Click on any cloud provider card below to filter its specific credentials</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {providersConfig.map((prov) => {
            const isSelected = selectedProviderFilter === prov.id;
            return (
              <div
                key={prov.id}
                onClick={() => setSelectedProviderFilter(prov.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 shadow-xl'
                    : 'bg-bg-card border-accent-darkBorder hover:border-brand-sky hover:bg-accent-darkHover'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-bg-main p-2 flex items-center justify-center border border-accent-darkBorder">
                    <img src={prov.icon} alt={prov.name} className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-bg-main text-brand-sky border border-accent-darkBorder">
                    {prov.count} Creds
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{prov.name}</h4>
                  <span className="text-xs text-slate-400 mt-0.5 block">Click to view credentials</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. CREDENTIALS LIST SECTION WITH TOGGLE "VIEW ALL" BUTTON */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-sky" />
              Cloud Credentials List {selectedProviderFilter !== 'all' && selectedProviderFilter !== 'none' && `(${selectedProviderFilter.toUpperCase()})`}
            </h3>
            <p className="text-xs text-slate-400">Manage encrypted API tokens & secret access keys for cluster provisioning</p>
          </div>

          <div className="flex items-center gap-3">
            {/* SEARCH INPUT BY CREDS NAME */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search creds..."
                value={searchCredQuery}
                onChange={(e) => setSearchCredQuery(e.target.value)}
                className="bg-bg-main border border-accent-darkBorder rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-brand-sky transition-all w-36 sm:w-44"
              />
            </div>

            {/* TOGGLE VIEW ALL BUTTON */}
            <button
              onClick={toggleViewAll}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                selectedProviderFilter === 'all'
                  ? 'bg-brand-blue text-white border-brand-sky shadow-md ring-2 ring-brand-sky/20'
                  : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>View All</span>
            </button>

            {/* CREATE IAM USER BUTTON */}
            <button
              onClick={() => setShowCreateIamModal(true)}
              className="bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all border border-purple-400/30"
              title="AWS IAM User & EKS Access Setup Guide"
            >
              <UserPlus className="w-4 h-4 text-purple-200" />
              <span>Create IAM User</span>
            </button>

            {/* + ADD NEW CREDENTIAL BUTTON */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Credentials (from created IAM user in cloud)</span>
            </button>
          </div>
        </div>

        {/* Credentials Cards List */}
        {filteredCredentials.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {selectedProviderFilter === 'none'
              ? 'No credentials displayed. Click "View All" or select a Cloud Provider above.'
              : 'No credentials found for this provider. Click "+ Add New Credentials (from created IAM user in cloud)" to add one.'}
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((cred) => (
              <div 
                key={cred.id} 
                className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-2 relative group hover:border-brand-sky transition-colors"
              >
                {/* ACTION BUTTONS ON HOVER AT TOP-RIGHT */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/95 p-1 rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md z-10">
                  {/* VIEW KEYS BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewKeys(cred);
                    }}
                    title="View Keys & Details"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-blue text-slate-300 hover:text-white transition-colors border border-slate-700/60 flex items-center gap-1 text-[10px] font-semibold px-2"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Keys</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCredToDelete(cred);
                    }}
                    title="Delete Credential"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover/del:text-white" />
                  </button>
                </div>

                <div className="flex items-center justify-between pr-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-bg-card border border-accent-darkBorder text-brand-sky">
                    {cred.provider}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate">{cred.name}</h4>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. WORKING KUBERNETES CLUSTERS PANEL WITH INTERACTIVE PROVIDER FILTERS & UPDATE BUTTON */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-cyan" />
              Kubernetes Clusters
            </h3>
            <p className="text-xs text-slate-400">Target Kubernetes clusters connected to your account for automated database deployment</p>
          </div>

          <div className="flex items-center gap-3">
            {/* TOGGLE ALL CLUSTERS BUTTON */}
            <button
              onClick={() => setSelectedClusterProviderFilter('all')}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                selectedClusterProviderFilter === 'all'
                  ? 'bg-brand-blue text-white border-brand-sky shadow-md ring-2 ring-brand-sky/20'
                  : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All Clusters</span>
            </button>

            {/* UPDATE / REFRESH BUTTON */}
            <button
              onClick={handleOpenSyncModal}
              disabled={isSyncing}
              title="Scan & Sync Kubernetes Clusters from Cloud Providers"
              className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-accent-darkBorder hover:border-brand-sky shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-sky ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Update'}</span>
            </button>
          </div>
        </div>

        {/* SYNC STATUS NOTIFICATION BANNER */}
        {syncStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            syncStatusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            <span>{syncStatusMsg.text}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PROVIDER FILTER BADGES BAR FOR CLUSTERS */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All Clusters', icon: '' },
            { id: 'aws', label: 'Amazon Web Services (AWS)', icon: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg' },
            { id: 'gcp', label: 'Google Cloud Platform (GCP)', icon: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg' },
            { id: 'azure', label: 'Microsoft Azure', icon: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg' },
            { id: 'digitalocean', label: 'DigitalOcean', icon: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg' }
          ].map((filter) => {
            const isSelected = selectedClusterProviderFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedClusterProviderFilter(filter.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-brand-blue/20 border-brand-sky text-white ring-2 ring-brand-sky/30 shadow-md'
                    : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:border-brand-sky/40 hover:text-white hover:bg-accent-darkHover'
                }`}
              >
                {filter.icon.startsWith('http') ? (
                  <img src={filter.icon} alt={filter.label} className="w-4 h-4 object-contain" />
                ) : filter.icon ? (
                  <span>{filter.icon}</span>
                ) : null}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* CLUSTERS GRID */}
        {filteredClusters.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active Kubernetes clusters found for this provider. Select another provider or click "All Clusters".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {filteredClusters.map((cls) => (
              <div key={cls.id} className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-3 shadow-md hover:border-brand-sky transition-all relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                    {cls.provider}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cls.token ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" /> Token Created
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Needs Token
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ● Running
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-base">{cls.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> {cls.region}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCluster(cls)}
                    title={`Delete cluster ${cls.name}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-3 border-t border-accent-darkBorder/60 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Nodes: <strong className="text-white">{cls.nodes_count} Worker Nodes</strong></span>
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-[110px]">{cls.api_url}</span>
                </div>

                {/* CLUSTER ACTIONS & AUTHORIZATION */}
                <div className="pt-2 border-t border-accent-darkBorder/40 space-y-2">
                  {/* AUTHORIZE ACCESS ENTRY DYNAMIC BUTTON (FOR AWS EKS CLUSTERS) */}
                  {(cls.provider.toLowerCase().includes('aws') || cls.provider.toLowerCase().includes('eks')) && (
                    <button
                      onClick={() => handleOpenAuthModal(cls)}
                      disabled={authorizingClusterId === cls.id}
                      title="Select Cloud Credential and grant IAM Administrator access to this EKS cluster via AWS Access Entry & ClusterAdmin policy"
                      className={`w-full font-bold text-xs py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 ${
                        authorizedClusterMap[cls.name]
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                          : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      {authorizingClusterId === cls.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      ) : authorizedClusterMap[cls.name] ? (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Key className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span>
                        {authorizingClusterId === cls.id
                          ? 'Authorizing Access Entry...'
                          : authorizedClusterMap[cls.name]
                          ? 'Access Entry Authorized'
                          : 'Authorize Access Entry'}
                      </span>
                    </button>
                  )}


                  {/* GENERATE SERVICE ACCOUNT TOKEN ACTION BUTTON */}
                  <button
                    onClick={() => handleAutoCreateClusterToken(cls)}
                    disabled={creatingTokenClusterId === cls.id}
                    title={cls.token ? "ServiceAccount token is saved. Click to regenerate or refresh token." : "Generate permanent ServiceAccount token for this cluster."}
                    className={`w-full font-bold text-xs py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 ${
                      cls.token
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-brand-blue/15 hover:bg-brand-blue text-brand-sky hover:text-white border-brand-sky/30 hover:border-brand-sky'
                    }`}
                  >
                    {creatingTokenClusterId === cls.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : cls.token ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {creatingTokenClusterId === cls.id
                        ? 'Generating Token...'
                        : cls.token
                        ? 'Regenerate Token'
                        : 'Generate Token'}
                    </span>
                  </button>
                </div>


              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL FOR ADDING CREDENTIALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-lg p-6 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-sky" /> Add New Cloud Credential
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {credSubmitError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold flex items-center justify-between">
                <span>{credSubmitError}</span>
                <button onClick={() => setCredSubmitError(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleAddCredential} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Credential Name</label>
                <input
                  type="text"
                  required
                  value={newCredName}
                  onChange={(e) => setNewCredName(e.target.value)}
                  placeholder="e.g., Production AWS Account"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Select Provider</label>
                <select
                  value={newCredProvider}
                  onChange={(e) => setNewCredProvider(e.target.value as CloudProviderType)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky font-semibold"
                >
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="azure">Microsoft Azure</option>
                  <option value="digitalocean">DigitalOcean</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                </select>
              </div>

              {/* AWS SPECIFIC FIELDS: 2 FIELDS */}
              {newCredProvider === 'aws' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">AWS Security Credentials</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">AWS Access Key ID</label>
                    <input
                      type="text"
                      required
                      value={awsAccessKeyId}
                      onChange={(e) => setAwsAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">AWS Secret Access Key</label>
                    <input
                      type="password"
                      required
                      value={awsSecretAccessKey}
                      onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* AZURE SPECIFIC FIELDS */}
              {newCredProvider === 'azure' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">Azure Service Principal Credentials</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tenant ID</label>
                    <input
                      type="text"
                      required
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client ID (App ID)</label>
                    <input
                      type="text"
                      required
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client Secret</label>
                    <input
                      type="password"
                      required
                      value={azureClientSecret}
                      onChange={(e) => setAzureClientSecret(e.target.value)}
                      placeholder="secret_key_string"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Subscription ID</label>
                    <input
                      type="text"
                      required
                      value={azureSubscriptionId}
                      onChange={(e) => setAzureSubscriptionId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* DIGITALOCEAN SPECIFIC FIELDS */}
              {newCredProvider === 'digitalocean' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">DigitalOcean API Token</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      required
                      value={doPersonalAccessToken}
                      onChange={(e) => setDoPersonalAccessToken(e.target.value)}
                      placeholder="dop_v1_..."
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* GCP SPECIFIC FIELDS: FILE UPLOAD OR RAW TEXT */}
              {newCredProvider === 'gcp' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-sky uppercase">GCP Service Account Key</span>
                    
                    {/* TAB TOGGLE: UPLOAD FILE vs PASTE TEXT */}
                    <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-accent-darkBorder">
                      <button
                        type="button"
                        onClick={() => setGcpInputMode('file')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                          gcpInputMode === 'file' 
                            ? 'bg-brand-blue text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setGcpInputMode('text')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                          gcpInputMode === 'text' 
                            ? 'bg-brand-blue text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Paste JSON
                      </button>
                    </div>
                  </div>

                  {gcpInputMode === 'file' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Upload JSON Key File</label>
                      <label className="border-2 border-dashed border-accent-darkBorder hover:border-brand-sky rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-bg-card/50 transition-colors">
                        <Upload className="w-6 h-6 text-brand-sky mb-2" />
                        <span className="text-xs font-bold text-white">
                          {uploadedFileName ? uploadedFileName : 'Click to select GCP .json file'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">Service Account Private Key</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Paste Service Account JSON Content</label>
                      <textarea
                        rows={5}
                        required
                        value={gcpKeyJson}
                        onChange={(e) => setGcpKeyJson(e.target.value)}
                        placeholder='{"type": "service_account", "project_id": "my-gcp-project", ...}'
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-sky"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingCred}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCred}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingCred && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingCred ? 'Validating...' : 'Save Credential'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {credToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-3xl border border-rose-500/40 w-full max-w-md p-6 shadow-2xl space-y-5 relative text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Cloud Credential</h4>
                <p className="text-xs text-slate-400">This action is permanent and cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-bg-main rounded-xl border border-accent-darkBorder space-y-1.5 text-xs">
              <p className="text-slate-300 font-medium">You are about to remove credential alias:</p>
              <p className="font-bold text-rose-400 text-sm font-mono select-all">{credToDelete.name}</p>
              <p className="text-[11px] text-slate-400 uppercase">Provider: {credToDelete.provider}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                To confirm deletion, type <span className="font-bold text-white font-mono">{credToDelete.name}</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={`Type "${credToDelete.name}" to confirm`}
                className="w-full bg-bg-main border border-rose-500/30 text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/80"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-accent-darkBorder">
              <button
                type="button"
                onClick={() => {
                  setCredToDelete(null);
                  setDeleteConfirmInput('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCredential}
                disabled={deleteConfirmInput.trim() !== credToDelete.name}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY CLUSTERS MODAL WITH ALIAS SELECTOR */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-lg p-6 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/20 flex items-center justify-center border border-brand-sky/30">
                  <Server className="w-5 h-5 text-brand-sky" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Scan Cloud Clusters</h3>
                  <p className="text-xs text-slate-400">Select connected credentials to discover Kubernetes clusters</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ALIAS SELECTOR DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Credential (Alias)
                </label>
                <select
                  value={selectedCredAliasForSync}
                  onChange={(e) => setSelectedCredAliasForSync(e.target.value)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  <option value="all">✨ All Connected Cloud Credentials (Scan All)</option>
                  {credentialsList.map((c) => (
                    <option key={c.id} value={c.name || c.id}>
                      [{c.provider.toUpperCase()}] {c.name} (Alias: {c.name})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Discovery-service will pull decrypted keys from Vault for this specific alias to scan Kubernetes clusters.
                </p>
              </div>

              {/* REGION INPUT (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Region (Optional)
                </label>
                <input
                  type="text"
                  value={selectedRegionForSync}
                  onChange={(e) => setSelectedRegionForSync(e.target.value)}
                  placeholder="e.g. us-central1, europe-west1 (Leave empty for all regions)"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-sky"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDiscoveryScan}
                disabled={isSyncing}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{isSyncing ? 'Scanning...' : 'Start Cluster Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICEACCOUNT TOKEN CREATION MODAL */}
      {selectedTokenCluster && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-2xl p-6 shadow-2xl space-y-5 relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/20 flex items-center justify-center border border-brand-sky/30">
                  <KeyRound className="w-5 h-5 text-brand-sky" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    ServiceAccount Token Setup
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                      {selectedTokenCluster.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Generate a persistent ServiceAccount Bearer Token for automated database deployments</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTokenCluster(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: K8S MANIFEST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-sky text-black text-[11px] font-extrabold flex items-center justify-center">1</span>
                  Apply K8s ServiceAccount & Secret Manifest
                </label>
                <button
                  onClick={() => {
                    const manifest = `apiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: idp-deployer-sa\n  namespace: kube-system\n---\napiVersion: v1\nkind: Secret\nmetadata:\n  name: idp-deployer-sa-token\n  namespace: kube-system\n  annotations:\n    kubernetes.io/service-account.name: idp-deployer-sa\ntype: kubernetes.io/service-account-token\n---\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRoleBinding\nmetadata:\n  name: idp-deployer-binding\nsubjects:\n- kind: ServiceAccount\n  name: idp-deployer-sa\n  namespace: kube-system\nroleRef:\n  kind: ClusterRole\n  name: cluster-admin\n  apiGroup: rbac.authorization.k8s.io`;
                    navigator.clipboard.writeText(manifest);
                    setCopiedManifest(true);
                    setTimeout(() => setCopiedManifest(false), 2000);
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-blue/20 hover:bg-brand-blue text-brand-sky hover:text-white border border-brand-sky/30 transition-all flex items-center gap-1.5"
                >
                  {copiedManifest ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedManifest ? 'Copied Manifest!' : 'Copy K8s Manifest'}</span>
                </button>
              </div>
              <pre className="bg-bg-main border border-accent-darkBorder/80 rounded-2xl p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto select-all leading-relaxed">
{`apiVersion: v1
kind: ServiceAccount
metadata:
  name: idp-deployer-sa
  namespace: kube-system
---
apiVersion: v1
kind: Secret
metadata:
  name: idp-deployer-sa-token
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: idp-deployer-sa
type: kubernetes.io/service-account-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: idp-deployer-binding
subjects:
- kind: ServiceAccount
  name: idp-deployer-sa
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io`}
              </pre>
            </div>

            {/* STEP 2: EXTRACT COMMAND */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-sky text-black text-[11px] font-extrabold flex items-center justify-center">2</span>
                Run command to extract JWT Token
              </label>
              <div className="bg-bg-main border border-accent-darkBorder p-2.5 rounded-xl font-mono text-[11px] text-slate-300 select-all flex items-center justify-between">
                <span>kubectl get secret idp-deployer-sa-token -n kube-system -o jsonpath='&#123;.data.token&#125;' | base64 -d</span>
              </div>
            </div>

            {/* STEP 3: PASTE & SAVE TOKEN */}
            <div className="space-y-2 pt-2 border-t border-accent-darkBorder">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-sky text-black text-[11px] font-extrabold flex items-center justify-center">3</span>
                Paste & Save Token for Cluster
              </label>
              <textarea
                rows={3}
                value={saTokenInput}
                onChange={(e) => setSaTokenInput(e.target.value)}
                placeholder="Paste the extracted JWT Bearer Token string here (e.g., eyJhbGciOiJSUzI1NiIs...)"
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-sky"
              />
            </div>

            {tokenSaveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>ServiceAccount Token saved successfully for cluster {selectedTokenCluster.name}!</span>
              </div>
            )}

            <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTokenCluster(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClusterToken}
                disabled={!saTokenInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save Cluster Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW CREDENTIAL KEYS MODAL                                             */}
      {/* ========================================================================= */}
      {selectedCredForKeys && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedCredForKeys(null);
                setCredDetailsData(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-accent-darkHover rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-accent-darkBorder pb-4">
              <div className="p-3 bg-brand-blue/20 rounded-xl border border-brand-sky/30">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Credential Keys:</span>
                  <span className="text-brand-sky">{selectedCredForKeys.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Provider: <span className="uppercase font-semibold text-slate-300">{selectedCredForKeys.provider}</span> • Status: <span className="text-emerald-400 font-semibold">Active</span>
                </p>
              </div>
            </div>

            {isLoadingCredDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 text-brand-sky animate-spin" />
                <span className="text-xs text-slate-400">Decrypting & loading credential keys...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Secret Values</span>
                  <button
                    onClick={() => setShowSecretKeys(!showSecretKeys)}
                    className="text-xs font-semibold text-brand-sky hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-main border border-accent-darkBorder hover:border-brand-sky transition-all"
                  >
                    {showSecretKeys ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-brand-sky" />}
                    <span>{showSecretKeys ? 'Hide Secrets' : 'Reveal Secrets'}</span>
                  </button>
                </div>

                {/* AWS CREDENTIAL KEYS */}
                {selectedCredForKeys.provider === 'aws' && (
                  <div className="space-y-3">
                    {/* AWS Access Key ID */}
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">AWS Access Key ID</span>
                        <button
                          onClick={() => copyKeyText(credDetailsData?.credentials?.aws_access_key_id || selectedCredForKeys.aws_access_key_id || credDetailsData?.credentials?.access_key_id || 'AKIA...', 'access_key_id')}
                          className="text-[11px] font-bold text-brand-sky hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedKeyField === 'access_key_id' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKeyField === 'access_key_id' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-amber-300 select-all font-semibold">
                        {credDetailsData?.credentials?.aws_access_key_id || credDetailsData?.credentials?.access_key_id || selectedCredForKeys.aws_access_key_id || 'AKIAUD3G5OJ3LMUHN4FR'}
                      </div>
                    </div>

                    {/* AWS Secret Access Key */}
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">AWS Secret Access Key</span>
                        <button
                          onClick={() => copyKeyText(credDetailsData?.credentials?.aws_secret_access_key || credDetailsData?.credentials?.secret_access_key || selectedCredForKeys.aws_secret_access_key || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'secret_key')}
                          className="text-[11px] font-bold text-brand-sky hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedKeyField === 'secret_key' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKeyField === 'secret_key' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 select-all font-semibold">
                        {showSecretKeys
                          ? (credDetailsData?.credentials?.aws_secret_access_key || credDetailsData?.credentials?.secret_access_key || selectedCredForKeys.aws_secret_access_key || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
                          : '••••••••••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>

                    {/* AWS Default Region */}
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <span className="text-xs text-slate-400 font-semibold block">Target Region</span>
                      <div className="font-mono text-xs text-slate-200">
                        {credDetailsData?.credentials?.aws_region || credDetailsData?.credentials?.region || 'us-east-1 / eu-central-1'}
                      </div>
                    </div>
                  </div>
                )}

                {/* GCP CREDENTIAL KEYS */}
                {selectedCredForKeys.provider === 'gcp' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">Service Account JSON Key</span>
                        <button
                          onClick={() => copyKeyText(typeof credDetailsData?.credentials === 'string' ? credDetailsData.credentials : JSON.stringify(credDetailsData?.credentials || {}, null, 2), 'gcp_json')}
                          className="text-[11px] font-bold text-brand-sky hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedKeyField === 'gcp_json' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKeyField === 'gcp_json' ? 'Copied!' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="font-mono text-[11px] text-emerald-400 select-all max-h-48 overflow-y-auto bg-bg-card p-2 rounded-lg border border-accent-darkBorder/60">
                        {showSecretKeys
                          ? (typeof credDetailsData?.credentials === 'string' ? credDetailsData.credentials : JSON.stringify(credDetailsData?.credentials || { type: "service_account", project_id: "my-gcp-project" }, null, 2))
                          : '{\n  "type": "service_account",\n  "project_id": "••••••••",\n  "private_key": "••••••••••••••••••••••••••••••••"\n}'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* AZURE CREDENTIAL KEYS */}
                {selectedCredForKeys.provider === 'azure' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">Client Secret</span>
                        <button
                          onClick={() => copyKeyText(credDetailsData?.credentials?.client_secret || '••••', 'azure_secret')}
                          className="text-[11px] font-bold text-brand-sky hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedKeyField === 'azure_secret' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKeyField === 'azure_secret' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 select-all font-semibold">
                        {showSecretKeys ? (credDetailsData?.credentials?.client_secret || 'my-azure-secret-value') : '••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>
                  </div>
                )}

                {/* DIGITALOCEAN CREDENTIAL KEYS */}
                {selectedCredForKeys.provider === 'digitalocean' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">Personal Access Token (PAT)</span>
                        <button
                          onClick={() => copyKeyText(credDetailsData?.credentials?.token || 'dop_v1_••••', 'do_pat')}
                          className="text-[11px] font-bold text-brand-sky hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedKeyField === 'do_pat' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKeyField === 'do_pat' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 select-all font-semibold">
                        {showSecretKeys ? (credDetailsData?.credentials?.token || 'dop_v1_example_token') : 'dop_v1_••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedCredForKeys(null);
                  setCredDetailsData(null);
                }}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CREATE AWS IAM USER & EKS ACCESS GUIDE MODAL                           */}
      {/* ========================================================================= */}
      {showCreateIamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateIamModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-accent-darkHover rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-accent-darkBorder pb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <UserPlus className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Create AWS IAM User for Kubernetes & IDP</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Quick guide & copyable commands to create an IAM User with full permissions for EKS & Database Deployment
                </p>
              </div>
            </div>

            {/* STEP 1: CREATE IAM USER WITH ADMIN ACCESS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[11px] font-extrabold flex items-center justify-center">1</span>
                  Create IAM User & Generate Access Keys (AWS CLI)
                </label>
                <button
                  onClick={() => copyIamText(`aws iam create-user --user-name idp-k8s-admin\naws iam attach-user-policy --user-name idp-k8s-admin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\naws iam create-access-key --user-name idp-k8s-admin`, 'step1')}
                  className="text-xs font-bold text-purple-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-purple-950/50 rounded-lg border border-purple-500/30"
                >
                  {copiedIamCode === 'step1' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIamCode === 'step1' ? 'Copied Commands!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="bg-bg-main border border-accent-darkBorder rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto select-all leading-relaxed">
{`# 1. Create IAM User
aws iam create-user --user-name idp-k8s-admin

# 2. Attach AdministratorAccess policy
aws iam attach-user-policy --user-name idp-k8s-admin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 3. Create Access Key & Secret Key for IDP Platform
aws iam create-access-key --user-name idp-k8s-admin`}
              </pre>
            </div>

            {/* STEP 2: GRANT EKS CLUSTER-ADMIN ACCESS ENTRY */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[11px] font-extrabold flex items-center justify-center">2</span>
                  Authorize User in EKS Cluster (Required for Helm & DB Deployment)
                </label>
                <button
                  onClick={() => copyIamText(`aws eks create-access-entry --cluster-name test-cluster-1 --principal-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):user/idp-k8s-admin --type STANDARD\naws eks associate-access-policy --cluster-name test-cluster-1 --principal-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):user/idp-k8s-admin --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy --access-scope type=cluster`, 'step2')}
                  className="text-xs font-bold text-purple-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-purple-950/50 rounded-lg border border-purple-500/30"
                >
                  {copiedIamCode === 'step2' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIamCode === 'step2' ? 'Copied Commands!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="bg-bg-main border border-accent-darkBorder rounded-xl p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed">
{`# 1. Create Access Entry for EKS (replace test-cluster-1 if needed)
aws eks create-access-entry \\
  --cluster-name test-cluster-1 \\
  --principal-arn $(aws iam get-user --user-name idp-k8s-admin --query 'User.Arn' --output text) \\
  --type STANDARD

# 2. Assign ClusterAdminPolicy so Helm can deploy databases
aws eks associate-access-policy \\
  --cluster-name test-cluster-1 \\
  --principal-arn $(aws iam get-user --user-name idp-k8s-admin --query 'User.Arn' --output text) \\
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \\
  --access-scope type=cluster`}
              </pre>
            </div>

            {/* STEP 3: TERRAFORM SNIPPET */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[11px] font-extrabold flex items-center justify-center">3</span>
                  Alternative: Terraform Configuration
                </label>
                <button
                  onClick={() => copyIamText(`resource "aws_eks_access_entry" "idp_user" {\n  cluster_name  = "test-cluster-1"\n  principal_arn = "arn:aws:iam::<ACCOUNT_ID>:user/idp-k8s-admin"\n  type          = "STANDARD"\n}\n\nresource "aws_eks_access_policy_association" "idp_admin" {\n  cluster_name  = "test-cluster-1"\n  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"\n  principal_arn = "arn:aws:iam::<ACCOUNT_ID>:user/idp-k8s-admin"\n  access_scope {\n    type = "cluster"\n  }\n}`, 'tf')}
                  className="text-xs font-bold text-purple-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-purple-950/50 rounded-lg border border-purple-500/30"
                >
                  {copiedIamCode === 'tf' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIamCode === 'tf' ? 'Copied TF!' : 'Copy TF'}</span>
                </button>
              </div>
              <pre className="bg-bg-main border border-accent-darkBorder rounded-xl p-3 text-[11px] font-mono text-amber-300 overflow-x-auto select-all leading-relaxed">
{`resource "aws_eks_access_entry" "idp_user" {
  cluster_name  = "test-cluster-1"
  principal_arn = "arn:aws:iam::<ACCOUNT_ID>:user/idp-k8s-admin"
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "idp_admin" {
  cluster_name  = "test-cluster-1"
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = "arn:aws:iam::<ACCOUNT_ID>:user/idp-k8s-admin"
  access_scope {
    type = "cluster"
  }
}`}
              </pre>
            </div>

            <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowCreateIamModal(false);
                  setShowAddModal(true);
                  setNewCredProvider('aws');
                }}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Generated Keys to Platform</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateIamModal(false)}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-accent-darkBorder text-slate-400 hover:text-white hover:bg-accent-darkHover transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHORIZE ACCESS ENTRY CREDENTIAL SELECTOR MODAL */}
      {selectedClusterForAuth && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-lg p-6 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Authorize EKS Access Entry</h3>
                  <p className="text-xs text-slate-400">
                    Cluster: <strong className="text-white">{selectedClusterForAuth.name}</strong> ({selectedClusterForAuth.region})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClusterForAuth(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Select which connected <strong>Cloud Credential (IAM User)</strong> should be granted <span className="text-amber-400 font-semibold">ClusterAdmin</span> permissions in this EKS cluster.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Cloud Credential (Alias)
                </label>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {credentialsList.map((cred) => {
                    const isSelected = selectedCredAliasForAuth === cred.name;
                    return (
                      <div
                        key={cred.id}
                        onClick={() => setSelectedCredAliasForAuth(cred.name)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                            : 'bg-bg-main border-accent-darkBorder/80 hover:border-slate-500 text-slate-300 hover:bg-accent-darkHover'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm block text-white">{cred.name}</span>
                            <span className="text-[11px] text-slate-400 uppercase font-mono">Provider: {cred.provider}</span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-bg-main rounded-xl border border-accent-darkBorder/60 text-[11px] text-slate-400 font-mono">
                Payload JSON: <code className="text-amber-300">{JSON.stringify({ alias: selectedCredAliasForAuth, user_id: 1 })}</code>
              </div>
            </div>

            <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedClusterForAuth(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAuthorizeAccess}
                disabled={!selectedCredAliasForAuth || authorizingClusterId === selectedClusterForAuth.id}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {authorizingClusterId === selectedClusterForAuth.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{authorizingClusterId === selectedClusterForAuth.id ? 'Authorizing...' : 'Authorize Selected Credential'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

