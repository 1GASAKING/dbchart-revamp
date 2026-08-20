# Database Client Support Matrix

This file tracks every client supported by DBChat, the connection method(s) each
uses, the authentication it requires, the endpoint/URL it talks to, and the
implementation status. Some clients can connect **multiple ways** (e.g. native
driver vs HTTP/REST) — both are listed.

## Status legend

| Mark | Meaning |
|------|---------|
| ✅ | Implemented — real connect + read/write driver |
| 🔗 | Alias — reuses a compatible base driver (e.g. Greenplum → PostgreSQL) |
| 🧪 | REST profile — read/write via `RestApiDriver` (Firebase, Supabase, Stripe) |
| 🌐 | Generic REST — basic HTTP fallback via `GenericHTTPDriver` |
| 📝 | Registered — connection fields defined, driver pending |

## Driver engine map

The unified interface `IDatabaseDriver` (`connect / disconnect / testConnection /
query / getSchema / listTables / getTableColumns / isConnected`) has these engines:

| Engine | databaseId | Handles |
|--------|-----------|---------|
| `PostgreSQLDriver` | `postgresql` | PostgreSQL + pg-compatible |
| `MySQLDriver` | `mysql` | MySQL + mysql-compatible |
| `SQLiteDriver` | `sqlite` | SQLite, files / :memory: |
| `MongoDBDriver` | `mongodb` | MongoDB + doc-compatible |
| `RedisDriver` | `redis` | Redis + valkey |
| `RestApiDriver` | `rest-api` | Firebase RTDB, Supabase (PostgREST), Stripe |
| `GenericHTTPDriver` | `generic-http` | any JSON HTTP API (raw path) |

---

## SQL Databases (21)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| PostgreSQL | Native (`pg`) | user + password (+SSL) | `host:5432` | ✅ |
| MySQL | Native (`mysql2`) | user + password | `host:3306` | ✅ |
| SQLite | Native (`better-sqlite3`) | none (file path) | local `.db` / `:memory:` | ✅ |
| SQL Server | Native (`mssql`) | user + password | `host:1433` | 🌐 (package installed, driver pending) |
| MongoDB | Native (`mongodb`) | user + password / URI | `host:27017` | ✅ |
| Redis | Native (`ioredis`) | password | `host:6379` | ✅ |
| MariaDB | MySQL-compatible | user + password | `host:3306` | 🔗 `mysql` |
| DuckDB | Native (`duckdb`) | none (file path) | local file | 📝 |
| Oracle | Native (`oracledb`) | user + password | `host:1521` | 📝 |
| ClickHouse | HTTP (`@clickhouse/client`) | user + password | `host:8123` | 📝 |
| Apache Derby | JDBC (`node-jdbc`) | user + password | dir/server/in-memory | 📝 |
| Dameng | JDBC (`dm-jdbc`) | user + password | `host:5236` | 📝 |
| Exasol | Native (`exasol-driver`) | user + password | `host:8563` | 📝 |
| Firebird | Native (`node-firebird`) | user + password | `host:3050` | 📝 |
| Greenplum | PostgreSQL-compatible | user + password | `host:5432` | 🔗 `postgresql` |
| H2 Database | JDBC (`node-jdbc`) | user + password | embedded/server/in-memory | 📝 |
| IBM DB2 | Native (`ibm_db`) | user + password | `host:50000` | 📝 |
| IBM i | ODBC (`odbc`) | user + password | `host:446` | 📝 |
| InfluxDB | HTTP (`@influxdata/influxdb-client`) | token | `host:8086` | 📝 |
| KingbaseES | PostgreSQL-compatible | user + password | `host:54321` | 🔗 `postgresql` |
| libSQL | Native (`@libsql/client`) | auth token (Turso) / file | `libsql://...` or file | 🔗 `sqlite` |
| Microsoft Access | ODBC (`odbc`) | user + password (optional) | local `.accdb` | 📝 |
| Netezza | PostgreSQL-compatible | user + password | `host:5480` | 🔗 `postgresql` |
| PGlite | Native (`@electric-sql/pglite`) | none | local / in-memory | 🔗 `postgresql` (partial) |
| QuestDB | PostgreSQL-compatible | user + password | `host:8812` | 🔗 `postgresql` |
| SAP ASE (Sybase) | Native (`tedious`) | user + password | `host:5000` | 📝 |
| SAP HANA | Native (`@sap/hana-client`) | user + password | `host:30015` | 📝 |
| StarRocks | MySQL-compatible | user + password | `host:9030` | 🔗 `mysql` |
| Teradata | Native (`teradata-nodejs-driver`) | user + password | `host:1025` | 📝 |
| TiDB | MySQL-compatible | user + password | `host:4000` | 🔗 `mysql` |
| Vertica | Native (`vertica-nodejs`) | user + password | `host:5433` | 📝 |

