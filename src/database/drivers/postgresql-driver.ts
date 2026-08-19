import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { QueryResult, SchemaColumn } from "./database-driver";
import { BaseSQLDriver } from "./sql-driver";

/**
 * PostgreSQL driver using the `pg` package.
 * Also serves as the base for PostgreSQL-compatible databases
 * (Greenplum, CockroachDB, Timescale, YugabyteDB, etc.).
 */
export class PostgreSQLDriver extends BaseSQLDriver {
  readonly databaseId = "postgresql";
  private _client: any;

  async connect(config: ConnectionConfig): Promise<void> {
    const resolved = this.resolveConfig(config);
    this._config = resolved;

    const { Client } = await import("pg");
    this._client = new Client({
      host: resolved.host,
      port: resolved.port,
      database: resolved.database,
      user: resolved.username,
      password: resolved.password,
      ssl: resolved.ssl ? { rejectUnauthorized: false } : undefined,
    });

    await this._client.connect();
    this.setConnected(true);
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.end();
      this._client = undefined;
    }
    this.setConnected(false);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    const resolved = this.resolveConfig(config);
    try {
      const { Client } = await import("pg");
      const client = new Client({
        host: resolved.host,
        port: resolved.port,
        database: resolved.database,
        user: resolved.username,
        password: resolved.password,
        ssl: resolved.ssl ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 5000,
      });
      await client.connect();
      await client.end();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this._client) {
      throw new Error("Not connected");
    }
    const start = Date.now();
    const result = await this._client.query(sql, params ?? []);
    const elapsed = Date.now() - start;

    const columns = result.fields?.map((f: any) => f.name) ?? [];
    const rows = result.rows ?? [];

    return this.buildQueryResult(columns, rows, elapsed, result.rowCount);
  }

  async listDatabases(): Promise<string[]> {
    const result = await this.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname");
    return result.rows.map((r) => String(r.datname));
  }

  async listTables(): Promise<string[]> {
    const result = await this.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    return result.rows.map((r) => String(r.table_name));
  }

  async getTableColumns(table: string): Promise<SchemaColumn[]> {
    const result = await this.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1 
       ORDER BY ordinal_position`,
      [table]
    );

    return result.rows.map((r) => ({
      name: String(r.column_name),
      type: String(r.data_type),
      nullable: r.is_nullable === "YES",
      defaultValue: r.column_default ? String(r.column_default) : undefined,
    }));
  }

  async getSchema() {
    const schema = await super.getSchema();

    // Get relationships
    const fkResult = await this.query(
      `SELECT
        tc.constraint_name,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = 'public'`
    );

    schema.relationships = fkResult.rows.map((r) => ({
      name: String(r.constraint_name),
      sourceTable: String(r.source_table ?? ""),
      sourceColumn: String(r.source_column),
      targetTable: String(r.target_table),
      targetColumn: String(r.target_column),
    }));

    return schema;
  }
}