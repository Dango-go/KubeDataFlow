# IDP Platform Architecture - Microservices & Infrastructure

## 1. Edge & Gateway
* **`ui-service`** — Web UI interface in the browser for interacting with the platform and managing database lifecycle.
* **`api-gateway`** — Single entry point web gateway (Reverse Proxy / Routing / Rate Limiting) that authenticates and routes requests from UI/CLI to the appropriate microservices.

## 2. Identity & Security
* **`auth-service`** — User management, sessions, roles, and issuance of access JWT tokens. +
* **`rbac-service`** — Fine-grained access control and permissions (RBAC/ABAC) for databases, clusters, and environments (Dev/Staging/Prod).
* **`vault-service`** — Secure storage (HashiCorp Vault) for storing cloud API keys and system secrets. +
* **`db-credentials-service`** — Automated generation, provision, and rotation of passwords, TLS certificates, and database connection strings.
* **`audit-service`** — Logging and immutable storage of all user actions and system events (Audit Log).

## 3. Cloud & Infrastructure
* **`provider-service`** — Cloud provider integration (AWS, GCP, DigitalOcean), connection verification, and secret forwarding to `vault-service`. +
* **`discovery-service`** — Automated scanning and discovery of active Kubernetes clusters in users' clouds. +
* **`dns-routing-service`** — Dynamic DNS record creation (Route53/Cloudflare/CoreDNS) and network access configuration (Ingress / NetworkPolicy / Service).
* **`resource-quota-service`** — Monitoring and limiting resource consumption (CPU, RAM, Storage, database count) per team and cluster.

## 4. Database Catalog, Provisioning & Day-2
// * **`db-catalog-service`** — Catalog of available database types (PostgreSQL, Redis, ClickHouse, MongoDB, etc.), versions, and configuration presets (Small/Medium/Large). 
* **`db-provisioning-service`** — Metadata and business logic for the database lifecycle (creation, parameter editing, Day-2 scaling, deletion).
* **`workflow-engine` / `task-worker`** — Asynchronous orchestrator for long-running tasks (DB deployment, backups, restore) supporting retries and rollbacks (Saga pattern).
* **`backup-restore-service`** — Management of backup schedules, snapshots, and data recovery for deployed databases (Point-in-Time Recovery).

## 5. Deployment Engine
* **`helm-deployer`** — Execution of atomic Helm commands (install, upgrade, rollback, uninstall) in target Kubernetes clusters. +
* **`operator-service`** — Management of Kubernetes Custom Resources (CRD) and integration with database operators (CloudNativePG, KubeDB, Percona Operator, etc.).

## 6. Observability, FinOps & Alerts
* **`metrics-monitoring-service`** — Collection and analysis of performance metrics for deployed databases (CPU, RAM, Disk IOPS, Connections) via Prometheus.
* **`cost-management-service`** — Cost calculation and analytics (FinOps), budget forecasting for maintaining each database in the cloud.
* **`notification-service`** — Centralized dispatch of notifications (Slack, Telegram, Email, Webhooks) regarding deployment statuses, backup failures, resource alerts, or budgets.

---

## Infrastructure Layer
* **Event Bus** *(NATS / RabbitMQ / Kafka)* — Event-driven messaging bus for asynchronous communication between microservices.
* **Vault Storage** *(HashiCorp Vault)* — Encrypted secrets storage.
* **Platform DB** *(PostgreSQL)* — Primary database for the IDP platform's internal metadata.



# FastAPI weekend-проєкти для DevOps резюме

Контекст: у тебе вже є важкі флагмани (IDP платформа, payment service, Loki/observability система, AI Gateway/RAG/Eval стек). Ці 1-3-денні проєкти — не заміна їм, а **breadth signal**: закривають класичні DevOps-піддомени, яких у поточному портфоліо нема (k8s admission control, GitOps, ChatOps, secrets lifecycle, cost, backup verification). Мета — не глибина (вона вже показана), а показати "розуміє весь DevOps-периметр, не тільки AI-інфраструктуру".

**Не роби всі 8.** Обери 2-3 максимум — інакше резюме розмивається кількістю замість якості. Топ-пік нижче позначені.

---