---

## NoSQL Databases (15)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Aerospike | Native (`aerospike`) | none/tls | `host:3000` | 📝 |
| Amazon DocumentDB | MongoDB-compatible | user + password | `host:27017` | 🔗 `mongodb` |
| Apache CouchDB | HTTP (`nano`) | user + password | `http://host:5984` | 📝 |
| Cassandra | Native (`cassandra-driver`) | user + password | `host:9042` | 📝 |
| Couchbase | Native (`couchbase`) | user + password | `host:8091` | 📝 |
| DynamoDB | AWS SDK (`@aws-sdk/client-dynamodb`) | access key + secret + region | `https://dynamodb.<region>.amazonaws.com` | 📝 |
| Elasticsearch | HTTP (`@elastic/elasticsearch`) | user + password / API key | `http://host:9200` | 🌐 |
| Firebase | HTTP REST (Realtime DB) | database URL (auth via token) | `https://{project}.firebaseio.com` | 🧪 |
| Memcached | Native (`memcached`) | none / SASL | `host:11211` | 📝 |
| OpenSearch | HTTP (`@opensearch-project/opensearch`) | user + password | `http://host:9200` | 🌐 |
| RavenDB | Native (`ravendb`) | cert / user + password | `host:8080` | 📝 |
| ScyllaDB | Cassandra-compatible | user + password | `host:9042` | 📝 |
| SurrealDB | Native (`surrealdb`) | user + password | `host:8000` | 📝 |
| TypeDB | Native (`typedb-driver`) | user + password | `host:1729` | 📝 |
| Valkey | Redis-compatible | password | `host:6379` | 🔗 `redis` |

---

## Data Warehouses (12)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Apache Doris | MySQL-compatible | user + password | `host:9030` | 🔗 `mysql` |
| Apache Druid | HTTP (`node-druid-query`) | none / basic | `http://host:8888` | 📝 |
| Apache Hive | Native (`hive-driver`) | user + password | `host:10000` | 📝 |
| Apache Impala | Native (`impala`) | user + password | `host:21050` | 📝 |
| Apache Pinot | HTTP (`pinot-client`) | none / basic | `http://host:8099` | 📝 |
| Athena | AWS SDK (`@aws-sdk/client-athena`) | access key + secret + region | `https://athena.<region>.amazonaws.com` | 📝 |
| BigQuery | Native (`@google-cloud/bigquery`) | service account JSON | `https://bigquery.googleapis.com` | 📝 |
| Databricks | HTTP (`@databricks/sql`) | token | `https://<host>/{http_path}` | 🌐 |
| Microsoft Fabric | MSSQL-compatible | user + password | `host:1433` | 🔗 `mssql`→`mysql` gap (pending) |
| Redshift | PostgreSQL-compatible | user + password | `host:5439` | 🔗 `postgresql` |
| Snowflake | Native (`snowflake-sdk`) | user + password + account | `https://<account>.snowflakecomputing.com` | 📝 |
| Trino | Native (`trino-client`) | user + password | `host:8080` | 📝 |

---

## Cloud Databases (10)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Azure SQL | MSSQL-compatible | user + password | `<server>.database.windows.net:1433` | 📝 |
| Azure Synapse | MSSQL-compatible | user + password | `<workspace>.sql.azuresynapse.net:1433` | 📝 |
| Bunny Database | MySQL-compatible | user + password | `host:3306` | 🔗 `mysql` |
| Cloudflare D1 | HTTP REST (`/query`) | account id + database id + API token | `https://api.cloudflare.com/client/v4/accounts/{acc}/d1/database/{db}/query` | 📝 |
| CockroachDB | PostgreSQL-compatible | user + password | `host:26257` | 🔗 `postgresql` |
| Google Spanner | Native (`@google-cloud/spanner`) | service account JSON | `https://spanner.googleapis.com` | 📝 |
| MotherDuck | HTTP / DuckDB-wasm | token | `https://motherduck.com` | 📝 |
| SingleStore | MySQL-compatible | user + password | `host:3306` | 🔗 `mysql` |
| Timescale | PostgreSQL-compatible | user + password | `host:5432` | 🔗 `postgresql` |
| YugabyteDB | PostgreSQL-compatible | user + password | `host:5433` | 🔗 `postgresql` |

