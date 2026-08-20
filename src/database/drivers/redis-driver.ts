import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { DatabaseSchema, IDatabaseDriver, QueryResult, SchemaTable } from "./database-driver";
import { normalizeConnectionError } from "../errors";

export class RedisDriver implements IDatabaseDriver {
  readonly databaseId = "redis";
  private _client: any;
  private _config?: ConnectionConfig;

  async connect(config: ConnectionConfig): Promise<void> {
    const resolved = this.resolveConfig(config);
    this._config = resolved;

    const ioredis = await import("ioredis");
    const Redis = (ioredis as any).default ?? ioredis;
    this._client = new Redis({
      host: resolved.host,
      port: resolved.port,
      username: resolved.username || undefined,
      password: resolved.password || undefined,
      db: parseInt(resolved.database ?? "0", 10),
      tls: resolved.ssl ? {} : undefined,
    });

    await this._client.ping();
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = undefined;
    }
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    const resolved = this.resolveConfig(config);
    try {
      const ioredis = await import("ioredis");
      const Redis = (ioredis as any).default ?? ioredis;
      const client = new Redis({
        host: resolved.host,
        port: resolved.port,
        username: resolved.username || undefined,
        password: resolved.password || undefined,
        db: parseInt(resolved.database ?? "0", 10),
        tls: resolved.ssl ? {} : undefined,
        connectTimeout: 5000,
      });
      await client.ping();
      await client.quit();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      const normalized = normalizeConnectionError(err, resolved);
      return { success: false, message: normalized.message, details: normalized.details };
    }
  }

  async query(sql: string, _params?: unknown[]): Promise<QueryResult> {
    if (!this._client) {{throw new Error("Not connected");}}
    const start = Date.now();
    const parts = sql.trim().split(/\s+/);
    const command = parts[0].toUpperCase();
    const args = parts.slice(1);
    const result = await this._client.call(command, ...args);
    const elapsed = Date.now() - start;

    if (Array.isArray(result)) {
      const rows = result.map((item: unknown) => ({ value: item }));
      return { columns: ["value"], rows, executionTimeMs: elapsed, isResultSet: true };
    }

    return {
      columns: ["result"],
      rows: [{ result: result ?? null }],
      executionTimeMs: elapsed,
      isResultSet: result !== "OK",
      rawOutput: typeof result === "string" ? result : JSON.stringify(result),
    };
  }

  async getSchema(): Promise<DatabaseSchema> {
    if (!this._client) {throw new Error("Not connected");}
    const keys = await this._client.keys("*");
    const tables: SchemaTable[] = [];
    const typeMap = new Map<string, number>();

    for (const key of keys) {
      const type = await this._client.type(key);
      typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
    }

    for (const [type, count] of typeMap) {
      tables.push({
        name: type,
        type: "collection",
        columns: [
          { name: "key", type: "string", nullable: false },
          { name: "value", type: "string", nullable: true },
        ],
        rowCount: count,
      });
    }

    return {
      databaseName: this._config?.database ?? "0",
      tables,
      relationships: [],
      metadata: { totalKeys: keys.length },
    };
  }

  async listDatabases(): Promise<string[]> {
    const config = await this._client.config("GET", "databases");
    const count = config?.databases ? parseInt(config.databases, 10) : 16;
    return Array.from({ length: count }, (_, i) => String(i));
  }

  isConnected(): boolean {
    return !!this._client;
  }

  private resolveConfig(config: ConnectionConfig): ConnectionConfig {
    if (!config.connectionString) {return config;}
    try {
      const url = new URL(config.connectionString);
      return {
        ...config,
        host: config.host ?? url.hostname,
        port: config.port ?? (url.port ? parseInt(url.port, 10) : undefined),
        database: config.database ?? (url.pathname.replace(/^\//, "") || "0"),
        username: config.username ?? (url.username || undefined),
        password: config.password ?? (url.password || undefined),
        ssl: config.ssl ?? url.protocol === "rediss:",
      };
    } catch {
      return config;
    }
  }
}