gitops-service	Генерує/оновлює Git manifests і керує Argo CD/ApplicationSet	Повноцінний GitOps lifecycle
policy-service	OPA/Kyverno policies для DB/namespace/cluster	Security + governance
database-health-service	Аналізує health PostgreSQL/Redis/Mongo/etc.	Реальний Day-2 management
schema-management-service	Міграції, schema versioning, drift detection	Сильна DB automation
database-maintenance-service	VACUUM, ANALYZE, REINDEX, compaction, maintenance windows	Автоматизація Day-2
disaster-recovery-service	Cross-cluster / cross-region recovery	Enterprise-level DR
snapshot-service	CSI/K8s/cloud snapshots	Швидкі backup/restore workflows
database-migration-service	Міграція DB між clusters/providers	Дуже сильна фіча для платформи
cluster-management-service	Реєстрація, lifecycle та health Kubernetes clusters	Multi-cluster control plane
scheduler-service	Maintenance windows, backup schedules, scaling schedules	Automation
secret-rotation-service	Автоматична rotation credentials/certs/API keys	Security automation
certificate-service	TLS lifecycle через cert-manager/PKI	mTLS/TLS automation
incident-service	Створює incidents з alerts, correlation, escalation	SRE-функціональність
recommendation-service	Рекомендує ресурси/parameters для DB	Optimization
capacity-planning-service	Прогноз CPU/RAM/storage growth	Predictive infrastructure
tenant-management-service	Organizations → Teams → Projects → Environments	Multi-tenancy
environment-service	Dev/Staging/Prod lifecycle	Environment abstraction
feature-flag-service	Feature flags для platform capabilities	Safe releases
compliance-service	Policy/compliance reports	Enterprise governance
job-history-service	Історія deployment/backup/migration jobs	Debugging + auditability




RabbitMQ
CloudBeaver або Bytebase
Jaeger або Grafana Tempo
MinIO
Redis


1️⃣ Секція: DATABASE SECURITY & CREDENTIALS SETUP
Перемикач режимів пассворда (Auto-Generated / Custom Password):
Відповідальний сервіс: vault-service (та auth-service)
Ендпоінт: POST /api/v1/vault/secrets або POST /api/v1/vault/encrypt
Що робить: При заповненні кастомного пароля або авто-генерації пароль безпечно шифрується через HashiCorp Vault і зберігається для подальшого інжектирування в K8s Secret під час ініціалізації БД.
2️⃣ Секція: TARGET HELM CHART REPOSITORY & NAME
Кнопка 📥 Install Chart / Pull Chart:
Відповідальний сервіс: helm-deployer
Ендпоінт: POST /api/v1/helm/pull
Payload: { "chart_repo_url": "...", "chart_name": "bitnami/postgresql", "chart_version": "15.5.2", "release_name": "my-postgres-db" }
Що робить: Завантажує (pull) з Helm-репозиторію Bitnami/Helm-Hub та розпаковує структуру чарту на сервері для редагування його файлів.
3️⃣ Секція: INTERACTIVE HELM CHART YAML EDITOR (VALUES.YAML)
У цій панелі розміщено 4 ключові кнопки:

Випадаючий список файлів (values.yaml, templates/..., Chart.yaml):

Відповідальний сервіс: helm-deployer
Ендпоінт: GET /api/v1/helm/file?release_name={name}&file_path={path}
Що робить: Зчитує вміст обраного конфігураційного файлу з розпакованого Helm-чарту і завантажує його в редактор коду.
Кнопка 📄 Add Custom File:

Відповідальний сервіс: helm-deployer
Ендпоінт: POST /api/v1/helm/file/create
Payload: { "release_name": "my-postgres-db", "file_name": "custom-values.yaml", "content": "..." }
Що робить: Створює додатковий кастомний custom-values.yaml файл поруч із дефолтним values.yaml.
Кнопка 💾 Save Chart:

Відповідальний сервіс: helm-deployer
Ендпоінт: PUT /api/v1/helm/file
Payload: { "release_name": "my-postgres-db", "file_path": "values.yaml", "content": "..." }
Що робить: Зберігає внесені зміни у values.yaml (або в будь-який інший обраний файл чарту) перед розгортанням.
Кнопка 🔄 Upgrade Chart:

Відповідальний сервіс: db-provisioning-service ➔ helm-deployer
Ендпоінт: PUT /api/v1/provisioning/{id}/config (або безпосередньо POST /api/v1/helm/apply)
Payload: { "cluster_id": "...", "namespace": "databases", "values_yaml": "..." }
Що робить: Для вже розгорнутого екземпляра викликає helm upgrade, прикладаючи новий values.yaml без перестворення StatefulSet.


Nginx + Let's Encrypt (Certbot) 
certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12d & wait $${!}; done;'"



services:
  frontend:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    # інші налаштування...


# конфігурація в нджинксу який у фронтенд контейнері
server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Роздача статики фронтенду
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Проксування запитів до бекенду у внутрішній мережі Docker
    location /api/ {
        proxy_pass http://backend-service-name:port/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}