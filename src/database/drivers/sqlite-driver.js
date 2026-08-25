"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteDriver = void 0;
const sql_driver_1 = require("./sql-driver");
const errors_1 = require("../errors");
class SQLiteDriver extends sql_driver_1.BaseSQLDriver {
    databaseId = "sqlite";
    _db;
    async connect(config) {
        this._config = config;
        const Database = (await import("better-sqlite3")).default;
        this._db = new Database(config.filePath ?? config.connectionString ?? ":memory:");
        this.setConnected(true);
    }
    async disconnect() {
        if (this._db) {
            this._db.close();
            this._db = undefined;
        }
        this.setConnected(false);
    }
    async testConnection(config) {
        try {
            const Database = (await import("better-sqlite3")).default;
            const db = new Database(config.filePath ?? config.connectionString ?? ":memory:");
            db.prepare("SELECT 1").get();
            db.close();
            return { success: true, message: "Connected successfully" };
        }
        catch (err) {
            const normalized = (0, errors_1.normalizeConnectionError)(err, config);
            return { success: false, message: normalized.message, details: normalized.details };
        }
    }
    async query(sql, params) {
        if (!this._db) {
            throw new Error("Not connected");
        }
        const start = Date.now();
        const isSelect = /^\s*(SELECT|PRAGMA|WITH|EXPLAIN)/i.test(sql);
        let rows = [];
        let rowCount;
        if (isSelect) {
            rows = this._db.prepare(sql).all(...(params ?? []));
        }
        else {
            const result = this._db.prepare(sql).run(...(params ?? []));
            rowCount = result.changes;
        }
        const elapsed = Date.now() - start;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return this.buildQueryResult(columns, rows, elapsed, rowCount);
    }
    async listTables() {
        const result = await this.query(`SELECT name FROM sqlite_master 
       WHERE type IN ('table', 'view') 
       AND name NOT LIKE 'sqlite_%' 
       ORDER BY name`);
        return result.rows.map((r) => String(r.name));
    }
    async getTableColumns(table) {
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
exports.SQLiteDriver = SQLiteDriver;
//# sourceMappingURL=sqlite-driver.js.map