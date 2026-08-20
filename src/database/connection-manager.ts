import * as vscode from "vscode";
import { randomUUID } from "crypto";
import type { ConnectionConfig, SavedConnection } from "./types/connection-config";
import type { IDatabaseDriver } from "./drivers/database-driver";
import { getDatabaseDefinition } from "./registry";

const STORAGE_KEY = "dbchat.savedConnections";
const WORKSPACE_KEY = "dbchat.workspaceConnections";
const DEFAULT_SENSITIVE = ["password", "apiToken", "secretKey", "authToken", "clientSecret", "serviceRoleKey", "anonKey", "apiKey"];

export class ConnectionManager {
  private static _instance: ConnectionManager;
  private _context?: vscode.ExtensionContext;
  private _drivers: Map<string, IDatabaseDriver> = new Map();
  private _activeConnectionId?: string;
  private _activeConfig?: ConnectionConfig;
  private _savedConnections: SavedConnection[] = [];
  private _workspaceConnections: SavedConnection[] = [];

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

  public registerDriver(driver: IDatabaseDriver): void {
    this._drivers.set(driver.databaseId, driver);
  }

  public getDriver(databaseId: string): IDatabaseDriver | undefined {
    return this._drivers.get(databaseId);
  }

  public hasDriver(databaseId: string): boolean {
    return this._drivers.has(databaseId);
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
  }

  public async getAllConnections(): Promise<SavedConnection[]> {
    return [...this._savedConnections, ...this._workspaceConnections];
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
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
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

    await driver.connect(config);

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
  }

  private _saveConnections(): void {
    this._context?.globalState.update(STORAGE_KEY, this._savedConnections);
  }

  private _saveWorkspaceConnections(): void {
    this._context?.workspaceState.update(WORKSPACE_KEY, this._workspaceConnections);
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