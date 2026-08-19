import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { DatabaseSchema, IDatabaseDriver, QueryResult, SchemaColumn, SchemaTable } from "./database-driver";

export abstract class BaseSQLDriver implements IDatabaseDriver {
  abstract readonly databaseId: string;
  protected _connected = false;
  protected _config?: ConnectionConfig;

  abstract connect(config: ConnectionConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  abstract query(sql: string, params?: unknown[]): Promise<QueryResult>;

  isConnected(): boolean {
    return this._connected;
  }

  protected setConnected(value: boolean): void {
    this._connected = value;
  }

  protected getConfig(): ConnectionConfig {
    if (!this._config) {
      throw new Error("Not connected. Call connect() first.");
    }
    return this._config;
  }

  protected buildQueryResult(
    columns: string[],
    rows: Record<string, unknown>[],
    executionTimeMs: number,
    rowCount?: number
  ): QueryResult {
    return { columns, rows, rowCount, executionTimeMs, isResultSet: columns.length > 0 };
  }

  async getSchema(): Promise<DatabaseSchema> {
    const config = this.getConfig();
    const tables = (await this.listTables?.()) ?? [];
    const schemaTables: SchemaTable[] = [];

    for (const table of tables) {
      const columns = (await this.getTableColumns?.(table)) ?? [];
      schemaTables.push({ name: table, type: "table", columns });
    }

    return { databaseName: config.database ?? config.name, tables: schemaTables, relationships: [] };
  }

  async listTables(): Promise<string[]> {
    return [];
  }

  async getTableColumns(_table: string): Promise<SchemaColumn[]> {
    return [];
  }

  async listDatabases(): Promise<string[]> {
    return [];
  }

  protected parseConnectionString(connectionString: string): Partial<ConnectionConfig> {
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : undefined,
        database: url.pathname.replace(/^\//, ""),
        username: url.username || undefined,
        password: url.password || undefined,
        ssl: url.searchParams.get("ssl") === "true" || url.searchParams.get("sslmode") === "require",
      };
    } catch {
      return {};
    }
  }

  protected resolveConfig(config: ConnectionConfig): ConnectionConfig {
    if (!config.connectionString) {
      return config;
    }
    const parsed = this.parseConnectionString(config.connectionString);
    return {
      ...config,
      host: config.host ?? parsed.host,
      port: config.port ?? parsed.port,
      database: config.database ?? parsed.database,
      username: config.username ?? parsed.username,
      password: config.password ?? parsed.password,
      ssl: config.ssl ?? parsed.ssl,
    };
  }
}