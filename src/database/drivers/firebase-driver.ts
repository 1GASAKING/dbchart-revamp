import axios from "axios";
import * as crypto from "crypto";
import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { DatabaseSchema, IDatabaseDriver, QueryResult, SchemaColumn, SchemaTable } from "./database-driver";

/**
 * Firebase specific driver.
 *
 * Supports three sub-sections exposed in the sidebar tree:
 *  1. Firestore        – collections + sampled fields (REST API using the
 *                        service account JSON to mint an OAuth2 access token).
 *  2. Realtime DB      – top-level paths (shallow REST call to databaseUrl).
 *  3. Views / Analytics – analytics-style views (simple static list; the
 *                        view opens the analytics dashboard in the webview).
 *
 * The REST-only approach keeps this driver SDK-free (firebase-admin is a
 * registered driver package but NOT a hard runtime dependency of the
 * extension, so we avoid bundling it).
 */
export class FirebaseDriver implements IDatabaseDriver {
  readonly databaseId = "firebase";
  private _config?: ConnectionConfig;
  private _projectId = "";
  private _databaseUrl = "";
  private _accessToken?: string;
  private _tokenExpiry = 0;

  // ── Public lifecycle (IDatabaseDriver) ─────────────────────────────
  async connect(config: ConnectionConfig): Promise<void> {
    this._config = config;
    this._projectId = (config.projectId ?? config.options?.projectId ?? "").toString();
    this._databaseUrl = String(
      config.databaseUrl ?? config.options?.databaseUrl ?? config.connectionString ?? ""
    ).replace(/\/+$/, "");

    if (!this._projectId) {
      throw new Error("Firebase Project ID is required. Provide it in the connection dialog.");
    }

    const result = await this.testConnection(config);
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  async disconnect(): Promise<void> {
    this._config = undefined;
    this._accessToken = undefined;
    this._tokenExpiry = 0;
  }

  isConnected(): boolean {
    return !!this._config;
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      // Firestore REST ping – reachable only with a valid access token, so this
      // also validates the service-account JSON.
      const token = await this._getAccessToken(config);
      await axios.get(
        `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
      );
      return { success: true, message: "Connected to Firebase successfully" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  // ── Section listing helpers (used by the sidebar tree) ─────────────

  /** List Firestore collection ids. */
  async listFirestoreCollections(): Promise<string[]> {
    const token = await this._getAccessToken();
    const res = await axios.get(
      `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    const documents = res.data?.documents ?? [];
    return documents
      .map((doc: { name: string }) => {
        // name: projects/{p}/databases/(default)/documents/{collectionId}/{docId}
        const parts = doc.name.split("/documents/")[1]?.split("/") ?? [];
        return parts[0];
      })
      .filter((name: string, i: number, arr: string[]) => arr.indexOf(name) === i)
      .sort();
  }

  /** List top-level Realtime Database paths (shallow). */
  async listRealtimePaths(): Promise<string[]> {
    const config = this._config!;
    if (!this._databaseUrl) { return []; }
    const headers = this._buildAuthHeaders(config);
    const res = await axios.get(`${this._databaseUrl}/.json?shallow=true`, { headers, timeout: 15000 });
    return Object.keys(res.data ?? {}).sort();
  }

  /**
   * List analytics "Views". These are lightweight analytics view definitions
   * that open the dashboard when clicked. We return a small default set so
   * the tree section is populated immediately; users can add their own later.
   */
  async listViews(): Promise<{ id: string; name: string; description: string }[]> {
    return [
      { id: "signups", name: "User Signups", description: "New user signups over time" },
      { id: "active-sessions", name: "Active Sessions", description: "Currently active user sessions" },
      { id: "revenue", name: "Revenue", description: "Revenue trend over time" },
      { id: "events", name: "Events", description: "Custom event volume" },
    ];
  }

  /** Sample a Firestore collection to infer its field schema. */
  async getFirestoreCollectionSchema(collectionId: string): Promise<SchemaColumn[]> {
    const token = await this._getAccessToken();
    const res = await axios.get(
      `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents/${collectionId}?pageSize=3`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    const docs = res.data?.documents ?? [];
    const fields = new Map<string, Set<string>>();
    for (const doc of docs) {
      const map = doc.fields ?? {};
      for (const key of Object.keys(map)) {
        const valueType = Object.keys(map[key])[0] ?? "string";
        if (!fields.has(key)) { fields.set(key, new Set()); }
        fields.get(key)!.add(valueType);
      }
    }
    return [...fields.entries()].map(([name, types]) => ({
      name,
      type: [...types].join("|").replace(/Value$/, ""),
      nullable: true,
      primaryKey: name === "id" || name === "__name__",
    }));
  }

  /** Build a DatabaseSchema from Firestore collections (sampled fields). */
  async getSchema(): Promise<DatabaseSchema> {
    const tables: SchemaTable[] = [];
    for (const collection of await this.listFirestoreCollections()) {
      tables.push({
        name: collection,
        type: "collection",
        columns: await this.getFirestoreCollectionSchema(collection),
      });
    }
    return { databaseName: this._projectId || "Firebase", tables, relationships: [] };
  }

  // ── Minimum IDatabaseDriver surface (kept for compatibility) ───────

  async query(sql: string, _params?: unknown[]): Promise<QueryResult> {
    // Firebase does not use SQL. The DB view routes raw REST commands here.
    return this._rawRestCall(sql);
  }

  async listTables(): Promise<string[]> {
    return this.listFirestoreCollections();
  }

  async getTableColumns(table: string): Promise<SchemaColumn[]> {
    return this.getFirestoreCollectionSchema(table);
  }

  private async _rawRestCall(command: string): Promise<QueryResult> {
    const config = this._config!;
    const parts = command.split(/\s+/);
    const method = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(parts[0].toUpperCase())
      ? parts.shift()!.toUpperCase()
      : "GET";
    const path = parts.join(" ").replace(/^\//, "");
    const url = this._databaseUrl + (path ? `/${path}` : "");
    const res = await axios.request({
      method,
      url,
      headers: this._buildAuthHeaders(config),
      timeout: 30000,
    });
    const data = res.data;
    if (Array.isArray(data)) {
      return { columns: data.length ? Object.keys(data[0]) : [], rows: data, executionTimeMs: 0, isResultSet: true };
    }
    return { columns: [], rows: [], executionTimeMs: 0, isResultSet: false, rawOutput: JSON.stringify(data, null, 2) };
  }

  // ── OAuth2 service-account token minting ───────────────────────────

  private async _getAccessToken(config?: ConnectionConfig): Promise<string> {
    const cfg = config ?? this._config;
    if (!cfg) { throw new Error("Not connected"); }

    // Reuse a cached, still-valid token.
    if (this._accessToken && Date.now() < this._tokenExpiry - 60_000) {
      return this._accessToken;
    }

    // serviceAccountJson may be stored directly (secret merge) or in options.
    const cfgRecord = cfg as unknown as Record<string, unknown>;
    const saRaw = cfgRecord.serviceAccountJson ?? cfg.options?.serviceAccountJson;
    if (!saRaw) {
      throw new Error("Firebase connection requires the Service Account JSON (for Firestore access).");
    }

    const sa = typeof saRaw === "string" ? JSON.parse(saRaw) : (saRaw as Record<string, string>);
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.database",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const b64 = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");
    const signingInput = `${b64(header)}.${b64(claim)}`;
    const signature = crypto.sign("sha256", Buffer.from(signingInput), sa.private_key);

    const form = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature.toString("base64url")}`,
    });

    const res = await axios.post("https://oauth2.googleapis.com/token", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });

    const token: string | undefined = res.data?.access_token;
    if (!token) {
      throw new Error("Failed to obtain Firebase OAuth2 access token.");
    }
    this._accessToken = token;
    this._tokenExpiry = Date.now() + (res.data?.expires_in ?? 3600) * 1000;
    return token;
  }

  private _buildAuthHeaders(config: ConnectionConfig): Record<string, string> {
    const token = this._accessToken ?? config.options?.authToken ?? config.options?.apiToken ?? config.password;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) { headers["Authorization"] = `Bearer ${String(token)}`; }
    return headers;
  }
}