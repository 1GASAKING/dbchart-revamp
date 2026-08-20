import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { QueryResult, SchemaColumn } from "./database-driver";
import { BaseSQLDriver } from "./sql-driver";
import { normalizeConnectionError } from "../errors";

export class SQLiteDriver extends BaseSQLDriver {
  readonly databaseId = "sqlite";
  private _db: any;

  async connect(config: ConnectionConfig): Promise<void> {
    this._config = config;

    const Database = (await import("better-sqlite3")).default;
    this._db = new Database(config.filePath ?? config.connectionString ?? ":memory:");
    this.setConnected(true);
  }

  async disconnect(): Promise<void> {
    if (this._db) {
      this._db.close();
      this._db = undefined;
    }
    this.setConnected(false);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const Database = (await import("better-sqlite3")).default;
      const db = new Database(config.filePath ?? config.connectionString ?? ":memory:");
      db.prepare("SELECT 1").get();
      db.close();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      const normalized = normalizeConnectionError(err, config);
      return { success: false, message: normalized.message, details: normalized.details };
    }
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this._db){ throw new Error("Not connected");}
    const start = Date.now();

    const isSelect = /^\s*(SELECT|PRAGMA|WITH|EXPLAIN)/i.test(sql);
    let rows: Record<string, unknown>[] = [];
    let rowCount: number | undefined;

    if (isSelect) {
      rows = this._db.prepare(sql).all(...(params ?? [])) as Record<string, unknown>[];
    } else {
      const result = this._db.prepare(sql).run(...(params ?? []));
      rowCount = result.changes;
    }

    const elapsed = Date.now() - start;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return this.buildQueryResult(columns, rows, elapsed, rowCount);
  }

  async listTables(): Promise<string[]> {
    const result = await this.query(
      `SELECT name FROM sqlite_master 
       WHERE type IN ('table', 'view') 
       AND name NOT LIKE 'sqlite_%' 
       ORDER BY name`
    );
    return result.rows.map((r) => String(r.name));
  }

  async getTableColumns(table: string): Promise<SchemaColumn[]> {
    const result = await this.query(`PRAGMA table_info("${table}")`);
    return result.rows.map((r) => ({
      name: String(r.name),
      type: String(r.type),
      nullable: r.notnull !== 1,
      primaryKey: r.pk === 1,
      defaultValue: r.dflt_value ? String(r.dflt_value) : undefined,
    }));
  }
}