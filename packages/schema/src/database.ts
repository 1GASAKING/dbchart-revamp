/**
 * Shared database runtime types — the single source of truth used by both the
 * extension host (drivers, connection manager) and the webview UI
 * (schema tree, data grid, query editor).
 */

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  executionTimeMs: number;
  isResultSet: boolean;
  rawOutput?: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface SchemaTable {
  name: string;
  schema?: string;
  type: "table" | "view" | "collection" | "stream" | "queue";
  columns: SchemaColumn[];
  rowCount?: number;
  comment?: string;
}

export interface SchemaRelationship {
  name: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface DatabaseSchema {
  databaseName: string;
  tables: SchemaTable[];
  relationships: SchemaRelationship[];
  metadata?: Record<string, unknown>;
}

export const ConnectionFieldType = {
  TEXT: "text",
  PASSWORD: "password",
  NUMBER: "number",
  SELECT: "select",
  CHECKBOX: "checkbox",
  FILE: "file",
  TEXTAREA: "textarea",
  JSON: "json",
  URL: "url",
} as const;

export type ConnectionFieldType = (typeof ConnectionFieldType)[keyof typeof ConnectionFieldType];

export interface ConnectionFieldOption {
  label: string;
  value: string;
}

export interface ConnectionField {
  key: string;
  label: string;
  type: ConnectionFieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: readonly ConnectionFieldOption[];
  helpText?: string;
  sensitive?: boolean;
  group?: string;
  dependsOn?: { field: string; value: string };
  multiple?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ConnectionConfig {
  name: string;
  databaseId: string;
  projectId?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  connectionMode?: string;
  filePath?: string;
  role?: string;
  databaseUrl?: string;
  projectUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  apiKey?: string;
  secretKey?: string;
  apiToken?: string;
  authToken?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  postConnectionSqlSource?: "inline" | "file";
  postConnectionSql?: string;
  postConnectionSqlFile?: string;
  progressiveLoading?: boolean;
  prefetchDetails?: boolean;
  batchSize?: number;
  cacheTtlDays?: number;
  options?: Record<string, unknown>;
  storeInWorkspace?: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
  projectId?: string;
  host?: string;
  database?: string;
  username?: string;
  encryptedConfig: string;
  ssl?: boolean;
  storeInWorkspace?: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  elapsedMs?: number;
  details?: Record<string, unknown>;
}

export const DatabaseCategory = {
  SQL: "SQL",
  NOSQL: "NoSQL",
  DATA_WAREHOUSE: "Data Warehouse",
  CLOUD: "Cloud",
  LAKEHOUSE: "Lakehouse",
  APPLICATION: "Application",
  FILE_FORMAT: "File Format",
  STREAMING: "Streaming",
  MESSAGE_QUEUE: "Message Queue",
  GRAPH: "Graph",
  VECTOR: "Vector",
  CLOUD_PROVIDER: "Cloud Provider",
} as const;

export type DatabaseCategory = (typeof DatabaseCategory)[keyof typeof DatabaseCategory];

export const ConnectionMethod = {
  NATIVE: "Native Library",
  ODBC: "ODBC/JDBC",
  HTTP: "HTTP/REST API",
  AWS_SDK: "AWS SDK",
  GRAPHQL: "GraphQL",
  WEBHOOK: "Webhook",
} as const;

export type ConnectionMethod = (typeof ConnectionMethod)[keyof typeof ConnectionMethod];

export const QueryLanguage = {
  SQL: "SQL",
  MQL: "MongoDB Query Language",
  REDIS: "Redis Commands",
  CQL: "Cassandra Query Language",
  CYPHER: "Cypher (Neo4j)",
  ELASTICSEARCH_DSL: "Elasticsearch DSL",
  INFLUXQL: "InfluxQL",
  REST: "REST API",
  MEMCACHED: "Memcached Commands",
  GRAPHQL: "GraphQL",
} as const;

export type QueryLanguage = (typeof QueryLanguage)[keyof typeof QueryLanguage];

export interface DatabaseDefinition {
  id: string;
  name: string;
  category: DatabaseCategory;
  connectionMethod: ConnectionMethod;
  queryLanguage: QueryLanguage;
  preview?: boolean;
  driverPackage?: string;
  driverTypesPackage?: string;
  description: string;
  defaultPort?: number;
  fields: ConnectionField[];
  installed?: boolean;
  installHint?: string;
}

/** The unified driver interface every database adapter implements. */
export interface IDatabaseDriver {
  readonly databaseId: string;
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  listRows?(table: string, limit?: number): Promise<QueryResult>;
  insertRow?(table: string, values: Record<string, unknown>): Promise<{ id?: string }>;
  updateRow?(table: string, id: string, values: Record<string, unknown>): Promise<void>;
  deleteRow?(table: string, id: string): Promise<void>;
  getSchema(): Promise<DatabaseSchema>;
  listDatabases?(): Promise<string[]>;
  listTables?(): Promise<string[]>;
  getTableColumns?(table: string): Promise<SchemaColumn[]>;
  isConnected(): boolean;
}