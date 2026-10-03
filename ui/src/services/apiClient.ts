import { CATALOG_ITEMS, INITIAL_DEPLOYED_DBS, CLOUD_CREDENTIALS, K8S_CLUSTERS, METRICS_SAMPLE } from './mockData';
import { DatabaseCatalogItem, DeployedDatabase, CloudCredential, K8sCluster, DatabaseMetrics, CloudProviderType } from '../types';

class ApiClient {
  private useMock: boolean = true;
  private deployedDbs: DeployedDatabase[] = [...INITIAL_DEPLOYED_DBS];
  private credentials: CloudCredential[] = [...CLOUD_CREDENTIALS];
  private clusters: K8sCluster[] = [...K8S_CLUSTERS];

  async getCatalog(): Promise<DatabaseCatalogItem[]> {
    return Promise.resolve(CATALOG_ITEMS);
  }

  async getDeployedDatabases(): Promise<DeployedDatabase[]> {
    let localSaved: DeployedDatabase[] = [];
    try {
      const stored = localStorage.getItem('deployed_databases');
      if (stored) {
        localSaved = JSON.parse(stored);
      }
    } catch (_) {}

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/provisioning', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const backendDbs: DeployedDatabase[] = data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            engine_type: item.engine_type,
            version: item.version,
            status: item.status?.toLowerCase() || 'running',
            cluster_name: item.cluster_name,
            namespace: item.namespace || 'databases',
            cpu_usage_m: Math.round((item.cpu || 1) * 1000),
            memory_usage_mb: Math.round((item.ram || 2) * 1024),
            storage_gb: item.disk || 20,
            monthly_cost: item.monthly_cost || 0,
            created_at: typeof item.created_at === 'string' ? item.created_at.substring(0, 16) : new Date().toISOString().substring(0, 16),
            values_yaml: item.values_yaml || '',
            deployment_type: item.deployment_type || (item.values_yaml?.includes('apiVersion:') ? 'crd' : 'helm')
          }));

          const merged = [...backendDbs];
          localSaved.forEach((local) => {
            if (!merged.some((b) => b.name === local.name || b.id === local.id)) {
              merged.push(local);
            }
          });
          this.deployedDbs = merged.length > 0 ? merged : [...INITIAL_DEPLOYED_DBS];
          localStorage.setItem('deployed_databases', JSON.stringify(this.deployedDbs));
          return this.deployedDbs;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch deployed databases from db-provisioning-service:', e);
    }

    if (localSaved.length > 0) {
      this.deployedDbs = localSaved;
      return localSaved;
    }

    return Promise.resolve(this.deployedDbs);
  }


  async getCredentials(): Promise<CloudCredential[]> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/provider/credentials', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const fetched: CloudCredential[] = data.map((c: any) => ({
            id: c.id ? String(c.id) : `cred-${c.alias}`,
            name: c.alias,
            provider: (c.provider_type || 'gcp') as CloudProviderType,
            account_id: c.alias || 'default',
            status: 'active' as const,
            created_at: c.created_at || new Date().toISOString().substring(0, 10)
          }));
          this.credentials = fetched;
          return fetched;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch credentials from provider-service:', e);
    }
    return Promise.resolve(this.credentials);
  }

  async getCredentialDetails(alias: string): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/provider/credentials/${alias}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`Failed to fetch credential details for ${alias}:`, e);
    }
    return null;
  }

  async getClusters(): Promise<K8sCluster[]> {
    return this.getUserClusters(1);
  }

  async discoverClusters(providerType: string, alias: string, region?: string, userId: number = 1): Promise<K8sCluster[]> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/discovery/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        user_id: userId,
        provider_type: providerType,
        alias: alias,
        region: region || null
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Discovery scan failed (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((c: any) => this.mapClusterResponse(c));
    }
    return [];
  }

  async getUserClusters(userId: number = 1): Promise<K8sCluster[]> {
    const res = await fetch(`/api/v1/discovery/clusters/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((c: any) => this.mapClusterResponse(c));
      }
    }
    return [];
  }

  async deleteCluster(clusterName: string, userId: number = 1): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/discovery/cluster/${encodeURIComponent(clusterName)}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      return res.ok;
    } catch (e) {
      console.warn(`Failed to delete cluster ${clusterName}:`, e);
      return false;
    }
  }

  private mapClusterResponse(c: any): K8sCluster {
    const providerMap: Record<string, any> = {
      gcp: 'GCP GKE',
      aws: 'AWS EKS',
      azure: 'Azure AKS',
      digitalocean: 'DigitalOcean',
      do: 'DigitalOcean',
      onprem: 'On-Premise'
    };
    const clusterId = c.id || `cluster-${c.cluster_name || c.name}`;
    const clusterName = c.cluster_name || c.name || 'k8s-cluster';
    const savedToken = localStorage.getItem(`k8s_token_${clusterId}`) || localStorage.getItem(`k8s_token_${clusterName}`);

    return {
      id: clusterId,
      name: clusterName,
      provider: providerMap[c.provider_type?.toLowerCase()] || 'GCP GKE',
      provider_alias: c.provider_alias || c.alias || '',
      region: c.region || 'global',
      nodes_count: c.nodes_count || 3,
      status: (c.status === 'active' || c.status === 'running') ? 'active' : 'degraded',
      api_url: c.endpoint || c.api_url || 'https://kubernetes.default.svc',
      ca_cert_data: c.ca_cert_data || c.ca_cert || '',
      token: savedToken || c.token || '',
      user_name: c.user_name || 'cluster-admin'
    };
  }

  saveClusterToken(clusterIdentifier: string, token: string): void {
    localStorage.setItem(`k8s_token_${clusterIdentifier}`, token);
  }

  async createClusterToken(data: {
    user_id?: number;
    alias: string;
    cluster_name: string;
    api_server_url: string;
    ca_cert_data?: string;
  }): Promise<string> {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/v1/discovery/clusters/create_token/${encodeURIComponent(data.cluster_name)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        user_id: data.user_id || 1,
        alias: data.alias,
        cluster_name: data.cluster_name,
        api_server_url: data.api_server_url,
        ca_cert_data: data.ca_cert_data || ''
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to generate cluster token from backend');
    }

    const result = await res.json();
    const generatedToken = result.token || '';
    if (generatedToken) {
      this.saveClusterToken(data.cluster_name, generatedToken);
    }
    return generatedToken;
  }

  async authorizeClusterAccess(clusterName: string, alias: string, userId: number = 1): Promise<{ status: string; principal_arn?: string; message?: string }> {
    const token = localStorage.getItem('access_token');
    const url = `/api/v1/discovery/clusters/${encodeURIComponent(clusterName)}/authorize-access`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        alias: alias,
        user_id: userId
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to authorize EKS access entry');
    }

    return await res.json();
  }


  async getMetricsForDb(dbId: string): Promise<DatabaseMetrics> {
    return Promise.resolve({ ...METRICS_SAMPLE, db_id: dbId });
  }

  async deployDatabase(newDb: Omit<DeployedDatabase, 'id' | 'created_at' | 'status'>): Promise<DeployedDatabase> {
    const created: DeployedDatabase = {
      ...newDb,
      id: `db-${Date.now()}`,
      status: 'running',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // 1. Try persisting to db-provisioning-service backend
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newDb.name,
          engine_type: newDb.engine_type,
          version: newDb.version,
          cluster_name: newDb.cluster_name,
          namespace: newDb.namespace || 'databases',
          cpu: (newDb.cpu_usage_m || 1000) / 1000,
          ram: (newDb.memory_usage_mb || 2048) / 1024,
          disk: newDb.storage_gb || 20,
          values_yaml: newDb.values_yaml || ''
        })
      });
      if (res.ok) {
        const item = await res.json();
        created.id = String(item.id);
      }
    } catch (err) {
      console.warn('Failed to save database in provisioning service DB:', err);
    }

    // 2. Persist in memory & local storage so it never disappears on refresh
    this.deployedDbs = [created, ...this.deployedDbs.filter((d) => d.name !== created.name)];
    try {
      localStorage.setItem('deployed_databases', JSON.stringify(this.deployedDbs));
    } catch (_) {}

    return created;
  }


  async pullHelmChart(payload: { chart_repo_url: string; chart_name: string; chart_version: string; release_name: string }): Promise<any> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/helm/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to pull chart (${res.status})`);
    }
    return await res.json();
  }

  async getHelmFiles(releaseName: string): Promise<string[]> {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/v1/helm/files?release_name=${encodeURIComponent(releaseName)}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json().catch(() => ({ files: [] }));
    return data.files || [];
  }

  async getHelmFile(releaseName: string, filePath: string): Promise<string> {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/v1/helm/file?release_name=${encodeURIComponent(releaseName)}&file_path=${encodeURIComponent(filePath)}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch file (${res.status})`);
    }
    const data = await res.json();
    return data.content || '';
  }

  async saveHelmFile(releaseName: string, filePath: string, content: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/helm/file', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        release_name: releaseName,
        file_path: filePath,
        content: content
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to save file (${res.status})`);
    }
    return await res.json();
  }

  async applyHelmRelease(payload: {
    cluster_name: string;
    release_name: string;
    chart_name: string;
    api_server_url?: string;
    ca_cert_data?: string;
    token?: string;
    user_name?: string;
    namespace?: string;
    target_values_file?: string;
  }): Promise<any> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/helm/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        cluster_name: payload.cluster_name,
        release_name: payload.release_name,
        chart_name: payload.chart_name,
        api_server_url: payload.api_server_url || 'https://kubernetes.default.svc',
        ca_cert_data: payload.ca_cert_data || '',
        token: payload.token || '',
        user_name: payload.user_name || 'cluster-admin',
        namespace: payload.namespace || 'databases',
        target_values_file: payload.target_values_file
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Helm apply failed (${res.status})`);
    }
    return await res.json();
  }

  async uninstallHelmRelease(payload: {
    cluster_name: string;
    release_name: string;
    namespace?: string;
  }): Promise<any> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/helm/uninstall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        cluster_name: payload.cluster_name,
        release_name: payload.release_name,
        namespace: payload.namespace || 'databases'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Helm uninstall failed (${res.status})`);
    }
    return await res.json();
  }

  async applyOperatorManifest(payload: { resource_name: string; target_namespace?: string; content: string; cluster_name: string }): Promise<any> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/operator/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        cluster_name: payload.cluster_name,
        resource_name: payload.resource_name,
        target_namespace: payload.target_namespace || 'databases',
        content: payload.content
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Operator manifest apply failed (${res.status})`);
    }
    return await res.json();
  }

  async saveCloudCredentials(payload: {
    user_id: number;
    provider_type: string;
    alias: string;
    credentials: Record<string, any>;
  }): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/v1/provider/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Cloud provider validation failed (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    return true;
  }

  async deleteCloudCredentials(alias: string, userId: number = 1): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/v1/provider/credentials/${alias}?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Failed to delete credential (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      }
      throw new Error(message);
    }

    return true;
  }

  async addCredential(cred: Omit<CloudCredential, 'id' | 'created_at' | 'status'>): Promise<CloudCredential> {
    const created: CloudCredential = {
      ...cred,
      id: `cred-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString().substring(0, 10)
    };
    this.credentials.unshift(created);
    return Promise.resolve(created);
  }

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const res = await fetch('/api/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Server error (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_email', email);
    return data;
  }

  async register(email: string, password: string): Promise<{ id: string; email: string }> {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Registration failed (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    return await res.json();
  }
}

export const apiClient = new ApiClient();
