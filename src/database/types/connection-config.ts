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
  /** Show this field only when another field matches a value (e.g. "mode" === "Server"). */
  dependsOn?: { field: string; value: string };
  /** Multiple values allowed (for checkbox groups). */
  multiple?: boolean;
}

export interface ConnectionConfig {
  name: string;
  databaseId: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  /** Connection mode for databases that support multiple modes (e.g. Derby: Directory/Server/In-Memory). */
  connectionMode?: string;
  /** File path for file-based databases. */
  filePath?: string;
  /** Role for databases that support roles (Development/Testing/Production). */
  role?: string;
  /** Post-connection SQL source type: inline or file. */
  postConnectionSqlSource?: "inline" | "file";
  /** Inline post-connection SQL script. */
  postConnectionSql?: string;
  /** File path to post-connection SQL script. */
  postConnectionSqlFile?: string;
  /** Progressive loading: load schema on demand. */
  progressiveLoading?: boolean;
  /** Prefetch full schema details in background. */
  prefetchDetails?: boolean;
  /** Batch size for schema fetching. */
  batchSize?: number;
  /** Cache TTL in days. */
  cacheTtlDays?: number;
  /** Extra JDBC/connection options (e.g. create=true). */
  options?: Record<string, unknown>;
  /** Store connection in workspace settings (shared via Git) vs global. */
  storeInWorkspace?: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
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