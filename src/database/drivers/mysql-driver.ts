import { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import { QueryResult, SchemaColumn } from "./database-driver";
import { BaseSQLDriver } from "./sql-driver";

export class MySQLDriver extends BaseSQLDriver {
  readonly databaseId = "mysql";
  private _pool: any;

  async connect(config: ConnectionConfig): Promise<void> {
    const resolved = this.resolveConfig(config);
    this._config = resolved;

    const mysql = await import("mysql2/promise");
    this._pool = mysql.createPool({
      host: resolved.host,
      port: resolved.port,
      database: resolved.database,
      user: resolved.username,
      password: resolved.password,
      ssl: resolved.ssl ? {} : undefined,
      connectionLimit: 5,
    });

    await this._pool.query("SELECT 1");
    this.setConnected(true);
  }

  async disconnect(): Promise<void> {
    if (this._pool) {
      await this._pool.end();
      this._pool = undefined;
    }
    this.setConnected(false);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    const resolved = this.resolveConfig(config);
    try {
      const mysql = await import("mysql2/promise");
      const conn = await mysql.createConnection({
        host: resolved.host,
        port: resolved.port,
        database: resolved.database,
        user: resolved.username,
        password: resolved.password,
        ssl: resolved.ssl ? {} : undefined,
        connectTimeout: 5000,
      });
      await conn.end();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this._pool) {throw new Error("Not connected");}
    const start = Date.now();
    const [rows, fields] = await this._pool.query(sql, params ?? []);
    const elapsed = Date.now() - start;

    const columns = (fields as any[])?.map((f) => f.name) ?? [];
    const rowArray = Array.isArray(rows) ? rows : [rows];

    return this.buildQueryResult(columns, rowArray as Record<string, unknown>[], elapsed, rowArray.length);
  }

  async listDatabases(): Promise<string[]> {
    const result = await this.query("SHOW DATABASES");
    return result.rows.map((r) => String(Object.values(r)[0]));
  }

  async listTables(): Promise<string[]> {
    const result = await this.query("SHOW TABLES");
    return result.rows.map((r) => String(Object.values(r)[0]));
  }

  async getTableColumns(table: string): Promise<SchemaColumn[]> {
    const result = await this.query(`SHOW COLUMNS FROM \`${table}\``);
    return result.rows.map((r) => ({
      name: String(r.Field),
      type: String(r.Type),
      nullable: r.Null === "YES",
      primaryKey: r.Key === "PRI",
      defaultValue: r.Default !== null ? String(r.Default) : undefined,
    }));
  }
}