-- Init script for PostgreSQL database
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE provider_db;
CREATE DATABASE provisioning_db;
CREATE DATABASE discovery_db;
CREATE DATABASE info_db;

CREATE USER auth WITH ENCRYPTED PASSWORD 'auth';
CREATE USER catalog WITH ENCRYPTED PASSWORD 'catalog';
CREATE USER provider WITH ENCRYPTED PASSWORD 'provider';
CREATE USER provisioning WITH ENCRYPTED PASSWORD 'provisioning';
CREATE USER discovery WITH ENCRYPTED PASSWORD 'discovery';
CREATE USER info WITH ENCRYPTED PASSWORD 'info';

-- Provide privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth;
GRANT ALL PRIVILEGES ON DATABASE catalog_db TO catalog;
GRANT ALL PRIVILEGES ON DATABASE provider_db TO provider;
GRANT ALL PRIVILEGES ON DATABASE provisioning_db TO provisioning;
GRANT ALL PRIVILEGES ON DATABASE discovery_db TO discovery;
GRANT ALL PRIVILEGES ON DATABASE info_db TO info;

\c auth_db
GRANT ALL ON SCHEMA public TO auth;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auth;

\c catalog_db
GRANT ALL ON SCHEMA public TO catalog;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO catalog;

\c provider_db
GRANT ALL ON SCHEMA public TO provider;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO provider;

\c provisioning_db
GRANT ALL ON SCHEMA public TO provisioning;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO provisioning;

\c discovery_db
GRANT ALL ON SCHEMA public TO discovery;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO discovery;


