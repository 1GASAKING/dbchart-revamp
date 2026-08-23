import * as vscode from "vscode";
import { randomUUID } from "crypto";
import type { ConnectionConfig, SavedConnection } from "./types/connection-config";
import type { IDatabaseDriver } from "./drivers/database-driver";
import { getDatabaseDefinition } from "./registry";
import { normalizeConnectionError } from "./errors";
import { Group } from "@dbchart/schema";

const STORAGE_KEY = "dbchat.savedConnections";
const WORKSPACE_KEY = "dbchat.workspaceConnections";
const PROJECTS_KEY = "dbchat.groups";
const USER_PATHS_KEY = "dbchat.userPaths";
const DEFAULT_SENSITIVE = ["password", "apiToken", "secretKey", "authToken", "clientSecret", "serviceRoleKey", "anonKey", "apiKey"];

/** A user-pinned path scoped to a specific connection. */
export interface UserPath {
  id: string;
  connectionId: string;
  path: string;
  label: string;
  createdAt: number;
}

export class ConnectionManager {
  private static _instance: ConnectionManager;
  private _context?: vscode.ExtensionContext;
  private _drivers: Map<string, IDatabaseDriver> = new Map();
  private _activeConnectionId?: string;
  private _activeConfig?: ConnectionConfig;
  private _savedConnections: SavedConnection[] = [];
  private _workspaceConnections: SavedConnection[] = [];
  private _projects: Group[] = [];
  private _userPaths: UserPath[] = [];
  private _listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager._instance) {
      ConnectionManager._instance = new ConnectionManager();
    }
    return ConnectionManager._instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    this._context = context;
    this._loadConnections();
  }

  /**
   * Subscribe to connection-list changes (create/update/delete).
   * Returns a handle with `dispose()` to unsubscribe.
   */
  public onConnectionsChanged(listener: () => void): { dispose(): void } {
    this._listeners.add(listener);
    return {
      dispose: () => this._listeners.delete(listener),
    };
  }

  public registerDriver(driver: IDatabaseDriver): void {
    this._drivers.set(driver.databaseId, driver);
  }

  public getDriver(databaseId: string): IDatabaseDriver | undefined {
    return this._drivers.get(databaseId);
  }

  public hasDriver(databaseId: string): boolean {
    return this._drivers.has(databaseId);
  }

  public getProjects(): Group[] {
    return [...this._projects].sort((a, b) => a.createdAt - b.createdAt);
  }

  public getProject(groupId: string): Group | undefined {
    return this._projects.find((p) => p.id === groupId);
  }

  public async createProject(name: string, description?: string): Promise<Group> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }

    const group: Group = {
      id: randomUUID(),
      name,
      description,
      createdAt: Date.now(),
    };

    this._projects.push(group);
    this._context.globalState.update(PROJECTS_KEY, this._projects);
    this._notifyConnectionsChanged();
    return group;
  }

  public async updateProject(groupId: string, name: string, description?: string): Promise<Group> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }

    const group = this._projects.find((p) => p.id === groupId);
    if (!group) { throw new Error(`Group not found: ${groupId}`); }

    group.name = name;
    group.description = description;
    group.updatedAt = Date.now();
    this._context.globalState.update(PROJECTS_KEY, this._projects);
    this._notifyConnectionsChanged();
    return group;
  }

  public async copyConnection(connectionId: string): Promise<SavedConnection> {
    const config = await this.getConnectionConfig(connectionId);
    if (!config) { throw new Error(`Connection not found: ${connectionId}`); }

    const name = `${config.name || "Connection"} (copy)`;
    return this.saveConnection({ ...config, name, createdAt: 0 });
  }

  public async assignConnectionToProject(connectionId: string, groupId?: string): Promise<SavedConnection> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }

    const conn = this._savedConnections.find((c) => c.id === connectionId)
      ?? this._workspaceConnections.find((c) => c.id === connectionId);
    if (!conn) { throw new Error(`Connection not found: ${connectionId}`); }

    conn.groupId = groupId;
    if (this._savedConnections.some((c) => c.id === connectionId)) {
      this._saveConnections();
    } else {
      this._saveWorkspaceConnections();
    }

    this._notifyConnectionsChanged();
    return conn;
  }

  public async deleteProject(groupId: string): Promise<void> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }

    this._projects = this._projects.filter((p) => p.id !== groupId);
    this._context.globalState.update(PROJECTS_KEY, this._projects);

    // Orphan the connections that belonged to this group.
    for (const conn of this._savedConnections) {
      if (conn.groupId === groupId) {
        conn.groupId = undefined;
      }
    }
    this._saveConnections();

    this._notifyConnectionsChanged();
  }

  public async saveConnection(config: ConnectionConfig): Promise<SavedConnection> {
    if (!this._context){ throw new Error("ConnectionManager not initialized");}

    const connectionId = randomUUID();
    const { sensitiveValues, nonSensitiveConfig } = this._separateSensitiveValues(config);

    if (Object.keys(sensitiveValues).length > 0) {
      await this._context.secrets.store(`dbchat.connection.${connectionId}`, JSON.stringify(sensitiveValues));
    }

    const saved: SavedConnection = {
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
    } else {
      this._savedConnections.push(saved);
      this._saveConnections();
    }

    this._notifyConnectionsChanged();
    return saved;
  }

  public async updateConnection(id: string, config: ConnectionConfig): Promise<SavedConnection> {
    await this.deleteConnection(id);
    return this.saveConnection(config);
  }

  public async deleteConnection(id: string): Promise<void> {
    if (!this._context) {throw new Error("ConnectionManager not initialized");}
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

  public async getAllConnections(): Promise<SavedConnection[]> {
    return [...this._savedConnections, ...this._workspaceConnections];
  }

  // ── User-pinned paths (custom table locations) ─────────────────────

  public getUserPaths(connectionId?: string): UserPath[] {
    if (!connectionId) { return [...this._userPaths]; }
    return this._userPaths
      .filter((p) => p.connectionId === connectionId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  public async addUserPath(connectionId: string, path: string, label?: string): Promise<UserPath> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }
    const cleanPath = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).join("/");
    if (!cleanPath) { throw new Error("Path cannot be empty."); }

    const userPath: UserPath = {
      id: randomUUID(),
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

  public async removeUserPath(id: string): Promise<void> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }
    this._userPaths = this._userPaths.filter((p) => p.id !== id);
    this._context.workspaceState.update(USER_PATHS_KEY, this._userPaths);
    this._notifyConnectionsChanged();
  }

  public async updateUserPaths(paths: UserPath[]): Promise<void> {
    if (!this._context) { throw new Error("ConnectionManager not initialized"); }
    this._userPaths = paths;
    this._context.workspaceState.update(USER_PATHS_KEY, this._userPaths);
  }

  public async getConnectionConfig(connectionId: string): Promise<ConnectionConfig | null> {
    if (!this._context) {return null;}

    const all = await this.getAllConnections();
    const saved = all.find((c) => c.id === connectionId);
    if (!saved) {return null;}

    const config = JSON.parse(saved.encryptedConfig) as ConnectionConfig;
    const secretJson = await this._context.secrets.get(`dbchat.connection.${connectionId}`);
    if (secretJson) {
      Object.assign(config, JSON.parse(secretJson));
    }
    return config;
  }

  public async testConnection(config: ConnectionConfig) {
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
    } catch (err) {
      const normalized = normalizeConnectionError(err, config);
      return {
        success: false,
        message: normalized.message,
        details: normalized.details,
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  public async connect(configOrId: ConnectionConfig | string): Promise<IDatabaseDriver> {
    let config: ConnectionConfig;

    if (typeof configOrId === "string") {
      const loaded = await this.getConnectionConfig(configOrId);
      if (!loaded) {throw new Error(`Connection not found: ${configOrId}`);}
      config = loaded;
      this._activeConnectionId = configOrId;
    } else {
      config = configOrId;
    }

    const driver = this.getDriver(config.databaseId);
    if (!driver) {throw new Error(`No driver registered for database type: ${config.databaseId}`);}

    try {
      await driver.connect(config);
    } catch (err) {
      const normalized = normalizeConnectionError(err, config);
      const error = new Error(normalized.message) as Error & { details?: Record<string, unknown> };
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

  public async disconnect(): Promise<void> {
    const config = this._activeConfig ??
      (this._activeConnectionId ? await this.getConnectionConfig(this._activeConnectionId) : null);
    if (config) {
      const driver = this.getDriver(config.databaseId);
      if (driver) {await driver.disconnect();}
    }
    this._activeConnectionId = undefined;
    this._activeConfig = undefined;
  }

  public getActiveConnectionId(): string | undefined {
    return this._activeConnectionId;
  }

  public async getActiveConnection(): Promise<ConnectionConfig | null> {
    if (this._activeConfig) {return this._activeConfig;}
    if (this._activeConnectionId) {return this.getConnectionConfig(this._activeConnectionId);}
    return null;
  }

  public async getActiveDriver(): Promise<IDatabaseDriver | null> {
    const config = await this.getActiveConnection();
    if (!config) {return null;}
    return this.getDriver(config.databaseId) ?? null;
  }

  private _separateSensitiveValues(config: ConnectionConfig): {
    sensitiveValues: Record<string, unknown>;
    nonSensitiveConfig: ConnectionConfig;
  } {
    const definition = getDatabaseDefinition(config.databaseId);
    const sensitiveKeys = new Set<string>(DEFAULT_SENSITIVE);

    if (definition) {
      for (const field of definition.fields) {
        if (field.sensitive) {sensitiveKeys.add(field.key);}
      }
    }

    const sensitiveValues: Record<string, unknown> = {};
    const nonSensitiveConfig: ConnectionConfig = { ...config };

    const configRecord = config as unknown as Record<string, unknown>;
    const nonSensitiveRecord = nonSensitiveConfig as unknown as Record<string, unknown>;

    for (const key of sensitiveKeys) {
      const value = configRecord[key];
      if (value !== undefined && value !== null) {
        sensitiveValues[key] = value;
        delete nonSensitiveRecord[key];
      }
    }

    if (config.options) {
      const nonSensitiveOptions: Record<string, unknown> = { ...config.options };
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

  private _loadConnections(): void {
    this._savedConnections = this._context?.globalState.get<SavedConnection[]>(STORAGE_KEY, []) ?? [];
    this._workspaceConnections = this._context?.workspaceState.get<SavedConnection[]>(WORKSPACE_KEY, []) ?? [];
    this._projects = this._context?.globalState.get<Group[]>(PROJECTS_KEY, []) ?? [];
    this._userPaths = this._context?.workspaceState.get<UserPath[]>(USER_PATHS_KEY, []) ?? [];
  }

  private _saveConnections(): void {
    this._context?.globalState.update(STORAGE_KEY, this._savedConnections);
  }

  private _saveWorkspaceConnections(): void {
    this._context?.workspaceState.update(WORKSPACE_KEY, this._workspaceConnections);
  }

  private _notifyConnectionsChanged(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }

  private async _updateLastUsed(connectionId: string): Promise<void> {
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