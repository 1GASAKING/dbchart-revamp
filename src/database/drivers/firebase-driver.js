"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseDriver = exports.FirebaseRequestError = void 0;
exports.convertRtdbJsonToShape = convertRtdbJsonToShape;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../services/logging/logger");
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
 *
 * Error handling: every failed REST call is rethrown as a
 * {@link FirebaseRequestError} whose message is a short, human-readable
 * summary safe for toast notifications; the full technical detail (status,
 * response body) travels along in `detail` / `details` and is logged to the
 * DBCHAT output channel.
 */
/**
 * Error with a toast-friendly `message` plus structured context for
 * classification (missing instance vs. auth-gated vs. network) and the full
 * technical detail kept off the visible message.
 */
class FirebaseRequestError extends Error {
    /** HTTP status code, when the failure was an HTTP response. */
    httpStatus;
    /** Node network error code (ENOTFOUND, ETIMEDOUT, …), when applicable. */
    networkCode;
    /** Google's error text from the response body, when present. */
    googleMessage;
    /** Full technical detail for logs / error-details payloads. */
    detail;
    /** Consumed by the webview error handlers as extra context. */
    details;
    constructor(message, detail, httpStatus, networkCode, googleMessage) {
        super(message);
        this.name = "FirebaseRequestError";
        this.detail = detail;
        this.httpStatus = httpStatus;
        this.networkCode = networkCode;
        this.googleMessage = googleMessage;
        this.details = { detail, ...(httpStatus !== undefined ? { httpStatus } : {}), ...(networkCode ? { networkCode } : {}) };
    }
}
exports.FirebaseRequestError = FirebaseRequestError;
class FirebaseDriver {
    databaseId = "firebase";
    _config;
    _projectId = "";
    _databaseUrl = "";
    _accessToken;
    _tokenExpiry = 0;
    /** In-flight token minting request (single-flight guard). */
    _tokenPromise;
    /** Working RTDB base URL, resolved once per connection session. */
    _resolvedRtdbUrl;
    // ── Public lifecycle (IDatabaseDriver) ─────────────────────────────
    async connect(config) {
        this._config = config;
        this._projectId = (config.groupId ?? config.options?.groupId ?? "").toString();
        this._databaseUrl = String(config.databaseUrl ?? config.options?.databaseUrl ?? config.connectionString ?? "").replace(/\/+$/, "");
        if (!this._projectId) {
            throw new Error("Firebase Project ID is required. Provide it in the connection dialog.");
        }
        this._resolvedRtdbUrl = undefined;
        const result = await this.testConnection(config);
        if (!result.success) {
            throw new Error(result.message);
        }
    }
    async disconnect() {
        this._resolvedRtdbUrl = undefined;
        this._config = undefined;
        this._accessToken = undefined;
        this._tokenExpiry = 0;
        this._tokenPromise = undefined;
    }
    isConnected() {
        return !!this._config;
    }
    async testConnection(config) {
        // NOTE: the Firebase form stores the cloud *Project ID* under the legacy
        // config key "groupId" (labelled "Project ID" in the UI).
        const projectId = (config.groupId ?? config.options?.groupId ?? "").toString();
        const databaseUrl = String(config.databaseUrl ?? config.options?.databaseUrl ?? config.connectionString ?? "").replace(/\/+$/, "");
        const firestoreEnabled = this._isEnabled(config, "enableFirestore");
        const realtimeDbEnabled = this._isEnabled(config, "enableRealtimeDb");
        if (!firestoreEnabled && !realtimeDbEnabled) {
            return {
                success: false,
                message: "Both Cloud Firestore and Realtime Database are disabled for this connection. Enable at least one in the connection settings.",
            };
        }
        let token;
        try {
            token = await this._getAccessToken(config);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return { success: false, message: `Firebase authentication failed: ${message} — check the Service Account JSON.` };
        }
        // Shorten probe failures for the result message (full traces stay in the
        // DBCHAT output channel).
        const brief = (message) => (message.length > 220 ? `${message.slice(0, 220)}…` : message);
        const status = [];
        let reachable = false;
        // Each backend is probed independently — a project may use either or both,
        // and one failing must never block the other.
        if (firestoreEnabled) {
            try {
                await this._trace("probe-firestore", {
                    method: "GET",
                    url: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`,
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 8000,
                });
                status.push("Cloud Firestore ✓");
                reachable = true;
            }
            catch (err) {
                status.push(`Cloud Firestore ✗ (${brief(err instanceof Error ? err.message : String(err))})`);
            }
        }
        else {
            status.push("Cloud Firestore disabled");
        }
        if (realtimeDbEnabled) {
            // Try the user-entered URL first, then common instance naming patterns.
            const candidates = [];
            if (databaseUrl) {
                candidates.push(databaseUrl);
            }
            if (projectId) {
                candidates.push(`https://${projectId}-default-rtdb.firebaseio.com`);
                candidates.push(`https://${projectId}.firebaseio.com`);
            }
            const attempts = [];
            let rtdbOk = false;
            for (const base of [...new Set(candidates)]) {
                try {
                    await this._trace("probe-rtdb", {
                        method: "GET",
                        url: `${base}/.json?shallow=true`,
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 8000,
                    }, true);
                    status.push(`Realtime Database ✓ (${base})`);
                    reachable = true;
                    rtdbOk = true;
                    break;
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    attempts.push(`${base} → ${brief(message)}`);
                    // A definitively-missing instance (HTTP 404 / Firebase's
                    // {"error":"404 Not Found"}) or an unresolvable host means this
                    // candidate hosts nothing — try the next one. Any other failure
                    // (permission denied, rules, transient) means a real instance
                    // answered at that URL, so treat it as reachable/auth-gated.
                    if (isMissingInstanceError(err)) {
                        continue;
                    }
                    status.push(`Realtime Database ✓ auth-gated (${base})`);
                    reachable = true;
                    rtdbOk = true;
                    break;
                }
            }
            if (!rtdbOk) {
                status.push(`Realtime Database ✗ (${attempts.join(" | ") || "no candidate URL — set the Database URL"})`);
            }
        }
        else {
            status.push("Realtime Database disabled");
        }
        const summary = status.join(" · ");
        return reachable
            ? { success: true, message: `Connected to Firebase — ${summary}` }
            : { success: false, message: `Could not reach any Firebase backend — ${summary}` };
    }
    // ── Per-backend enable flags (user-toggled in connection settings) ──
    /** Read a boolean connection flag; defaults to true unless explicitly false/"false". */
    _isEnabled(config, key) {
        const raw = config[key] ?? config.options?.[key];
        if (raw === undefined || raw === null || raw === "") {
            return true;
        }
        return raw !== false && raw !== "false";
    }
    get _firestoreEnabled() {
        return this._config ? this._isEnabled(this._config, "enableFirestore") : true;
    }
    get _realtimeDbEnabled() {
        return this._config ? this._isEnabled(this._config, "enableRealtimeDb") : true;
    }
    /** Candidate RTDB base URLs, most likely first (built from the Project ID). */
    _rtdbUrlCandidates() {
        const urls = [];
        if (this._databaseUrl) {
            urls.push(this._databaseUrl);
        }
        if (this._projectId) {
            urls.push(`https://${this._projectId}-default-rtdb.firebaseio.com`);
            urls.push(`https://${this._projectId}.firebaseio.com`);
        }
        return [...new Set(urls)];
    }
    /**
     * Resolve the working RTDB base URL once per session. A configured URL
     * pointing at a non-existent instance is skipped: real instances answer
     * REST calls with data or Firebase JSON errors (e.g. permission denied),
     * while a missing one answers {"error": "404 Not Found"}.
     */
    async _resolveRtdbUrl() {
        if (this._resolvedRtdbUrl) {
            return this._resolvedRtdbUrl;
        }
        const headers = this._buildAuthHeaders(this._config);
        const attempts = [];
        for (const base of this._rtdbUrlCandidates()) {
            try {
                await this._trace("resolve-rtdb-url", {
                    method: "GET",
                    url: `${base}/.json?shallow=true`,
                    headers,
                    timeout: 10000,
                }, true);
                this._resolvedRtdbUrl = base;
                return base;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                attempts.push(`${base} → ${message.slice(0, 200)}`);
                if (isMissingInstanceError(err)) {
                    continue;
                }
                // Reached a real instance but something else failed (auth/rules) —
                // still the right URL to use.
                this._resolvedRtdbUrl = base;
                return base;
            }
        }
        throw new Error(`No Realtime Database instance found for project "${this._projectId}". Tried: ${attempts.join(" | ")}. Verify the Database URL (regional instances look like https://<project>-<region>.firebasedatabase.app).`);
    }
    // ── Section listing helpers (used by the sidebar tree) ─────────────
    /** List Firestore collection ids (paginated `listCollectionIds` RPC). */
    async listFirestoreCollections() {
        if (!this._firestoreEnabled) {
            throw new Error('Cloud Firestore is disabled for this connection (toggle "Enable Cloud Firestore" in its settings).');
        }
        const token = await this._getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        const ids = new Set();
        try {
            // Preferred: the dedicated RPC returns every top-level collection id
            // (including empty collections) and paginates properly.
            let pageToken;
            do {
                const res = await this._trace("list-firestore-collections", {
                    method: "POST",
                    url: `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents:listCollectionIds`,
                    headers,
                    data: { pageSize: 100, ...(pageToken ? { pageToken } : {}) },
                    timeout: 15000,
                });
                for (const id of res.data?.collectionIds ?? []) {
                    ids.add(String(id));
                }
                pageToken = res.data?.nextPageToken || undefined;
            } while (pageToken);
        }
        catch {
            // Fallback for restricted IAM setups: derive ids from a documents page.
            const res = await this._trace("list-firestore-collections-fallback", {
                method: "GET",
                url: `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents`,
                headers,
                timeout: 15000,
            });
            const documents = res.data?.documents ?? [];
            for (const doc of documents) {
                // name: projects/{p}/databases/(default)/documents/{collectionId}/{docId}
                const parts = doc.name.split("/documents/")[1]?.split("/") ?? [];
                if (parts[0]) {
                    ids.add(parts[0]);
                }
            }
        }
        return [...ids].sort();
    }
    /** List top-level Realtime Database paths (shallow). */
    async listRealtimePaths() {
        if (!this._realtimeDbEnabled) {
            throw new Error('Realtime Database is disabled for this connection (toggle "Enable Realtime Database" in its settings).');
        }
        const config = this._config;
        const baseUrl = await this._resolveRtdbUrl();
        const headers = this._buildAuthHeaders(config);
        const res = await this._trace("list-rtdb-paths", {
            method: "GET",
            url: `${baseUrl}/.json?shallow=true`,
            headers,
            timeout: 15000,
        }, true);
        return Object.keys(res.data ?? {}).sort();
    }
    /**
     * Lazy-load children of an RTDB path using a shallow request.
     *
     * NEVER fetches payload data — only key names. This avoids downloading
     * megabytes of nested data when exploring large nodes like /users.
     */
    async getRealtimeChildren(path, _limit = 50, _orderBy = "$key") {
        if (!this._realtimeDbEnabled) {
            throw new Error('Realtime Database is disabled for this connection (toggle "Enable Realtime Database" in its settings).');
        }
        const config = this._config;
        const baseUrl = await this._resolveRtdbUrl();
        const headers = this._buildAuthHeaders(config);
        const cleanPath = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("/");
        const urlPath = cleanPath ? `/${cleanPath}` : "";
        // shallow=true returns only the immediate child keys (as "true").
        const res = await this._trace("rtdb-children", {
            method: "GET",
            url: `${baseUrl}${urlPath}.json?shallow=true`,
            headers,
            timeout: 15000,
        }, true);
        const data = res.data ?? {};
        return Object.keys(data).map((key) => ({
            key,
            // With a shallow request we can't know if a key is a leaf or a branch,
            // so we mark it as "hasChildren: unknown" — the UI lazily expands.
            hasChildren: true,
        }));
    }
    /**
     * Get the actual (non-shallow) value of a single RTDB child path so the
     * DB viewer can render leaf values / objects in a table.
     */
    async getRealtimeNode(path) {
        if (!this._realtimeDbEnabled) {
            throw new Error('Realtime Database is disabled for this connection (toggle "Enable Realtime Database" in its settings).');
        }
        const config = this._config;
        const baseUrl = await this._resolveRtdbUrl();
        const headers = this._buildAuthHeaders(config);
        const cleanPath = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("/");
        const urlPath = cleanPath ? `/${cleanPath}` : "";
        const res = await this._trace("rtdb-node", {
            method: "GET",
            url: `${baseUrl}${urlPath}.json`,
            headers,
            timeout: 15000,
        }, true);
        const data = res.data;
        if (data && typeof data === "object") {
            return data;
        }
        return { value: data };
    }
    /**
     * Build a DatabaseSchema from a user-pinned RTDB path so the path can be
     * loaded into the canvas like any table (shallow child keys become columns).
     *
     * @param path the pinned path, e.g. "/users" or "/app_config".
     */
    async getSchemaForPath(path) {
        const children = await this.getRealtimeChildren(path, 50);
        return {
            databaseName: this._projectId || "Firebase",
            tables: [
                {
                    name: path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("_") || "root",
                    type: "collection",
                    columns: children.length
                        ? children.map((c) => ({
                            name: c.key,
                            type: "rtdb-child",
                            nullable: true,
                            primaryKey: false,
                        }))
                        : [{ name: "value", type: "string", nullable: true, primaryKey: false }],
                },
            ],
            relationships: [],
            metadata: { source: "user-path", path },
        };
    }
    /**
     * Convert the raw JSON under an RTDB path into a table-like shape:
     * the first `limit` records are sampled (bounded download — never the
     * whole tree), their keys are unioned into columns with inferred types,
     * and object/array values become nested children inferred recursively.
     */
    async getRealtimeTableShape(path, limit = 25) {
        const config = this._config;
        if (!this._realtimeDbEnabled) {
            throw new Error('Realtime Database is disabled for this connection (toggle "Enable Realtime Database" in its settings).');
        }
        const baseUrl = await this._resolveRtdbUrl();
        const headers = this._buildAuthHeaders(config);
        const cleanPath = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("/");
        const urlPath = cleanPath ? `/${cleanPath}` : "";
        // The REST docs require the quotes around "$key" to be URL-encoded.
        const query = `orderBy=${encodeURIComponent('"$key"')}&limitToFirst=${limit}`;
        let res;
        try {
            res = await this._trace("rtdb-table-shape", {
                method: "GET",
                url: `${baseUrl}${urlPath}.json?${query}`,
                headers,
                timeout: 15000,
            }, true);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Could not read "${path || "/"}" from the Realtime Database: ${message} — Hint: verify the Database URL points at the right instance and that the service account has Realtime Database access. Full details are in the DBCHAT output channel.`);
        }
        const data = res.data;
        return convertRtdbJsonToShape(path, data);
    }
    /**
     * List analytics "Views". These are lightweight analytics view definitions
     * that open the dashboard when clicked. We return a small default set so
     * the tree section is populated immediately; users can add their own later.
     */
    async listViews() {
        return [
            { id: "signups", name: "User Signups", description: "New user signups over time" },
            { id: "active-sessions", name: "Active Sessions", description: "Currently active user sessions" },
            { id: "revenue", name: "Revenue", description: "Revenue trend over time" },
            { id: "events", name: "Events", description: "Custom event volume" },
        ];
    }
    /** Sample a Firestore collection to infer its field schema. */
    async getFirestoreCollectionSchema(collectionId) {
        const token = await this._getAccessToken();
        const res = await this._trace("firestore-collection-schema", {
            method: "GET",
            url: `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents/${encodeURIComponent(collectionId)}?pageSize=20`,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
        });
        const docs = res.data?.documents ?? [];
        const fields = new Map();
        for (const doc of docs) {
            const map = doc.fields ?? {};
            for (const key of Object.keys(map)) {
                const valueType = Object.keys(map[key])[0] ?? "string";
                if (!fields.has(key)) {
                    fields.set(key, new Set());
                }
                fields.get(key).add(valueType);
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
    async getSchema() {
        const tables = [];
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
    async query(sql, _params) {
        // Firebase does not use SQL. The DB view routes raw REST commands here.
        return this._rawRestCall(sql);
    }
    async listTables() {
        return this.listFirestoreCollections();
    }
    async getTableColumns(table) {
        return this.getFirestoreCollectionSchema(table);
    }
    async _rawRestCall(command) {
        const config = this._config;
        const parts = command.split(/\s+/);
        const method = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(parts[0].toUpperCase())
            ? parts.shift().toUpperCase()
            : "GET";
        // The RTDB REST API only answers paths ending in ".json" — strip any the
        // user already typed, then always append it. Resolve the working base URL
        // so an empty/incorrect configured Database URL doesn't break queries.
        const path = parts.join(" ").replace(/^\/+|\/+$/g, "").replace(/\.json$/i, "");
        const baseUrl = await this._resolveRtdbUrl();
        const urlPath = path ? `/${path}.json` : "/.json";
        const res = await this._trace("query", {
            method,
            url: `${baseUrl}${urlPath}`,
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
    async _getAccessToken(config) {
        const cfg = config ?? this._config;
        if (!cfg) {
            throw new Error("Not connected");
        }
        // Reuse a cached, still-valid token.
        if (this._accessToken && Date.now() < this._tokenExpiry - 60_000) {
            return this._accessToken;
        }
        // Single-flight: concurrent callers share one minting request.
        if (!this._tokenPromise) {
            this._tokenPromise = this._mintAccessToken(cfg).finally(() => { this._tokenPromise = undefined; });
        }
        return this._tokenPromise;
    }
    async _mintAccessToken(cfg) {
        // serviceAccountJson may be stored directly (secret merge) or in options.
        const cfgRecord = cfg;
        const saRaw = cfgRecord.serviceAccountJson ?? cfg.options?.serviceAccountJson;
        if (!saRaw) {
            throw new Error("Firebase connection requires the Service Account JSON (for Firestore access).");
        }
        let sa;
        try {
            sa = typeof saRaw === "string" ? JSON.parse(saRaw) : { ...saRaw };
        }
        catch {
            throw new Error("The Service Account JSON is not valid JSON — paste the complete key file contents.");
        }
        if (!sa.client_email || typeof sa.private_key !== "string") {
            throw new Error("The Service Account JSON is missing client_email / private_key — it does not look like a Firebase service account key file.");
        }
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: "RS256", typ: "JWT" };
        const claim = {
            iss: sa.client_email,
            scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.database",
            aud: "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + 3600,
        };
        const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
        const signingInput = `${b64(header)}.${b64(claim)}`;
        // Keys pasted through JSON fields often carry escaped "\n" sequences —
        // normalize them or crypto.sign fails with a DECODER error.
        const privateKey = sa.private_key.replace(/\\n/g, "\n");
        let signature;
        try {
            signature = crypto.sign("sha256", Buffer.from(signingInput), privateKey);
        }
        catch {
            throw new Error("The service account private_key could not be read — re-download the key file in Google Cloud and paste it again.");
        }
        const form = new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: `${signingInput}.${signature.toString("base64url")}`,
        });
        let res;
        try {
            res = await axios_1.default.post("https://oauth2.googleapis.com/token", form.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 15000,
            });
        }
        catch (err) {
            throw new Error(describeAuthError(err));
        }
        const token = res.data?.access_token;
        if (!token) {
            throw new Error("Failed to obtain Firebase OAuth2 access token.");
        }
        this._accessToken = token;
        this._tokenExpiry = Date.now() + (res.data?.expires_in ?? 3600) * 1000;
        return token;
    }
    _buildAuthHeaders(config) {
        const token = this._accessToken ?? config.options?.authToken ?? config.options?.apiToken ?? config.password;
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${String(token)}`;
        }
        return headers;
    }
    // ── Diagnostics: every REST call is traced to the DBCHAT Output Channel ──
    /**
     * Perform an HTTP request with full tracing to the Output Channel
     * (method, URL, duration, status, error body) so connection problems like
     * 404/403 can be diagnosed from View → Output → "DBCHAT".
     */
    async _trace(label, config, logData = false) {
        const log = logger_1.Logger.getInstance();
        const method = (config.method ?? "GET").toUpperCase();
        const url = String(config.url ?? "");
        log.log(`[Firebase] → ${method} ${url} (${label})`);
        const startedAt = Date.now();
        try {
            const res = await axios_1.default.request(config);
            log.log(`[Firebase] ← ${res.status}${res.statusText ? ` ${res.statusText}` : ""} ${method} ${url} (${Date.now() - startedAt}ms)`);
            if (logData) {
                // Dump what we actually got back (capped) — invaluable when debugging
                // Realtime Database payloads, rules errors, or unexpected shapes.
                try {
                    const body = JSON.stringify(res.data);
                    const capped = body.length > 6000
                        ? `${body.slice(0, 6000)}… [truncated ${body.length - 6000} chars]`
                        : body;
                    log.log(`[Firebase] ← ${label} body (${body.length} chars): ${capped}`);
                }
                catch {
                    log.log(`[Firebase] ← ${label} body: <unserializable>`);
                }
            }
            return res;
        }
        catch (err) {
            const detail = describeHttpError(err);
            log.log(`[Firebase] ✖ ${method} ${url} failed after ${Date.now() - startedAt}ms\n          ${detail}`);
            throw toFirebaseRequestError(detail, err);
        }
    }
}
exports.FirebaseDriver = FirebaseDriver;
/** Maximum recursion depth when inferring nested column children. */
const RTDB_SHAPE_MAX_DEPTH = 4;
/**
 * Pure conversion of raw RTDB JSON into a {@link RealtimeTableShape} — no
 * I/O. Exported so the conversion pipeline can be smoke-tested without a
 * live database.
 *
 * - JSON array → records are its elements (collection).
 * - Object whose children are all objects → classic RTDB "list" pattern;
 *   each child becomes a record (the push-id keys are not kept as columns).
 * - Any other object → single-object node; its own fields become columns.
 * - Scalar / null / undefined → single `value` column with the raw type.
 */
function convertRtdbJsonToShape(path, data) {
    let isCollection = false;
    let records = [];
    if (Array.isArray(data)) {
        // JSON array → records are its elements.
        isCollection = true;
        records = data.filter((r) => r !== null && typeof r === "object");
    }
    else if (data !== null && typeof data === "object") {
        const entries = Object.entries(data);
        // Classic RTDB "list" pattern: every child is a record keyed by an id.
        if (entries.length > 0 && entries.every(([, v]) => v !== null && typeof v === "object")) {
            isCollection = true;
            records = entries.map(([, v]) => v);
        }
        else {
            // Single-object node: its own fields become the columns.
            records = [data];
        }
    }
    if (records.length === 0) {
        // Scalar or empty node → expose the raw value as a single column.
        const scalarColumns = data === undefined || data === null || typeof data === "object"
            ? []
            : [{ name: "value", type: inferScalarType(data), nested: false }];
        return {
            path,
            isCollection: false,
            sampledRecords: scalarColumns.length > 0 ? 1 : 0,
            columns: scalarColumns,
        };
    }
    return {
        path,
        isCollection,
        sampledRecords: records.length,
        columns: inferColumnsFromRecords(records, 0),
    };
}
/** Map a raw JSON value to a human-readable column type. */
function inferScalarType(value) {
    if (value === null) {
        return "null";
    }
    switch (typeof value) {
        case "number": return "number";
        case "boolean": return "boolean";
        case "string": return "string";
        default: return Array.isArray(value) ? "array" : "object";
    }
}
/**
 * Union the keys of the sampled records into alphabetically-sorted columns.
 * Values that are objects/arrays become `nested` columns whose `children`
 * are inferred recursively from those values (arrays are flattened into
 * index-keyed pseudo records so one walker handles both shapes).
 */
function inferColumnsFromRecords(records, depth) {
    const samples = new Map();
    for (const record of records) {
        for (const [key, value] of Object.entries(record ?? {})) {
            const bucket = samples.get(key);
            if (bucket) {
                bucket.push(value);
            }
            else {
                samples.set(key, [value]);
            }
        }
    }
    const columns = [];
    for (const [name, values] of samples) {
        const nonNull = values.filter((v) => v !== null && v !== undefined);
        const column = {
            name,
            type: nonNull.length > 0 ? inferScalarType(nonNull[0]) : "null",
            nested: false,
        };
        const hasNested = nonNull.some((v) => typeof v === "object");
        if (hasNested && depth < RTDB_SHAPE_MAX_DEPTH) {
            const childRecords = nonNull
                .filter((v) => typeof v === "object")
                .map((v) => (Array.isArray(v)
                ? Object.fromEntries(v.map((item, i) => [String(i), item]))
                : v));
            column.nested = true;
            column.children = inferColumnsFromRecords(childRecords, depth + 1);
        }
        columns.push(column);
    }
    return columns.sort((a, b) => a.name.localeCompare(b.name));
}
/**
 * Extract a human-readable diagnosis from an axios failure, including the
 * HTTP status and Google's error body (which states the real cause, e.g.
 * "Cloud Firestore API has not been used in project …").
 */
function describeHttpError(err) {
    if (!axios_1.default.isAxiosError(err)) {
        return err instanceof Error ? err.message : String(err);
    }
    const parts = [err.message];
    if (err.response) {
        parts.push(`HTTP ${err.response.status}${err.response.statusText ? ` ${err.response.statusText}` : ""}`);
        const data = err.response.data;
        if (data !== undefined && data !== null) {
            try {
                const body = typeof data === "string" ? data : JSON.stringify(data);
                parts.push(`body: ${body.slice(0, 600)}`);
            }
            catch {
                parts.push("body: <unserializable>");
            }
        }
    }
    else if (err.code) {
        parts.push(`code: ${err.code}`);
    }
    return parts.join(" | ");
}
/** Pull Google's human-readable error text out of a response body. */
function extractGoogleErrorMessage(data) {
    if (data === null || typeof data !== "object") {
        // RTDB answers plain strings like "404 Not Found" for missing instances.
        if (typeof data === "string") {
            const trimmed = data.trim();
            return trimmed.length > 0 && trimmed.length <= 120 ? trimmed : undefined;
        }
        return undefined;
    }
    const error = data.error;
    if (typeof error === "string" && error) {
        return error;
    } // RTDB style
    if (error && typeof error === "object") {
        const message = error.message; // Google APIs style
        if (typeof message === "string" && message) {
            return message;
        }
    }
    return undefined;
}
/** Short, toast-friendly message for a network-level failure. */
function describeNetworkError(code, fallback) {
    switch (code) {
        case "ENOTFOUND":
        case "EAI_AGAIN":
            return "Firebase server address not found — check the Database URL and your internet connection.";
        case "ECONNREFUSED":
            return "The Firebase server refused the connection.";
        case "ETIMEDOUT":
        case "ECONNABORTED":
            return "The request timed out — check your network and try again.";
        case "ECONNRESET":
            return "The connection was reset — please retry.";
        default:
            return `Network error reaching Firebase${code ? ` (${code})` : ""}: ${fallback}.`;
    }
}
/** Short, toast-friendly message for an HTTP-level failure. */
function describeHttpStatus(status, googleMessage) {
    switch (status) {
        case 400:
            return `Firebase rejected the request${googleMessage ? `: ${googleMessage}` : ""}.`;
        case 401:
            return "Firebase rejected the credentials — reconnect with a valid Service Account JSON.";
        case 403: {
            const apiHint = /has not been used/i.test(googleMessage ?? "")
                ? "Enable that API for the project in Google Cloud."
                : "Check the service account's IAM roles (Datastore User / Firebase Admin).";
            return `Access denied${googleMessage ? `: ${googleMessage}` : ""} — ${apiHint}`;
        }
        case 404:
            return "Not found — check the Project ID / Database URL (the backend may not exist for this project).";
        case 429:
            return "Rate limited by Firebase — wait a moment and try again.";
        default:
            if (status >= 500) {
                return `Firebase server error (HTTP ${status}) — try again shortly.`;
            }
            return `Request failed (HTTP ${status})${googleMessage ? `: ${googleMessage}` : ""}.`;
    }
}
/** Convert any thrown error into a {@link FirebaseRequestError}. */
function toFirebaseRequestError(detail, err) {
    if (axios_1.default.isAxiosError(err)) {
        if (!err.response) {
            return new FirebaseRequestError(describeNetworkError(err.code, err.message), detail, undefined, err.code);
        }
        const googleMessage = extractGoogleErrorMessage(err.response.data);
        return new FirebaseRequestError(describeHttpStatus(err.response.status, googleMessage), detail, err.response.status, err.code, googleMessage);
    }
    if (err instanceof FirebaseRequestError) {
        return err;
    }
    return new FirebaseRequestError(err instanceof Error ? err.message : detail, detail);
}
/**
 * True when a candidate RTDB URL definitively hosts no instance — HTTP 404
 * (including Firebase's {"error":"404 Not Found"} body), or the host could
 * not even be resolved (DNS) — i.e. move on to the next candidate rather
 * than treating it as valid-but-auth-gated.
 */
function isMissingInstanceError(err) {
    if (!(err instanceof FirebaseRequestError)) {
        return false;
    }
    if (err.httpStatus === 404) {
        return true;
    }
    if (/404/.test(err.googleMessage ?? "") && /not found/i.test(err.googleMessage ?? "")) {
        return true;
    }
    return err.networkCode === "ENOTFOUND" || err.networkCode === "EAI_AGAIN";
}
/** Friendly message when minting an OAuth2 token from the service account fails. */
function describeAuthError(err) {
    if (axios_1.default.isAxiosError(err) && err.response) {
        const data = err.response.data;
        const description = typeof data?.error_description === "string" ? data.error_description : undefined;
        const code = typeof data?.error === "string" ? data.error : undefined;
        let hint = "Unexpected response from Google's token endpoint.";
        if (err.response.status === 400 && code === "invalid_grant") {
            hint = "Check that the key JSON is complete and was not deleted/rotated in Google Cloud.";
        }
        else if (err.response.status === 400 && code === "invalid_client") {
            hint = "The client_email does not match a valid service account — re-check the pasted JSON.";
        }
        else if (err.response.status === 401 || err.response.status === 403) {
            hint = "Confirm the service account still exists and is allowed to sign in.";
        }
        return `Google rejected the service account login${description ? `: ${description}` : ""} — ${hint}`;
    }
    return err instanceof Error ? err.message : String(err);
}
//# sourceMappingURL=firebase-driver.js.map