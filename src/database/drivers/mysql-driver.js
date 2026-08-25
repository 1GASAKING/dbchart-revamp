"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLDriver = void 0;
const sql_driver_1 = require("./sql-driver");
const errors_1 = require("../errors");
class MySQLDriver extends sql_driver_1.BaseSQLDriver {
    databaseId = "mysql";
    _pool;
    async connect(config) {
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
    async disconnect() {
        if (this._pool) {
            await this._pool.end();
            this._pool = undefined;
        }
        this.setConnected(false);
    }
    async testConnection(config) {
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
        }
        catch (err) {
            const normalized = (0, errors_1.normalizeConnectionError)(err, resolved);
            return { success: false, message: normalized.message, details: normalized.details };
        }
    }
    async query(sql, params) {
        if (!this._pool) {
            throw new Error("Not connected");
        }
        const start = Date.now();
        const [rows, fields] = await this._pool.query(sql, params ?? []);
        const elapsed = Date.now() - start;
        const columns = fields?.map((f) => f.name) ?? [];
        const rowArray = Array.isArray(rows) ? rows : [rows];
        return this.buildQueryResult(columns, rowArray, elapsed, rowArray.length);
    }
    async listDatabases() {
        const result = await this.query("SHOW DATABASES");
        return result.rows.map((r) => String(Object.values(r)[0]));
    }
    async listTables() {
        const result = await this.query("SHOW TABLES");
        return result.rows.map((r) => String(Object.values(r)[0]));
    }
    async getTableColumns(table) {
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
exports.MySQLDriver = MySQLDriver;
//# sourceMappingURL=mysql-driver.js.map