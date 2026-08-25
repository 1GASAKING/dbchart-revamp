"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSQLDriver = void 0;
class BaseSQLDriver {
    _connected = false;
    _config;
    isConnected() {
        return this._connected;
    }
    setConnected(value) {
        this._connected = value;
    }
    getConfig() {
        if (!this._config) {
            throw new Error("Not connected. Call connect() first.");
        }
        return this._config;
    }
    buildQueryResult(columns, rows, executionTimeMs, rowCount) {
        return { columns, rows, rowCount, executionTimeMs, isResultSet: columns.length > 0 };
    }
    async getSchema() {
        const config = this.getConfig();
        const tables = (await this.listTables?.()) ?? [];
        const schemaTables = [];
        for (const table of tables) {
            const columns = (await this.getTableColumns?.(table)) ?? [];
            schemaTables.push({ name: table, type: "table", columns });
        }
        return { databaseName: config.database ?? config.name, tables: schemaTables, relationships: [] };
    }
    async listTables() {
        return [];
    }
    async getTableColumns(_table) {
        return [];
    }
    async listDatabases() {
        return [];
    }
    parseConnectionString(connectionString) {
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
        }
        catch {
            return {};
        }
    }
    resolveConfig(config) {
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
exports.BaseSQLDriver = BaseSQLDriver;
//# sourceMappingURL=sql-driver.js.map