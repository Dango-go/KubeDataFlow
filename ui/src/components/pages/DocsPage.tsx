import React, { useState } from 'react';
import { 
  BookOpen, 
  Rocket, 
  Cpu, 
  Database, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Cloud, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  Layers, 
  Server, 
  Terminal, 
  Sparkles, 
  Sliders, 
  FileText, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronRight
} from 'lucide-react';

interface DocTopic {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  badge?: string;
  readTime: string;
  summary: string;
  content: {
    overview: string;
    sections: {
      heading: string;
      description: string;
      codeSnippet?: {
        language: string;
        title: string;
        code: string;
      };
      callout?: {
        type: 'tip' | 'info' | 'warning';
        text: string;
      };
      bullets?: string[];
    }[];
  };
}

const DOC_TOPICS: DocTopic[] = [
  {
    id: 'quickstart',
    title: 'Quickstart & Connection Guide',
    category: 'GETTING STARTED',
    icon: Rocket,
    badge: 'Essential',
    readTime: '4 min read',
    summary: 'How to retrieve database credentials and connect from Python, Node.js, Go, Java, and CLI.',
    content: {
      overview: 'Once your database instance is provisioned in the cluster, KubeDataFlow generates secure Kubernetes Secrets containing connection endpoints, usernames, and passwords. This guide shows how to authenticate and connect seamlessly.',
      sections: [
        {
          heading: '1. Retrieving Credentials & Connection URI',
          description: 'Credentials are automatically stored in the database namespace as a Secret. You can retrieve standard environment variables directly from the UI or via kubectl:',
          codeSnippet: {
            language: 'bash',
            title: 'CLI - Get Database Secret via kubectl',
            code: `# Get connection string & password for your deployed database\nkubectl get secret prod-postgres-main-secret -n databases -o jsonpath="{.data.password}" | base64 --decode\n\n# Direct port-forward for local development\nkubectl port-forward svc/prod-postgres-main 5432:5432 -n databases`
          },
          callout: {
            type: 'tip',
            text: 'For in-cluster applications, use the internal DNS address: <database-name>.<namespace>.svc.cluster.local:5432'
          }
        },
        {
          heading: '2. Application Connection Examples',
          description: 'Connect to your database instance using standard drivers in your language of choice:',
          codeSnippet: {
            language: 'python',
            title: 'Python (psycopg2 / asyncpg / SQLAlchemy)',
            code: `import os\nimport psycopg2\n\n# Fetch connection URL from environment variables\nDATABASE_URL = os.getenv(\n    "DATABASE_URL", \n    "postgresql://postgres:SecretPassword123@prod-postgres-main.databases.svc.cluster.local:5432/main_db"\n)\n\nconn = psycopg2.connect(DATABASE_URL)\ncursor = conn.cursor()\ncursor.execute("SELECT version();")\nprint(f"Connected to: {cursor.fetchone()[0]}")`
          }
        },
        {
          heading: '3. Node.js & TypeScript Connection',
          description: 'Example using PostgreSQL Client (pg) or Prisma ORM:',
          codeSnippet: {
            language: 'javascript',
            title: 'Node.js / Express (pg pool)',
            code: `const { Pool } = require('pg');\n\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n  ssl: { rejectUnauthorized: false }\n});\n\nasync function testConnection() {\n  const res = await pool.query('SELECT NOW()');\n  console.log('Database time:', res.rows[0].now);\n}\ntestConnection();`
          }
        },
        {
          heading: '4. Direct CLI Connections',
          description: 'Quick one-liners to connect from your local terminal or debugging pod:',
          bullets: [
            'PostgreSQL: psql "postgresql://postgres:secret@localhost:5432/main_db"',
            'Redis: redis-cli -h localhost -p 6379 -a "secret_password"',
            'ClickHouse: clickhouse-client --host localhost --port 9000 --user default --password secret'
          ]
        }
      ]
    }
  },
  {
    id: 'engines-architecture',
    title: 'Database Engines & Architecture',
    category: 'ARCHITECTURE',
    icon: Database,
    readTime: '6 min read',
    summary: 'Architecture overview: Helm vs Kubernetes Operators, Bitnami, CloudNativePG, and ClickHouse.',
    content: {
      overview: 'KubeDataFlow provides a stateless orchestration plane that manages stateful database workloads in Kubernetes using battle-tested Helm charts and Cloud-Native Operators.',
      sections: [
        {
          heading: '1. Stateless Microservices Control Plane',
          description: 'The platform architecture consists of decoupled microservices:',
          bullets: [
            'operator-service: Dispatches reconciliation tasks to Helm deployers and cloud clusters.',
            'helm-deployer: Stateless worker executing helm upgrade --install with strict schema validation.',
            'db-provisioning-service: Manages database lifecycle, credentials injection, and PVC allocations.',
            'discovery-service: Scans clusters for live workloads, pods, and storage statuses.'
          ],
          callout: {
            type: 'info',
            text: 'All operational microservices remain stateless, enabling zero-downtime upgrades of the control plane.'
          }
        },
        {
          heading: '2. Supported Charts & Operators',
          description: 'Every database engine is paired with its optimized distribution:',
          bullets: [
            'PostgreSQL & MySQL: Bitnami Helm charts & CloudNativePG Operator for automated failover.',
            'Redis & KeyDB: High-availability sentinel and standalone in-memory caching.',
            'ClickHouse: ClickHouse Kubernetes Operator with native sharding and distributed tables.',
            'Vector Databases: Qdrant, Milvus, Chroma with optimized persistent volume SSD storage.'
          ]
        }
      ]
    }
  },
  {
    id: 'scaling-tuning',
    title: 'Live Scaling & Config Tuning Guide',
    category: 'OPERATIONS',
    icon: TrendingUp,
    badge: 'Popular',
    readTime: '5 min read',
    summary: 'How to vertically scale CPU/RAM and customize custom-values.yaml without downtime.',
    content: {
      overview: 'Adjust database resources and engine parameters dynamically as your application workload grows.',
      sections: [
        {
          heading: '1. Vertical Resource Scaling (CPU / Memory)',
          description: 'Change CPU millicores and RAM allocations in the Live Scaling panel. Kubernetes will execute a rolling update of the database pod to guarantee data availability:',
          bullets: [
            'Resource Requests: Minimum guaranteed compute resources scheduled on cluster worker nodes.',
            'Resource Limits: Hard upper ceiling to prevent rogue queries from starving neighboring workloads.',
            'PVC Storage Expansion: Storage can be expanded dynamically on supported CSI storage classes without unmounting volumes.'
          ],
          callout: {
            type: 'warning',
            text: 'When increasing shared_buffers or max_connections in PostgreSQL, always ensure your Pod RAM limit is at least 2.5x larger than shared_buffers to prevent OOMKilled events.'
          }
        },
        {
          heading: '2. Live custom-values.yaml Terminal Tuning',
          description: 'Use the built-in terminal editor to tune engine parameters directly:',
          codeSnippet: {
            language: 'yaml',
            title: 'Sample custom-values.yaml Tuning Block',
            code: `primary:\n  resources:\n    requests:\n      cpu: "1000m"\n      memory: "2048Mi"\n    limits:\n      cpu: "2000m"\n      memory: "4096Mi"\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 512MB\n    work_mem = 16MB\n    effective_cache_size = 1536MB`
          }
        }
      ]
    }
  },
  {
    id: 'telemetry-metrics',
    title: 'Telemetry & 14 Metrics Cheatsheet',
    category: 'MONITORING',
    icon: Activity,
    badge: '14 Channels',
    readTime: '7 min read',
    summary: 'Comprehensive cheat sheet for all 14 telemetry channels and healthy thresholds.',
    content: {
      overview: 'KubeDataFlow integrates with Prometheus and VictoriaMetrics to provide 14 unified and engine-adaptive telemetry channels.',
      sections: [
        {
          heading: '1. Compute & System Metrics',
          description: 'Foundational infrastructure metrics collected via Kubernetes cAdvisor:',
          bullets: [
            'CPU Utilization (%): Target < 70%. Spikes > 90% indicate unindexed full-table scans or CPU throttling.',
            'Memory Working Set (MB/GB): Target < 80% of limit. Values > 90% trigger critical OOM kill risk warnings.',
            'Disk I/O & IOPS Bandwidth: Measures disk read/write throughput. High queue depths indicate storage bottlenecks.'
          ]
        },
        {
          heading: '2. Database Engine & Query Health',
          description: 'DBMS internal indicators scraped from sidecar exporters:',
          bullets: [
            'Buffer Cache Hit Ratio (%): Healthy threshold is > 99%. Lower values mean queries are frequently reading slow disk blocks.',
            'Active Client Connections: Sockets in use vs pool limit. High values suggest connection leaks in application code.',
            'Query Latency (p95 / p99): Measures response time percentiles in milliseconds.',
            'Replication Lag (ms): Delay between primary node writes and standby replica synchronizations.',
            'Deadlocks & Aborts: Conflicting transactions resulting in rollbacks. Should remain 0.'
          ],
          callout: {
            type: 'tip',
            text: 'If Buffer Cache Hit Ratio drops below 95%, consider increasing Pod memory and shared_buffers in the Live Tuning editor.'
          }
        }
      ]
    }
  },
  {
    id: 'backups-recovery',
    title: 'Store, Backups & Disaster Recovery',
    category: 'DATA PROTECTION',
    icon: ShieldCheck,
    readTime: '5 min read',
    summary: 'Volume Snapshots, S3/GCS object storage backup targets, and Point-in-Time Recovery.',
    content: {
      overview: 'Data protection policies ensure automated backups, cold cloud archiving, and rapid disaster recovery.',
      sections: [
        {
          heading: '1. Backup Strategy Matrix',
          description: 'KubeDataFlow supports multiple levels of data backups:',
          bullets: [
            'CSI Volume Snapshots: Instant snapshot created at the block storage level (zero impact on query throughput).',
            'Scheduled Logical Dumps: Compressed pg_dump / redis RDB archives uploaded to S3, GCS, or MinIO buckets.',
            'Continuous WAL Archiving: Streaming write-ahead logs for Point-in-Time Recovery (PITR).'
          ]
        },
        {
          heading: '2. Restoration Workflow',
          description: 'Restore any database instance to a new clone or overwrite existing state with one click:',
          codeSnippet: {
            language: 'bash',
            title: 'CLI - On-demand Snapshot Trigger',
            code: `# Trigger on-demand backup for database\ncurl -X POST http://backup-service/api/v1/backups/trigger \\\n  -H "Content-Type: application/json" \\\n  -d '{"instance_id": "prod-postgres-main", "target": "s3-backup-vault"}'`
          }
        }
      ]
    }
  },
  {
    id: 'cloud-credentials',
    title: 'Cloud Credentials & K8s Clusters',
    category: 'INFRASTRUCTURE',
    icon: Cloud,
    readTime: '4 min read',
    summary: 'Managing AWS EKS, GCP GKE, Azure AKS, and on-premise Kubernetes cluster integrations.',
    content: {
      overview: 'Connect your cloud providers and Kubernetes clusters to enable multi-cloud database provisioning.',
      sections: [
        {
          heading: '1. Connecting a Kubernetes Cluster',
          description: 'To register a new cluster, navigate to the Cloud page and submit your cluster credentials:',
          bullets: [
            'AWS EKS: IAM Role ARN, Cluster Name, and Region.',
            'GCP GKE: Service Account JSON key with Kubernetes Engine Developer role.',
            'Azure AKS: Azure Client ID, Client Secret, and Subscription ID.',
            'On-Premise / Any K8s: Standard kubeconfig YAML file.'
          ],
          callout: {
            type: 'info',
            text: 'KubeDataFlow encrypts all cluster kubeconfig secrets using AES-256 GCM before storing them in provider_db.'
          }
        },
        {
          heading: '2. IAM Credentials & Users',
          description: 'Required IAM roles, access policies, and permission guidelines for cloud provider service accounts and API access keys.',
          bullets: [
            'AWS IAM User / Role permissions for cluster discovery, STS token generation, and EKS access entries.',
            'GCP Service Account roles for GKE cluster inspection and Workload Identity.',
            'Azure App Registration Service Principals for AKS cluster management.'
          ]
        }
      ]
    }
  }
];

