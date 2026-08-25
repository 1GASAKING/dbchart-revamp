"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const crypto_1 = require("crypto");
const registry_1 = require("./registry");
const errors_1 = require("./errors");
const STORAGE_KEY = "dbchat.savedConnections";
const WORKSPACE_KEY = "dbchat.workspaceConnections";
const GROUPS_KEY = "dbchat.groups";
const USER_PATHS_KEY = "dbchat.userPaths";
const DEFAULT_SENSITIVE = ["password", "apiToken", "secretKey", "authToken", "clientSecret", "serviceRoleKey", "anonKey", "apiKey"];
class ConnectionManager {
    static _instance;
    _context;
    _drivers = new Map();
    _activeConnectionId;
    _activeConfig;
    _savedConnections = [];
    _workspaceConnections = [];
    _groups = [];
    _userPaths = [];
    _listeners = new Set();
    constructor() { }
    static getInstance() {
        if (!ConnectionManager._instance) {
            ConnectionManager._instance = new ConnectionManager();
        }
        return ConnectionManager._instance;
    }
    initialize(context) {
        this._context = context;
        this._loadConnections();
    }
    /**
     * Subscribe to connection-list changes (create/update/delete).
     * Returns a handle with `dispose()` to unsubscribe.
     */
    onConnectionsChanged(listener) {
        this._listeners.add(listener);
        return {
            dispose: () => this._listeners.delete(listener),
        };
    }
    registerDriver(driver) {
        this._drivers.set(driver.databaseId, driver);
    }
    getDriver(databaseId) {
        return this._drivers.get(databaseId);
    }
    hasDriver(databaseId) {
        return this._drivers.has(databaseId);
    }
    getGroups() {
        return [...this._groups].sort((a, b) => a.createdAt - b.createdAt);
    }
    getGroup(groupId) {
        return this._groups.find((p) => p.id === groupId);
    }
    async createGroup(name, description) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        const group = {
            id: (0, crypto_1.randomUUID)(),
            name,
            description,
            createdAt: Date.now(),
        };
        this._groups.push(group);
        this._context.globalState.update(GROUPS_KEY, this._groups);
        this._notifyConnectionsChanged();
        return group;
    }
    async updateGroup(groupId, name, description) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        const group = this._groups.find((p) => p.id === groupId);
        if (!group) {
            throw new Error(`Group not found: ${groupId}`);
        }
        group.name = name;
        group.description = description;
        group.updatedAt = Date.now();
        this._context.globalState.update(GROUPS_KEY, this._groups);
        this._notifyConnectionsChanged();
        return group;
    }
    async copyConnection(connectionId) {
        const config = await this.getConnectionConfig(connectionId);
        if (!config) {
            throw new Error(`Connection not found: ${connectionId}`);
        }
        const name = `${config.name || "Connection"} (copy)`;
        return this.saveConnection({ ...config, name, createdAt: 0 });
    }
    async assignConnectionToGroup(connectionId, groupId) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        const conn = this._savedConnections.find((c) => c.id === connectionId)
            ?? this._workspaceConnections.find((c) => c.id === connectionId);
        if (!conn) {
            throw new Error(`Connection not found: ${connectionId}`);
        }
        conn.groupId = groupId;
        if (this._savedConnections.some((c) => c.id === connectionId)) {
            this._saveConnections();
        }
        else {
            this._saveWorkspaceConnections();
        }
        this._notifyConnectionsChanged();
        return conn;
    }
    async deleteGroup(groupId) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        this._groups = this._groups.filter((p) => p.id !== groupId);
        this._context.globalState.update(GROUPS_KEY, this._groups);
        // Orphan the connections that belonged to this group.
        for (const conn of this._savedConnections) {
            if (conn.groupId === groupId) {
                conn.groupId = undefined;
            }
        }
        this._saveConnections();
        this._notifyConnectionsChanged();
    }
    async saveConnection(config) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        const connectionId = (0, crypto_1.randomUUID)();
        const { sensitiveValues, nonSensitiveConfig } = this._separateSensitiveValues(config);
        if (Object.keys(sensitiveValues).length > 0) {
            await this._context.secrets.store(`dbchat.connection.${connectionId}`, JSON.stringify(sensitiveValues));
        }
        const saved = {
            id: connectionId,
            name: config.name,
            databaseId: config.databaseId,
            groupId: config.groupId,
            host: config.host,
            database: config.database,
            username: config.username,
            encryptedConfig: JSON.stringify(nonSensitiveConfig),
            ssl: config.ssl,
            storeInWorkspace: config.storeInWorkspace,
            createdAt: Date.now(),
        };
        if (config.storeInWorkspace) {
            this._workspaceConnections.push(saved);
            this._saveWorkspaceConnections();
        }
        else {
            this._savedConnections.push(saved);
            this._saveConnections();
        }
        this._notifyConnectionsChanged();
        return saved;
    }
    async updateConnection(id, config) {
        await this.deleteConnection(id);
        return this.saveConnection(config);
    }
    async deleteConnection(id) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        await this._context.secrets.delete(`dbchat.connection.${id}`);
        const globalIdx = this._savedConnections.findIndex((c) => c.id === id);
        if (globalIdx >= 0) {
            this._savedConnections.splice(globalIdx, 1);
            this._saveConnections();
        }
        const workspaceIdx = this._workspaceConnections.findIndex((c) => c.id === id);
        if (workspaceIdx >= 0) {
            this._workspaceConnections.splice(workspaceIdx, 1);
            this._saveWorkspaceConnections();
        }
        this._notifyConnectionsChanged();
    }
    async getAllConnections() {
        return [...this._savedConnections, ...this._workspaceConnections];
    }
    // ── User-pinned paths (custom table locations) ─────────────────────
    getUserPaths(connectionId) {
        if (!connectionId) {
            return [...this._userPaths];
        }
        return this._userPaths
            .filter((p) => p.connectionId === connectionId)
            .sort((a, b) => a.createdAt - b.createdAt);
    }
    async addUserPath(connectionId, path, label) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        const cleanPath = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("/");
        if (!cleanPath) {
            throw new Error("Path cannot be empty.");
        }
        const userPath = {
            id: (0, crypto_1.randomUUID)(),
            connectionId,
            path: `/${cleanPath}`,
            label: label ?? `/${cleanPath}`,
            createdAt: Date.now(),
        };
        this._userPaths.push(userPath);
        this._context.workspaceState.update(USER_PATHS_KEY, this._userPaths);
        this._notifyConnectionsChanged();
        return userPath;
    }
    async removeUserPath(id) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        this._userPaths = this._userPaths.filter((p) => p.id !== id);
        this._context.workspaceState.update(USER_PATHS_KEY, this._userPaths);
        this._notifyConnectionsChanged();
    }
    async updateUserPaths(paths) {
        if (!this._context) {
            throw new Error("ConnectionManager not initialized");
        }
        this._userPaths = paths;
        this._context.workspaceState.update(USER_PATHS_KEY, this._userPaths);
    }
    // ── Schema definition cache ─────────────────────────────────────────
    // A connection's purpose is to extract *definitions* (tables → columns →
    // datatypes). We persist those per connection so the UI can render
    // instantly (even offline / mid-refresh) while a background refresh runs.
    // Row data is NEVER cached here — viewing rows happens in the DB view.
    /** Cached tree of tables/sections for a connection (definitions only). */
    getSchemaCache(connectionId) {
        if (!this._context) {
            return undefined;
        }
        return this._context.globalState.get(`dbchat.schemaCache.${connectionId}`);
    }
    saveSchemaCache(connectionId, payload) {
        this._context?.globalState.update(`dbchat.schemaCache.${connectionId}`, payload);
    }
    /** Cached per-table definition (e.g. an inferred RTDB table shape). */
    getTableShapeCache(connectionId, path) {
        if (!this._context) {
            return undefined;
        }
        return this._context.globalState.get(`dbchat.shapeCache.${connectionId}`)?.[path];
    }
    saveTableShapeCache(connectionId, path, shape) {
        if (!this._context) {
            return;
        }
        const key = `dbchat.shapeCache.${connectionId}`;
        const map = this._context.globalState.get(key) ?? {};
        map[path] = shape;
        this._context.globalState.update(key, map);
    }
    async getConnectionConfig(connectionId) {
        if (!this._context) {
            return null;
        }
        const all = await this.getAllConnections();
        const saved = all.find((c) => c.id === connectionId);
        if (!saved) {
            return null;
        }
        const config = JSON.parse(saved.encryptedConfig);
        const secretJson = await this._context.secrets.get(`dbchat.connection.${connectionId}`);
        if (secretJson) {
            Object.assign(config, JSON.parse(secretJson));
        }
        return config;
    }
    async testConnection(config) {
        const driver = this.getDriver(config.databaseId);
        if (!driver) {
            return {
                success: false,
                message: `No driver registered for database type: ${config.databaseId}. Please install the driver package first.`,
            };
        }
        const startTime = Date.now();
        try {
            const result = await driver.testConnection(config);
            result.elapsedMs = Date.now() - startTime;
            return result;
        }
        catch (err) {
            const normalized = (0, errors_1.normalizeConnectionError)(err, config);
            return {
                success: false,
                message: normalized.message,
                details: normalized.details,
                elapsedMs: Date.now() - startTime,
            };
        }
    }
    async connect(configOrId) {
        let config;
        if (typeof configOrId === "string") {
            const loaded = await this.getConnectionConfig(configOrId);
            if (!loaded) {
                throw new Error(`Connection not found: ${configOrId}`);
            }
            config = loaded;
            this._activeConnectionId = configOrId;
        }
        else {
            config = configOrId;
        }
        const driver = this.getDriver(config.databaseId);
        if (!driver) {
            throw new Error(`No driver registered for database type: ${config.databaseId}`);
        }
        try {
            await driver.connect(config);
        }
        catch (err) {
            const normalized = (0, errors_1.normalizeConnectionError)(err, config);
            const error = new Error(normalized.message);
            error.details = normalized.details;
            throw error;
        }
        // Track the active config so query/getSchema work even when
        // connecting directly (not via a saved connection id).
        this._activeConfig = config;
        if (this._activeConnectionId) {
            await this._updateLastUsed(this._activeConnectionId);
        }
        return driver;
    }
    async disconnect() {
        const config = this._activeConfig ??
            (this._activeConnectionId ? await this.getConnectionConfig(this._activeConnectionId) : null);
        if (config) {
            const driver = this.getDriver(config.databaseId);
            if (driver) {
                await driver.disconnect();
            }
        }
        this._activeConnectionId = undefined;
        this._activeConfig = undefined;
    }
    getActiveConnectionId() {
        return this._activeConnectionId;
    }
    async getActiveConnection() {
        if (this._activeConfig) {
            return this._activeConfig;
        }
        if (this._activeConnectionId) {
            return this.getConnectionConfig(this._activeConnectionId);
        }
        return null;
    }
    async getActiveDriver() {
        const config = await this.getActiveConnection();
        if (!config) {
            return null;
        }
        return this.getDriver(config.databaseId) ?? null;
    }
    _separateSensitiveValues(config) {
        const definition = (0, registry_1.getDatabaseDefinition)(config.databaseId);
        const sensitiveKeys = new Set(DEFAULT_SENSITIVE);
        if (definition) {
            for (const field of definition.fields) {
                if (field.sensitive) {
                    sensitiveKeys.add(field.key);
                }
            }
        }
        const sensitiveValues = {};
        const nonSensitiveConfig = { ...config };
        const configRecord = config;
        const nonSensitiveRecord = nonSensitiveConfig;
        for (const key of sensitiveKeys) {
            const value = configRecord[key];
            if (value !== undefined && value !== null) {
                sensitiveValues[key] = value;
                delete nonSensitiveRecord[key];
            }
        }
        if (config.options) {
            const nonSensitiveOptions = { ...config.options };
            for (const key of Object.keys(config.options)) {
                const lower = key.toLowerCase();
                if (lower.includes("password") || lower.includes("secret") || lower.includes("token") || lower.includes("key")) {
                    sensitiveValues[`options.${key}`] = config.options[key];
                    delete nonSensitiveOptions[key];
                }
            }
            nonSensitiveConfig.options = nonSensitiveOptions;
        }
        return { sensitiveValues, nonSensitiveConfig };
    }
    _loadConnections() {
        this._savedConnections = this._context?.globalState.get(STORAGE_KEY, []) ?? [];
        this._workspaceConnections = this._context?.workspaceState.get(WORKSPACE_KEY, []) ?? [];
        this._groups = this._context?.globalState.get(GROUPS_KEY, []) ?? [];
        this._userPaths = this._context?.workspaceState.get(USER_PATHS_KEY, []) ?? [];
    }
    _saveConnections() {
        this._context?.globalState.update(STORAGE_KEY, this._savedConnections);
    }
    _saveWorkspaceConnections() {
        this._context?.workspaceState.update(WORKSPACE_KEY, this._workspaceConnections);
    }
    _notifyConnectionsChanged() {
        for (const listener of this._listeners) {
            listener();
        }
    }
    async _updateLastUsed(connectionId) {
        const globalConn = this._savedConnections.find((c) => c.id === connectionId);
        if (globalConn) {
            globalConn.lastUsed = Date.now();
            this._saveConnections();
            return;
        }
        const workspaceConn = this._workspaceConnections.find((c) => c.id === connectionId);
        if (workspaceConn) {
            workspaceConn.lastUsed = Date.now();
            this._saveWorkspaceConnections();
        }
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connection-manager.js.map