---

## Lakehouses (3)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Cloudflare R2 SQL | HTTP REST | access key + secret | `https://api.cloudflare.com` | 📝 |
| DuckLake | Native (`duckdb`) | none + S3 creds | local file / object store | 📝 |
| Iceberg | Native (`@iceberg/core`) | catalog URI + cloud creds | catalog URI | 📝 |

---

## Application Databases (6)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Cube | HTTP (`@cubejs-client/core`) | API token | `https://<host>/cubejs-api` | 🌐 |
| Dataverse | HTTP REST | OAuth (client id/secret/tenant) | `https://<env>.api.crm.dynamics.com` | 🌐 |
| PostHog | HTTP REST | personal API key | `https://app.posthog.com` | 🌐 |
| Power BI Semantic Models | HTTP REST | OAuth client/secret/tenant | `https://api.powerbi.com` | 📝 |
| Salesforce | HTTP (`jsforce`) | OAuth client/secret + user/pass | `https://<org>.salesforce.com` | 🌐 |
| Stripe | HTTP REST | secret key (basic auth) | `https://api.stripe.com/v1` | 🧪 |

---

## File Formats (4)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Avro | Native (`avro-js`) | none | local file | 📝 |
| CSV | Native (`csv-parse`) | none | local file | 📝 |
| Excel | Native (`exceljs`) | none | local file | 📝 |
| Parquet | Native (`parquetjs`) | none | local file | 📝 |

---

## Streaming Databases (1)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| RisingWave | PostgreSQL-compatible | user + password | `host:4566` | 🔗 `postgresql` |

---

## Message Queues (2)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Apache Kafka | Native (`kafkajs`) | SASL user/pass (optional) + TLS | `broker1:9092,...` | 📝 |
| RabbitMQ | Native (`amqplib`) | user + password | `host:5672` | 📝 |

---

## Graph Databases (2)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Memgraph | Bolt (`neo4j-driver`) | user + password | `bolt://host:7687` | 📝 |
| Neo4j | Bolt (`neo4j-driver`) | user + password | `bolt://host:7687` | 📝 |

---

## Vector Databases (6)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| ChromaDB | HTTP REST | auth token (optional) | `http://host:8000` | 🌐 |
| LanceDB | Native (`@lancedb/lancedb`) | none (dir) | local dir | 📝 |
| Milvus | Native (`@zilliz/milvus2-sdk-node`) | user + password | `host:19530` | 📝 |
| Pinecone | HTTP REST | API key | `https://<index>-<project>.svc.<env>.pinecone.io` | 🌐 |
| Qdrant | HTTP REST | API key (optional) | `http://host:6333` | 🌐 |
| Weaviate | HTTP REST | API key (optional) | `http://host:8080` | 🌐 |

---

## Cloud Providers (7)

| Client | Conn method(s) | Auth | Endpoint / URL | Status |
|--------|----------------|------|----------------|--------|
| Aiven | HTTP REST | API token | `https://api.aiven.io` | 🌐 |
| Azure | HTTP REST / SDK | OAuth client/secret/tenant | `https://management.azure.com` | 🌐 |
| Cloudflare | HTTP REST | API token | `https://api.cloudflare.com` | 🌐 |
| Digital Ocean | HTTP REST | API token | `https://api.digitalocean.com` | 🌐 |
| Neon | HTTP (`@neondatabase/serverless`) | API key / connection string | `https://console.neon.tech` | 🌐 |
| Supabase | HTTP REST (PostgREST) | anon key / service role key | `https://<project>.supabase.co/rest/v1` | 🧪 |
| Turso | HTTP (`@libsql/client`) | auth token | `libsql://<db>.turso.io` | 🔗 `sqlite` (HTTP pending) |

---

## Implementation order (next up)

1. **Register `RestApiDriver`** + map `firebase`, `supabase`, `stripe` to it (currently only the profile logic exists; not wired into the factory yet).
2. **SQL Server** driver (`mssql` package is already installed).
3. **Elasticsearch / OpenSearch** drivers (`@elastic/elasticsearch` / opensearch).
4. **Neo4j** driver (`neo4j-driver`) — also unlocks Memgraph.
5. **Cassandra** driver (`cassandra-driver`) — also unlocks ScyllaDB.
6. **Data browser UI** — real schema tree + editable grid issuing SELECT/INSERT/UPDATE/DELETE against the active driver.