// Provider-specific IAM Documentation details
interface ProviderIAMDoc {
  key: 'aws' | 'gcp' | 'azure' | 'digitalocean';
  name: string;
  fullName: string;
  badge: string;
  badgeStyle: string;
  borderStyle: string;
  accentColor: string;
  summary: string;
  requiredRoles: string[];
  policySnippet: {
    language: string;
    title: string;
    code: string;
  };
  setupSteps: string[];
  tips: string;
  actionAuthorizeAccessEntry?: {
    title: string;
    flow: string[];
    note?: string;
    methodsTitle?: string;
    methods: { name: string; desc: string }[];
  };
  actionGenerateToken?: {
    title: string;
    flow: string[];
    note?: string;
  };
}

const PROVIDER_IAM_DOCS: Record<string, ProviderIAMDoc> = {
  aws: {
    key: 'aws',
    name: 'AWS',
    fullName: 'Amazon Web Services (EKS)',
    badge: 'IAM User & Access Entry',
    badgeStyle: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    borderStyle: 'border-amber-500/40 hover:border-amber-400',
    accentColor: 'text-amber-400',
    summary: 'IAM permissions required for cluster discovery, STS caller identity verification, and automated EKS Access Entries.',
    requiredRoles: [
      'eks:ListClusters, eks:DescribeCluster (Cluster Discovery)',
      'sts:GetCallerIdentity (Bearer Token Generation)',
      'eks:CreateAccessEntry, eks:AssociateAccessPolicy (K8s API Authorization)',
      'AmazonEKSClusterAdminPolicy (In-Cluster Superuser Access)'
    ],
    policySnippet: {
      language: 'json',
      title: 'AWS IAM Policy (data-basik-eks-policy.json)',
      code: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "EKSClusterDiscovery",\n      "Effect": "Allow",\n      "Action": [\n        "eks:ListClusters",\n        "eks:DescribeCluster",\n        "eks:ListNodegroups",\n        "eks:DescribeNodegroup"\n      ],\n      "Resource": "*"\n    },\n    {\n      "Sid": "STSGetCallerIdentity",\n      "Effect": "Allow",\n      "Action": [\n        "sts:GetCallerIdentity"\n      ],\n      "Resource": "*"\n    },\n    {\n      "Sid": "EKSAccessEntryManagement",\n      "Effect": "Allow",\n      "Action": [\n        "eks:CreateAccessEntry",\n        "eks:DescribeAccessEntry",\n        "eks:ListAccessEntries",\n        "eks:AssociateAccessPolicy",\n        "eks:DisassociateAccessPolicy",\n        "eks:ListAssociatedAccessPolicies",\n        "eks:UpdateClusterConfig"\n      ],\n      "Resource": "*"\n    }\n  ]\n}`
    },
    setupSteps: [
      '1. Create an IAM User in AWS IAM Console and attach the policy above.',
      '2. Generate AWS Access Key ID and Secret Access Key.',
      '3. In KubeDataFlow Cloud page, add AWS Credentials using your Access Key and Secret Key.',
      '4. Click "Authorize Access Entry" on your discovered cluster to grant in-cluster permissions.'
    ],
    actionAuthorizeAccessEntry: {
      title: 'Action Authorised Access Entry',
      flow: [
        '1. POST request to create / authorize access entry.',
        '2. authorize_cluster_access(...) -> Locates cluster record in the database. Retrieves decrypted access keys by secret name.',
        '3. Selects the required scanner (AWSClusterScanner) and delegates execution.',
        '4. Initializes an aioboto3.Session populated with the corresponding credentials and target region name.',
        '5. Discovers caller IAM ARN via STS client (sts_client.get_caller_identity()).',
        '6. Fetches detailed cluster description from the EKS client (describe_cluster).',
        '7. Extracts cluster.accessConfig.authenticationMode and updates it to API_AND_CONFIG_MAP if needed.',
        '8. Creates an Access Entry (create_access_entry) for the IAM user corresponding to these credentials.',
        '9. Grants AmazonEKSClusterAdminPolicy permissions (associate_access_policy) to this IAM User on the target cluster.'
      ],
      note: 'If clicked again using the same (already used) credentials, the operation is idempotent and nothing will change.',
      methodsTitle: 'Methods from session',
      methods: [
        {
          name: 'sts_client.get_caller_identity()',
          desc: 'Retrieves caller IAM ARN via STS client using active credentials.'
        },
        {
          name: 'describe_cluster(name=cluster_name)',
          desc: 'Fetches cluster configuration details and inspects authentication mode.'
        },
        {
          name: 'create_access_entry(clusterName, principalArn)',
          desc: 'Creates the Access Entry in the EKS cluster for the specified IAM principal.'
        },
        {
          name: 'associate_access_policy(clusterName, principalArn, policyArn, accessScope)',
          desc: 'Grants and binds cluster admin access permissions.'
        }
      ]
    },
    actionGenerateToken: {
      title: 'Action Generate Token (For kubeconfig)',
      flow: [
        '1. POST request with cluster name, alias, api_server_url, and ca_cert_data.',
        '2. Retrieving credentials by this alias.',
        '3. Selecting the provider scanner.',
        '4. Provider function creates a temporary STS token using the AWS server URL address and IAM user secret key.',
        '5. Then this temporary token is inserted into the Bearer Authorization of the request. When creating the ServiceAccount, the temporary token is inserted into the request headers.',
        '6. As a result, REST-API requests are sent to create a ServiceAccount and a ClusterRoleBinding whose subjects field specifies the ServiceAccount name.',
        '7. A TokenRequest is sent to the endpoint cluster_url/api/v1/namespaces/namespace_name/serviceaccounts/serviceaccount_name/token.',
        '8. Kubernetes creates the token using a combination of Service Account name, namespace, SA uid, and token lifetime duration from the request; it inserts all these data into a JSON and signs the JSON with its private key.',
        '9. As a result, a cryptographic token is created.'
      ],
      note: 'When generating the token again, Kubernetes will issue a new token which will be updated in the cluster and in the database.'
    },
    tips: 'For production environments, ensure the authenticationMode of your EKS cluster is set to API_AND_CONFIG_MAP.'
  },
  gcp: {
    key: 'gcp',
    name: 'GCP',
    fullName: 'Google Cloud Platform (GKE)',
    badge: 'Service Account Key',
    badgeStyle: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    borderStyle: 'border-rose-500/40 hover:border-rose-400',
    accentColor: 'text-rose-400',
    summary: 'Service Account permissions required for GKE cluster inspection, credential validation, and Workload Identity deployment.',
    requiredRoles: [
      'roles/container.developer (Kubernetes Engine Developer)',
      'roles/container.viewer (GKE Cluster Inspection)',
      'roles/iam.serviceAccountUser (Service Account Delegation)'
    ],
    policySnippet: {
      language: 'bash',
      title: 'GCP Service Account & Key Generation (gcloud CLI)',
      code: `# 1. Create a dedicated Service Account\ngcloud iam service-accounts create kubedataflow-gke \\\n    --description="KubeDataFlow GKE Automation" \\\n    --display-name="kubedataflow-gke"\n\n# 2. Grant GKE Developer & Viewer roles\ngcloud projects add-iam-policy-binding YOUR_PROJECT_ID \\\n    --member="serviceAccount:kubedataflow-gke@YOUR_PROJECT_ID.iam.gserviceaccount.com" \\\n    --role="roles/container.developer"\n\n# 3. Export Service Account JSON Key\ngcloud iam service-accounts keys create gke-credentials.json \\\n    --iam-account=kubedataflow-gke@YOUR_PROJECT_ID.iam.gserviceaccount.com`
    },
    setupSteps: [
      '1. Create a Service Account in GCP IAM with Kubernetes Engine Developer permissions.',
      '2. Export the Service Account JSON Key file.',
      '3. In KubeDataFlow Cloud page, paste the contents of gke-credentials.json into the GCP Credentials tab.',
      '4. The discovery service will automatically list all GKE clusters in your GCP project.'
    ],
    tips: 'Ensure Google Kubernetes Engine API is enabled in your GCP project before importing credentials.'
  },
  azure: {
    key: 'azure',
    name: 'Azure',
    fullName: 'Microsoft Azure (AKS)',
    badge: 'Service Principal',
    badgeStyle: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    borderStyle: 'border-sky-500/40 hover:border-sky-400',
    accentColor: 'text-sky-400',
    summary: 'Azure App Registration & Service Principal roles required for AKS cluster management and token exchange.',
    requiredRoles: [
      'Azure Kubernetes Service Cluster User Role',
      'Azure Kubernetes Service RBAC Cluster Admin',
      'Reader (on Target Resource Group / Subscription)'
    ],
    policySnippet: {
      language: 'bash',
      title: 'Azure Service Principal Creation (Azure CLI)',
      code: `# 1. Create Service Principal for AKS management\naz ad sp create-for-rbac \\\n    --name "kubedataflow-aks-sp" \\\n    --role "Azure Kubernetes Service RBAC Cluster Admin" \\\n    --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RG"\n\n# Output will contain:\n# {\n#   "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",\n#   "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",\n#   "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"\n# }`
    },
    setupSteps: [
      '1. Run the az ad sp create-for-rbac command in Azure CLI.',
      '2. Copy the appId (Client ID), password (Client Secret), and tenant (Tenant ID).',
      '3. Add these credentials under the Azure tab in KubeDataFlow Cloud page.',
      '4. KubeDataFlow will query Azure Resource Manager and discover your AKS clusters.'
    ],
    tips: 'If using Azure RBAC with Microsoft Entra ID (Azure AD), ensure the Service Principal is added as an AKS Cluster Admin.'
  },
  digitalocean: {
    key: 'digitalocean',
    name: 'DigitalOcean',
    fullName: 'DigitalOcean Kubernetes (DOKS)',
    badge: 'API Token',
    badgeStyle: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    borderStyle: 'border-blue-500/40 hover:border-blue-400',
    accentColor: 'text-blue-400',
    summary: 'Personal Access Token permissions required for DOKS cluster listing, kubeconfig download, and node pool tracking.',
    requiredRoles: [
      'Read & Write Scope (Kubernetes Management)',
      'DigitalOcean API Token (dop_v1_...)'
    ],
    policySnippet: {
      language: 'bash',
      title: 'DigitalOcean API Token Authentication (doctl / cURL)',
      code: `# Test your Personal Access Token against DigitalOcean API\ncurl -X GET "https://api.digitalocean.com/v2/kubernetes/clusters" \\\n    -H "Authorization: Bearer dop_v1_your_token_here" \\\n    -H "Content-Type: application/json"`
    },
    setupSteps: [
      '1. Navigate to DigitalOcean Control Panel -> API -> Personal Access Tokens.',
      '2. Generate a new Token with "Read" and "Write" permissions.',
      '3. In KubeDataFlow Cloud page, submit your DO API token.',
      '4. DOKS clusters will be discovered automatically and populated with real-time health data.'
    ],
    tips: 'DigitalOcean API tokens expire based on your chosen expiration window; remember to refresh tokens when needed.'
  }
};

