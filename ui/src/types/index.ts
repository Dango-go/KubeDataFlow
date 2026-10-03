export type CategoryType = 'relational' | 'nosql' | 'vector' | 'inmemory' | 'timeseries';
export type CloudProviderType = 'aws' | 'azure' | 'digitalocean' | 'gcp';

export interface DatabaseCatalogItem {
  id: string;
  name: string;
  engine_type: string;
  category: CategoryType;
  icon_url: string;
  description: string;
  badge: string;
  versions: string[];
}

export interface DeployedDatabase {
  id: string;
  name: string;
  engine_type: string;
  version: string;
  status: 'running' | 'creating' | 'stopped' | 'failed';
  cluster_name: string;
  namespace: string;
  cpu_usage_m: number;
  memory_usage_mb: number;
  storage_gb: number;
  monthly_cost: number;
  created_at: string;
  values_yaml: string;
  deployment_type?: 'crd' | 'helm' | string;
}

export interface CloudCredential {
  id: string;
  name: string;
  provider: CloudProviderType;
  account_id: string;
  created_at: string;
  status: 'active' | 'error';
  // Provider specific details
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  azure_tenant_id?: string;
  azure_client_id?: string;
  azure_client_secret?: string;
  azure_subscription_id?: string;
  do_personal_access_token?: string;
  gcp_service_account_json?: string;
}

export interface K8sCluster {
  id: string;
  name: string;
  provider: 'AWS EKS' | 'Azure AKS' | 'GCP GKE' | 'DigitalOcean' | 'On-Premise';
  provider_alias?: string;
  region: string;
  nodes_count: number;
  status: 'active' | 'degraded';
  api_url: string;
  ca_cert_data?: string;
  token?: string;
  user_name?: string;
}

export interface DatabaseMetrics {
  db_id: string;
  cpu_usage: number[];
  memory_usage: number[];
  disk_io: number[];
  active_connections: number[];
  qps: number[];
  cache_hit_ratio: number[];
  slow_queries_duration: number[];
}
