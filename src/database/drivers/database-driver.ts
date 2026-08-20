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
  /** Read rows from a table/collection (used by the data browser). */
  listRows?(table: string, limit?: number): Promise<QueryResult>;
  /** Insert a new row. Returns the generated primary-key id when available. */
  insertRow?(table: string, values: Record<string, unknown>): Promise<{ id?: string }>;
  /** Update a row by its primary-key id. */
  updateRow?(table: string, id: string, values: Record<string, unknown>): Promise<void>;
  /** Delete a row by its primary-key id. */
  deleteRow?(table: string, id: string): Promise<void>;
  getSchema(): Promise<DatabaseSchema>;
  listDatabases?(): Promise<string[]>;
  listTables?(): Promise<string[]>;
  getTableColumns?(table: string): Promise<SchemaColumn[]>;
  isConnected(): boolean;
}