export const DocsPage: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippetTitle, setCopiedSnippetTitle] = useState<string | null>(null);

  // State for IAM Providers interactive modal / view
  const [selectedProviderKey, setSelectedProviderKey] = useState<'aws' | 'gcp' | 'azure' | 'digitalocean'>('aws');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);

  const activeTopic = DOC_TOPICS.find((t) => t.id === selectedTopicId) || DOC_TOPICS[0];
  const activeProviderDoc = PROVIDER_IAM_DOCS[selectedProviderKey];

  const handleCopyCode = (title: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetTitle(title);
    setTimeout(() => {
      setCopiedSnippetTitle(null);
    }, 2000);
  };

  const handleOpenProviderDoc = (key: 'aws' | 'gcp' | 'azure' | 'digitalocean') => {
    setSelectedProviderKey(key);
    setIsProviderModalOpen(true);
  };

  const filteredTopics = DOC_TOPICS.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const ActiveIcon = activeTopic.icon;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 text-brand-sky flex items-center justify-center font-bold border border-brand-sky/30 shadow-inner shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <span>Platform Documentation & Guides</span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/20">
                v1.0 Knowledge Base
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quickstart guides, engine architecture, live scaling, 14-channel telemetry, and disaster recovery.
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides & docs..."
            className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/50 focus:border-brand-sky text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 transition-all font-semibold"
          />
        </div>
      </div>

      {/* Main 2-Column Documentation Reader Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT TOPICS SIDEBAR NAV (col-span-4)                      */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-accent-darkBorder/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Guide Topics ({filteredTopics.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">Interactive</span>
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-blue/15 border-brand-sky ring-1 ring-brand-sky/40 shadow-lg shadow-brand-blue/10'
                      : 'bg-bg-main/70 border-accent-darkBorder hover:border-slate-700 hover:bg-bg-main'
                  }`}
                >
                  {/* Left Active Accent */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-sky rounded-r"></div>
                  )}

                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                    isSelected
                      ? 'bg-brand-blue/20 text-brand-sky border-brand-sky/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:text-white'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {topic.title}
                      </span>
                      {topic.badge && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-brand-blue/20 text-brand-sky border border-brand-sky/20 shrink-0">
                          {topic.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.summary}
                    </p>

                    <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center justify-between">
                      <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {topic.category}
                      </span>
                      <span>{topic.readTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTopics.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-accent-darkBorder rounded-xl">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No matching articles</p>
                <p className="text-[11px] text-slate-400">Try searching for other keywords</p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT ARTICLE CONTENT READER (col-span-8)                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 bg-bg-card border border-accent-darkBorder rounded-2xl p-7 shadow-xl space-y-7 relative overflow-hidden">
          
          {/* Article Header Banner */}
          <div className="border-b border-accent-darkBorder/80 pb-6">
            <div className="flex items-center gap-2.5 text-xs font-mono text-brand-sky mb-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-brand-blue/20 border border-brand-sky/30 uppercase font-bold text-[10px]">
                {activeTopic.category}
              </span>
              <span>•</span>
              <span className="text-slate-400">{activeTopic.readTime}</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {activeTopic.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTopic.summary}
                </p>
              </div>
            </div>

            {/* Overview text */}
            <div className="mt-5 p-4 rounded-xl bg-bg-main/80 border border-accent-darkBorder text-xs text-slate-300 leading-relaxed font-sans">
              {activeTopic.content.overview}
            </div>
          </div>

          {/* Article Sections List */}
          <div className="space-y-8">
            {activeTopic.content.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-sky"></span>
                  {section.heading}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {section.description}
                </p>

                {/* SPECIAL ENHANCEMENT: 4 Provider Selector Buttons inside Section 2 of cloud-credentials */}
                {activeTopic.id === 'cloud-credentials' && section.heading.includes('2. IAM Credentials & Users') && (
                  <div className="p-5 bg-bg-main/90 border border-accent-darkBorder rounded-2xl space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-brand-sky" />
                        Select Cloud Provider for IAM & Setup Guide
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Click to inspect docs</span>
                    </div>

                    {/* 4 Dynamic Provider Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { 
                          key: 'aws' as const, 
                          label: 'AWS EKS', 
                          tag: 'AWS',
                          tagClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
                          desc: 'IAM Policy & Access Entry', 
                          color: 'hover:border-amber-500/80 hover:bg-amber-950/20 text-amber-400' 
                        },
                        { 
                          key: 'gcp' as const, 
                          label: 'GCP GKE', 
                          tag: 'GCP',
                          tagClass: 'bg-gradient-to-r from-rose-400 via-white to-sky-400 bg-clip-text text-transparent bg-slate-900 border-slate-700 font-black',
                          desc: 'Service Account JSON', 
                          color: 'hover:border-rose-500/80 hover:bg-rose-950/20 text-rose-400' 
                        },
                        { 
                          key: 'azure' as const, 
                          label: 'Azure AKS', 
                          tag: 'Azure',
                          tagClass: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
                          desc: 'Service Principal & AD', 
                          color: 'hover:border-sky-500/80 hover:bg-sky-950/20 text-sky-400' 
                        },
                        { 
                          key: 'digitalocean' as const, 
                          label: 'DigitalOcean', 
                          tag: 'DigitalOcean',
                          tagClass: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
                          desc: 'API Personal Token', 
                          color: 'hover:border-blue-500/80 hover:bg-blue-950/20 text-blue-400' 
                        },
                      ].map((prov) => (
                        <button
                          key={prov.key}
                          type="button"
                          onClick={() => handleOpenProviderDoc(prov.key)}
                          className={`p-3.5 rounded-xl border bg-slate-900/90 border-slate-800 ${prov.color} transition-all text-left group flex flex-col justify-between space-y-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg border ${prov.tagClass}`}>
                              {prov.tag}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 group-hover:text-white">
                              Doc ↗
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block group-hover:text-brand-sky transition-colors">
                              {prov.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {prov.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Inline Quick Preview for selected provider */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-brand-sky shrink-0" />
                        <span>
                          Click any button above to open the complete, dedicated IAM configuration & setup guide for that cloud provider.
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenProviderDoc('aws')}
                        className="px-3 py-1.5 rounded-lg bg-brand-blue/30 text-brand-sky border border-brand-sky/40 font-bold hover:bg-brand-blue/50 transition-all text-xs shrink-0 flex items-center gap-1"
                      >
                        <span>Open AWS Guide</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bullets if any */}
                {section.bullets && (
                  <ul className="space-y-2 pl-2">
                    {section.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 text-brand-sky shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Callout alert if any */}
                {section.callout && (
                  <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    section.callout.type === 'tip'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : section.callout.type === 'warning'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                      : 'bg-brand-blue/10 border-brand-sky/30 text-sky-200'
                  }`}>
                    {section.callout.type === 'tip' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : section.callout.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-brand-sky shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{section.callout.text}</span>
                  </div>
                )}

                {/* Interactive Code Snippet */}
                {section.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-accent-darkBorder bg-slate-950 shadow-lg">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-brand-sky" />
                        {section.codeSnippet.title}
                      </span>

                      <button
                        onClick={() => handleCopyCode(section.codeSnippet!.title, section.codeSnippet!.code)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        {copiedSnippetTitle === section.codeSnippet.title ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed selection:bg-brand-blue selection:text-white">
                      <code>{section.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Footer Feedback Card */}
          <div className="p-4 bg-slate-900/60 border border-brand-sky/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 pt-4 mt-6">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-sky shrink-0" />
              <span>
                Have questions or need additional custom database chart templates?
              </span>
            </div>
            <a 
              href="https://github.com/Dango-go/platform-basik" 
              target="_blank" 
              rel="noreferrer"
              className="text-brand-sky font-semibold hover:underline flex items-center gap-1 text-[11px] shrink-0 font-mono"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* DYNAMIC POPUP MODAL FOR CLOUD PROVIDER IAM DOCUMENTATION */}
      {/* ======================================================== */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-bg-card border border-accent-darkBorder rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-accent-darkBorder pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`px-3 py-2 rounded-2xl bg-slate-900 border ${activeProviderDoc.borderStyle} shadow-inner flex items-center justify-center min-w-[56px]`}>
                  {selectedProviderKey === 'aws' && (
                    <span className="text-sm font-black font-mono text-amber-400">AWS</span>
                  )}
                  {selectedProviderKey === 'gcp' && (
                    <span className="text-sm font-black font-mono bg-gradient-to-r from-rose-400 via-white to-sky-400 bg-clip-text text-transparent">GCP</span>
                  )}
                  {selectedProviderKey === 'azure' && (
                    <span className="text-sm font-black font-mono text-sky-400">Azure</span>
                  )}
                  {selectedProviderKey === 'digitalocean' && (
                    <span className="text-sm font-black font-mono text-blue-400">DigitalOcean</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white">
                      {activeProviderDoc.fullName}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${activeProviderDoc.badgeStyle}`}>
                      {activeProviderDoc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeProviderDoc.summary}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsProviderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick Provider Switcher inside modal */}
            <div className="grid grid-cols-4 gap-2 bg-bg-main p-1.5 rounded-2xl border border-accent-darkBorder text-xs font-bold">
              {[
                { key: 'aws' as const, label: 'AWS' },
                { key: 'gcp' as const, label: 'GCP' },
                { key: 'azure' as const, label: 'Azure' },
                { key: 'digitalocean' as const, label: 'DigitalOcean' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedProviderKey(p.key)}
                  className={`py-2 rounded-xl transition-all ${
                    selectedProviderKey === p.key
                      ? 'bg-brand-blue text-white shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Required Roles & Permissions */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Required Permissions & Roles
              </span>
              <div className="grid grid-cols-1 gap-2">
                {activeProviderDoc.requiredRoles.map((role, rIdx) => (
                  <div key={rIdx} className="p-2.5 rounded-xl bg-bg-main/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code / Policy Snippet */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Policy & Setup Script
              </span>
              <div className="rounded-2xl overflow-hidden border border-accent-darkBorder bg-slate-950 shadow-xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-brand-sky" />
                    {activeProviderDoc.policySnippet.title}
                  </span>

                  <button
                    onClick={() => handleCopyCode(activeProviderDoc.policySnippet.title, activeProviderDoc.policySnippet.code)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {copiedSnippetTitle === activeProviderDoc.policySnippet.title ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Policy</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
                  <code>{activeProviderDoc.policySnippet.code}</code>
                </pre>
              </div>
            </div>

            {/* Setup Walkthrough Steps */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Step-by-Step Instructions
              </span>
              <div className="space-y-2">
                {activeProviderDoc.setupSteps.map((step, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-xl bg-bg-main/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Authorised Access Entry Sub-Block */}
            {activeProviderDoc.actionAuthorizeAccessEntry && (
              <div className="space-y-3 pt-1 border-t border-accent-darkBorder">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  {activeProviderDoc.actionAuthorizeAccessEntry.title}
                </span>

                <div className="space-y-2">
                  {activeProviderDoc.actionAuthorizeAccessEntry.flow.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-bg-main/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-mono text-[11px] text-slate-300">{step.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>

                {activeProviderDoc.actionAuthorizeAccessEntry.methods && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      {activeProviderDoc.actionAuthorizeAccessEntry.methodsTitle || 'Methods from session'}:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {activeProviderDoc.actionAuthorizeAccessEntry.methods.map((m, mIdx) => (
                        <div key={mIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <code className="text-amber-300 font-mono text-[11px] font-semibold">{m.name}</code>
                          <span className="text-slate-400 text-[11px]">{m.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeProviderDoc.actionAuthorizeAccessEntry.note && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-amber-200/90 font-sans flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{activeProviderDoc.actionAuthorizeAccessEntry.note}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Generate Token Sub-Block */}
            {activeProviderDoc.actionGenerateToken && (
              <div className="space-y-3 pt-3 border-t border-accent-darkBorder">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  {activeProviderDoc.actionGenerateToken.title}
                </span>

                <div className="space-y-2">
                  {activeProviderDoc.actionGenerateToken.flow.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-bg-main/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-mono text-[11px] text-slate-300">{step.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>

                {activeProviderDoc.actionGenerateToken.note && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-amber-200/90 font-sans flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{activeProviderDoc.actionGenerateToken.note}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tip Footer */}
            <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-sky/30 text-xs text-sky-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-brand-sky shrink-0 mt-0.5" />
              <span>{activeProviderDoc.tips}</span>
            </div>

            {/* Modal Bottom Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsProviderModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/80 text-white font-bold text-xs transition-all shadow-md"
              >
                Close Documentation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

