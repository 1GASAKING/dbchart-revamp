import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";

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

export interface IDatabaseDriver {
  readonly databaseId: string;
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  getSchema(): Promise<DatabaseSchema>;
  listDatabases?(): Promise<string[]>;
  listTables?(): Promise<string[]>;
  getTableColumns?(table: string): Promise<SchemaColumn[]>;
  isConnected(): boolean;
}