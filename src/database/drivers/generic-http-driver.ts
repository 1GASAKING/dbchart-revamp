import axios from "axios";
import { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import { DatabaseSchema, IDatabaseDriver, QueryResult } from "./database-driver";

const HTTP_CLIENT = axios;

export class GenericHTTPDriver implements IDatabaseDriver {
  readonly databaseId = "generic-http";
  private _baseUrl = "";
  private _headers: Record<string, string> = {};
  private _config?: ConnectionConfig;
  private _connected = false;

  async connect(config: ConnectionConfig): Promise<void> {
    this._config = config;
    this._baseUrl = this.buildBaseUrl(config);
    this._headers = this.buildHeaders(config);
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._baseUrl = "";
    this._headers = {};
    this._connected = false;
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const baseUrl = this.buildBaseUrl(config);
      const headers = this.buildHeaders(config);
      await HTTP_CLIENT.get(baseUrl, { headers, timeout: 5000 });
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async query(sql: string, _params?: unknown[]): Promise<QueryResult> {
    if (!this._connected) throw new Error("Not connected");
    const start = Date.now();

    const parts = sql.trim().split(/\s+/);
    const method = ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(parts[0].toUpperCase())
      ? parts[0].toUpperCase()
      : "GET";
    const path = method === "GET" && parts[0] === "GET" ? parts.slice(1).join(" ") : sql.trim();

    try {
      const response = await HTTP_CLIENT.request({
        method,
        url: this._baseUrl + path,
        headers: this._headers,
        timeout: 30000,
      });
      const elapsed = Date.now() - start;
      const data = response.data;

      if (Array.isArray(data)) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        return { columns, rows: data, executionTimeMs: elapsed, isResultSet: true };
      }

      if (typeof data === "object" && data !== null) {
        const obj = data as Record<string, unknown>;
        const arrayKeys = Object.keys(obj).filter((k) => Array.isArray(obj[k]));
        if (arrayKeys.length === 1) {
          const arr = obj[arrayKeys[0]] as unknown[];
          const columns = arr.length > 0 ? Object.keys(arr[0] as Record<string, unknown>) : [];
          return { columns, rows: arr as Record<string, unknown>[], executionTimeMs: elapsed, isResultSet: true };
        }
        return {
          columns: Object.keys(obj),
          rows: [obj],
          executionTimeMs: elapsed,
          isResultSet: true,
          rawOutput: JSON.stringify(data, null, 2),
        };
      }

      return {
        columns: [],
        rows: [],
        executionTimeMs: elapsed,
        isResultSet: true,
        rawOutput: String(data),
      };
    } catch (err) {
      throw new Error(`REST request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getSchema(): Promise<DatabaseSchema> {
    return {
      databaseName: this._config?.name ?? "default",
      tables: [],
      relationships: [],
      metadata: { baseUrl: this._baseUrl, type: "REST API" },
    };
  }

  isConnected(): boolean {
    return this._connected;
  }

  private buildBaseUrl(config: ConnectionConfig): string {
    if (config.connectionString) return config.connectionString;
    if (config.options?.apiUrl) return String(config.options.apiUrl);
    if (config.options?.url) return String(config.options.url);
    const protocol = config.ssl ? "https" : "http";
    return `${protocol}://${config.host ?? "localhost"}:${config.port ?? 80}`;
  }

  private buildHeaders(config: ConnectionConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.password) {
      headers["Authorization"] = `Basic ${Buffer.from(`${config.username ?? ""}:${config.password}`).toString("base64")}`;
    }

    const token = config.options?.apiToken ?? config.options?.authToken ?? config.options?.apiKey ?? config.options?.secretKey;
    if (token) {
      headers["Authorization"] = `Bearer ${String(token)}`;
    }

    return headers;
  }
}