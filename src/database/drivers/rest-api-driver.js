"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestApiDriver = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * SDK-free REST driver for services that expose a JSON HTTP API
 * (Firebase Realtime Database, Supabase/PostgREST, Stripe).
 */
class RestApiDriver {
    databaseId = "rest-api";
    _config;
    _profile = "generic";
    _baseUrl = "";
    async connect(config) {
        this._config = config;
        this._profile = this.resolveProfile(config.databaseId);
        this._baseUrl = this.buildBaseUrl(config);
        const result = await this.testConnection(config);
        if (!result.success) {
            throw new Error(result.message);
        }
    }
    async disconnect() {
        this._config = undefined;
        this._baseUrl = "";
    }
    isConnected() {
        return !!this._config;
    }
    async testConnection(config) {
        const profile = this.resolveProfile(config.databaseId);
        const headers = this.buildHeaders(config, profile);
        let url = this.buildBaseUrl(config);
        if (profile === "stripe") {
            url += "/v1/balance";
        }
        else if (profile === "firebase-rtdb") {
            url += "/.json?shallow=true";
        }
        else if (profile === "supabase") {
            url += "/";
        }
        try {
            await axios_1.default.get(url, { headers, timeout: 8000 });
            return { success: true, message: "Connected successfully" };
        }
        catch (err) {
            const status = err?.response?.status;
            if (profile === "supabase" && status === 404) {
                return { success: true, message: "Connected successfully" };
            }
            return { success: false, message: err instanceof Error ? err.message : String(err) };
        }
    }
    async listTables() {
        const config = this._config;
        if (this._profile === "firebase-rtdb") {
            const res = await axios_1.default.get(`${this._baseUrl}/.json?shallow=true`, { headers: this.buildHeaders(config, "firebase-rtdb") });
            return Object.keys(res.data ?? {});
        }
        if (this._profile === "stripe") {
            return ["customers", "charges", "invoices", "products", "prices", "subscriptions", "balance"];
        }
        // supabase: tables not enumerable without catalog access
        return [];
    }
    async getTableColumns(table) {
        const rows = await this._listRawRows(table, 1);
        if (rows.length === 0) {
            return [];
        }
        return Object.keys(rows[0]).map((key) => ({
            name: key,
            type: typeof rows[0][key],
            nullable: true,
            primaryKey: key === "id",
        }));
    }
    async getSchema() {
        const config = this._config;
        const tables = [];
        for (const name of await this.listTables()) {
            tables.push({ name, type: "collection", columns: await this.getTableColumns(name) });
        }
        return { databaseName: config.database ?? config.name, tables, relationships: [] };
    }
    // ── Unified read/write (matches IDatabaseDriver CRUD) ─────────────
    async listRows(table, limit = 100) {
        const rows = await this._listRawRows(table, limit);
        const columns = rows.length ? Object.keys(rows[0]) : [];
        return { columns, rows: rows, executionTimeMs: 0, isResultSet: true };
    }
    async insertRow(table, values) {
        const id = await this._insertRaw(table, values);
        return { id };
    }
    async updateRow(table, id, values) {
        await this._updateRaw(table, id, values);
    }
    async deleteRow(table, id) {
        await this._deleteRaw(table, id);
    }
    async query(sql, _params) {
        const s = sql.trim();
        const mSelect = s.match(/^SELECT\s+\*\s+FROM\s+["']?(\w+)["']?(?:\s+LIMIT\s+(\d+))?/i);
        if (mSelect) {
            const limit = mSelect[2] ? parseInt(mSelect[2], 10) : 100;
            return this.listRows(mSelect[1], limit);
        }
        const mInsert = s.match(/^INSERT\s+INTO\s+["']?(\w+)["']?\s+(\{.*\})/i);
        if (mInsert) {
            const doc = JSON.parse(mInsert[2].replace(/'/g, '"'));
            const { id } = await this.insertRow(mInsert[1], doc);
            return { columns: [], rows: [], rowCount: 1, executionTimeMs: 0, isResultSet: false, rawOutput: JSON.stringify({ id }) };
        }
        const mUpdate = s.match(/^UPDATE\s+["']?(\w+)["']?\s+(\S+)\s+(\{.*\})/i);
        if (mUpdate) {
            const id = mUpdate[2].replace(/['"]/g, "");
            const patch = JSON.parse(mUpdate[3].replace(/'/g, '"'));
            await this.updateRow(mUpdate[1], id, patch);
            return { columns: [], rows: [], rowCount: 1, executionTimeMs: 0, isResultSet: false };
        }
        const mDelete = s.match(/^DELETE\s+FROM\s+["']?(\w+)["']?\s+WHERE\s+id\s*=\s*['"]?(\S+)['"]?/i);
        if (mDelete) {
            await this.deleteRow(mDelete[1], mDelete[2].replace(/['"]/g, ""));
            return { columns: [], rows: [], rowCount: 1, executionTimeMs: 0, isResultSet: false };
        }
        return this.rawRestCall(s);
    }
    // ── Profile-specific raw primitives ──────────────────────────────
    async _listRawRows(collection, limit) {
        const config = this._config;
        const headers = this.buildHeaders(config, this._profile);
        if (this._profile === "firebase-rtdb") {
            const res = await axios_1.default.get(`${this._baseUrl}/${collection}.json`, { headers });
            const data = res.data ?? {};
            return Object.entries(data).slice(0, limit).map(([id, value]) => ({ id, ...value }));
        }
        if (this._profile === "supabase") {
            const res = await axios_1.default.get(`${this._baseUrl}/${collection}?select=*&limit=${limit}`, { headers });
            const data = Array.isArray(res.data) ? res.data : [];
            return data.map((row, i) => ({ id: row.id ?? i, ...row }));
        }
        if (this._profile === "stripe") {
            const res = await axios_1.default.get(`${this._baseUrl}/v1/${collection}?limit=${limit}`, { headers });
            const data = res.data?.data ?? [];
            return data.map((row) => ({ id: row.id, ...row }));
        }
        throw new Error(`read not supported for profile ${this._profile}`);
    }
    async _insertRaw(collection, doc) {
        const config = this._config;
        const headers = this.buildHeaders(config, this._profile);
        if (this._profile === "firebase-rtdb") {
            const res = await axios_1.default.post(`${this._baseUrl}/${collection}.json`, doc, { headers });
            return res.data?.name ?? "?";
        }
        if (this._profile === "supabase") {
            const res = await axios_1.default.post(`${this._baseUrl}/${collection}`, doc, { headers, params: { select: "*" } });
            const row = Array.isArray(res.data) ? res.data[0] : res.data;
            return String(row?.id ?? "?");
        }
        throw new Error(`insert not supported for profile ${this._profile}`);
    }
    async _updateRaw(collection, id, patch) {
        const config = this._config;
        const headers = this.buildHeaders(config, this._profile);
        if (this._profile === "firebase-rtdb") {
            await axios_1.default.patch(`${this._baseUrl}/${collection}/${id}.json`, patch, { headers });
            return;
        }
        if (this._profile === "supabase") {
            await axios_1.default.patch(`${this._baseUrl}/${collection}?id=eq.${id}`, patch, { headers });
            return;
        }
        throw new Error(`update not supported for profile ${this._profile}`);
    }
    async _deleteRaw(collection, id) {
        const config = this._config;
        const headers = this.buildHeaders(config, this._profile);
        if (this._profile === "firebase-rtdb") {
            await axios_1.default.delete(`${this._baseUrl}/${collection}/${id}.json`, { headers });
            return;
        }
        if (this._profile === "supabase") {
            await axios_1.default.delete(`${this._baseUrl}/${collection}?id=eq.${id}`, { headers });
            return;
        }
        throw new Error(`delete not supported for profile ${this._profile}`);
    }
    async rawRestCall(command) {
        const config = this._config;
        const headers = this.buildHeaders(config, this._profile);
        const parts = command.split(/\s+/);
        const method = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(parts[0].toUpperCase())
            ? parts.shift().toUpperCase()
            : "GET";
        const path = parts.join(" ").replace(/^\//, "");
        const url = this.buildBaseUrl(config) + (path ? `/${path}` : "");
        const res = await axios_1.default.request({ method, url, headers, timeout: 30000 });
        const data = res.data;
        if (Array.isArray(data)) {
            return { columns: data.length ? Object.keys(data[0]) : [], rows: data, executionTimeMs: 0, isResultSet: true };
        }
        if (data && typeof data === "object" && Array.isArray(data.data)) {
            const rows = data.data;
            return { columns: rows.length ? Object.keys(rows[0]) : [], rows, executionTimeMs: 0, isResultSet: true };
        }
        return { columns: [], rows: [], executionTimeMs: 0, isResultSet: false, rawOutput: JSON.stringify(data, null, 2) };
    }
    // ── URL / headers / profile resolution ────────────────────────────
    resolveProfile(databaseId) {
        if (databaseId === "firebase") {
            return "firebase-rtdb";
        }
        if (databaseId === "supabase") {
            return "supabase";
        }
        if (databaseId === "stripe") {
            return "stripe";
        }
        return "generic";
    }
    buildBaseUrl(config) {
        const profile = this.resolveProfile(config.databaseId);
        if (profile === "firebase-rtdb") {
            const dbUrl = config.databaseUrl ?? config.options?.databaseUrl ?? config.connectionString;
            return String(dbUrl).replace(/\/+$/, "");
        }
        if (profile === "supabase") {
            const base = config.projectUrl ?? config.options?.projectUrl ?? config.connectionString;
            return `${String(base).replace(/\/+$/, "")}/rest/v1`;
        }
        if (profile === "stripe") {
            return "https://api.stripe.com";
        }
        return String(config.connectionString ?? `http://${config.host ?? "localhost"}`);
    }
    buildHeaders(config, profile) {
        const headers = { "Content-Type": "application/json" };
        if (profile === "supabase") {
            const key = (config.serviceRoleKey ?? config.anonKey ?? config.apiKey ?? config.password ?? "").toString();
            if (key) {
                headers["apikey"] = key;
                headers["Authorization"] = `Bearer ${key}`;
            }
            return headers;
        }
        if (profile === "stripe") {
            const secret = (config.secretKey ?? config.password ?? "").toString();
            if (secret) {
                headers["Authorization"] = `Basic ${Buffer.from(secret + ":").toString("base64")}`;
            }
            return headers;
        }
        const token = config.options?.authToken ?? config.options?.apiToken ?? config.options?.apiKey ?? config.password;
        if (token) {
            headers["Authorization"] = `Bearer ${String(token)}`;
        }
        return headers;
    }
}
exports.RestApiDriver = RestApiDriver;
//# sourceMappingURL=rest-api-driver.js.map