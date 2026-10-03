# 🚀 POST /api/v1/databases — Створення нової бази (Provisioning)
Приймає з фронтенду специфікацію на створення бази:
name: my-postgresql-db
engine_type: postgresql (версія 16)
cluster_name: aws-prod-k8s
values_yaml: згенерований values.yaml або CRD-маніфест.
password: згенерований пароль.
Створює запис у системній базі зі статусом Status: Provisioning.
Відправляє асинхронну задачу деплоєрам (helm-deployer або operator-service) для фізичного розгортання в Kubernetes.

# 📋 GET /api/v1/databases — Список активних баз (Installed Database List)
Повертає перелік усіх запущених баз даних для даного користувача чи команди.
Повертає реальний статус кожної бази: Running, Provisioning, Scaling, Stopped, Failed.

Живить таблицю на сторінці "Databases Catalog & Installed List" у UI.
# 🔍 GET /api/v1/databases/{id} — Повний паспорт конкретної бази
Віддає вичерпну інформацію про обрану базу:
Мережеву адресу (Host, Port, Namespace).
Виділені ресурси (CPU, RAM, Disk Storage).
Стрічки підключення (Connection Strings через db-credentials-service).
Статус бекапів та метрик.

# 📈 PATCH /api/v1/databases/{id}/scale — Day-2 Scaling (Масштабування на льоту)
Зміна обчислювальної потужності бази без простою:
Збільшення CPU (наприклад з 1 Core ➔ 4 Cores).
Збільшення RAM (наприклад з 4 GB ➔ 16 GB).
Збільшення дискового сховища (Disk Expansion, наприклад з 50 GB ➔ 200 GB).
Переводить статус у Scaling і відправляє команду деплоєру оновити Kubernetes StatefulSet.

# ⚙️ PUT /api/v1/databases/{id}/config — Parameter Editing (Тюнінг конфігів)
Зміна системних параметрів сутностей бази (postgresql.conf, redis.conf, clickhouse.xml):
Зміна max_connections, shared_buffers, maxmemory_policy тощо.
Передає оновлений values.yaml у деплоєр без перезапуску самого пода.

# ⏹️ POST /api/v1/databases/{id}/stop & /start — Призупинка та Запуск (Pause/Resume)
Дозволяє тимчасово зупинити Dev-базу (для економії грошей у хмарі на вихідні):
Переводить кількість реплік у K8s у replicas: 0 ➔ статус Stopped.
При виклику start піднімає replicas: 1 ➔ статус знову Running.

# 🗑️ DELETE /api/v1/databases/{id} — Safe Deletion (Безпечне видалення)
Безпечний процес знищення екземпляра:
Автоматично викликає backup-restore-service для створення Final Snapshot (фінального зніму даних).
Надсилає команду helm uninstall чи kubectl delete деплоєрам.
Звільняє виділені IP-адреси та DNS-записи.
Переводить статус бази у Status: Deleted.