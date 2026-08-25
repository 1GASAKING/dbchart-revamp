import { Logger } from "../../services/logging/logger";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import { WebviewMessage } from "../../shared/webview/type";
import { WebviewMessageType } from "../../shared/webview/webviewmessage";
import { ConnectionManager } from "../../database/connection-manager";
import { CloudAccountManager } from "../../database/cloud-account-manager";
import { ALL_DATABASE_DEFINITIONS } from "../../database/registry";
import { EditorPanelProvider } from "./editorpanelprovider";
import { ImessageHandler } from "./IMessageHandler";
import { WebviewProvider } from "./webviewprovider";
import * as vscode from "vscode";
import { databaseSchemaToDesign } from "../../../lib/import-export";
import { arrangeSchemaDesign } from "../../../lib/utils/design-arrangement";
import { FirebaseDriver } from "../../database/drivers/firebase-driver";
import type { DatabaseSchema } from "@dbchart/schema";
import type { DBDatabaseTreeItem, DBDatabaseTreeSection, RealtimeTableShape } from "../../shared/extensionmessage/types";

/** Workspace key holding the last successfully connected saved-connection id. */
const LAST_CONNECTION_KEY = "dbchat.lastConnectionId";

export class SidebarMessageHandler implements ImessageHandler {
  constructor(
    private _provider: WebviewProvider,
    private _view: vscode.WebviewView | vscode.WebviewPanel,
  ) {}

  public async handleMessage(message: WebviewMessage) {
    Logger.getInstance().log("msg: " + message.messageType.toString(), true);

    switch (message.messageType) {
      case WebviewMessageType.OPEN_EDITOR:
        const editorPanelProvider = new EditorPanelProvider();
        editorPanelProvider.openEditor(this._provider.context);
        break;

      case WebviewMessageType.OPEN_CREATE_CONNECTION:
        const createConnectionPanelProvider = new EditorPanelProvider();
        createConnectionPanelProvider.openEditor(this._provider.context, "createConnection");
        break;

      case WebviewMessageType.DB_OPEN_DB_VIEW:
        this._handleOpenDbView();
        break;

      case WebviewMessageType.DB_LOAD_TYPES_INTO_EDITOR:
        await this._handleLoadTypesIntoEditor();
        break;

      case WebviewMessageType.DB_GET_TREE:
        await this._handleGetTree();
        break;

      case WebviewMessageType.DB_LOAD_ENTITY:
        if (message.payload) {
          await this._handleLoadEntity(message.payload.entity, message.payload.scope);
        }
        break;

      case WebviewMessageType.DB_GET_RTDB_CHILDREN:
        if (message.payload) {
          await this._handleGetRtdbChildren(message.payload.path, message.payload.limit, message.payload.orderBy);
        }
        break;

      case WebviewMessageType.DB_GET_RTDB_TABLE_SHAPE:
        if (message.payload) {
          await this._handleGetRtdbTableShape(message.payload.path, message.payload.limit);
        }
        break;

      case WebviewMessageType.DB_GET_USER_PATHS:
        await this._handleGetUserPaths();
        break;

      case WebviewMessageType.DB_ADD_USER_PATH:
        if (message.payload) {
          await this._handleAddUserPath(message.payload.path, message.payload.label);
        }
        break;

      case WebviewMessageType.DB_REMOVE_USER_PATH:
        if (message.payload) {
          await this._handleRemoveUserPath(message.payload.id);
        }
        break;

      case WebviewMessageType.DB_OPEN_ANALYTICS_VIEW:
        if (message.payload) {
          this._handleOpenAnalyticsView(message.payload.viewId);
        }
        break;

      case WebviewMessageType.WEBVIEW_DID_LAUNCH:
        this._provider.HandleSendMessageToWebview({
          type: ExtensionMessageType.SET_APP_MODE,
          mode: "sidebar",
        });
        // Lifecycle step: on load, silently reconnect the last session's
        // saved connection so its cached table/column definitions can be
        // shown immediately and refreshed from the live database.
        void this._autoReconnectLastConnection();
        break;

      // ==================== DATABASE OPERATIONS ====================

      case WebviewMessageType.DB_LIST_DATABASES:
        this._handleListDatabases();
        break;

      case WebviewMessageType.DB_GET_CONNECTIONS:
        await this._handleGetConnections();
        break;

      case WebviewMessageType.DB_SAVE_CONNECTION:
        if (message.payload) {
          await this._handleSaveConnection(message.payload.config);
        }
        break;

      case WebviewMessageType.DB_TEST_CONNECTION:
        if (message.payload) {
          await this._handleTestConnection(message.payload.config);
        }
        break;

      case WebviewMessageType.DB_CONNECT:
        if (message.payload) {
          await this._handleConnect(message.payload);
        }
        break;

      case WebviewMessageType.DB_DISCONNECT:
        await this._handleDisconnect();
        break;

      case WebviewMessageType.DB_EXECUTE_QUERY:
        if (message.payload) {
          await this._handleExecuteQuery(message.payload.query, message.payload.params);
        }
        break;

      case WebviewMessageType.DB_GET_SCHEMA:
        await this._handleGetSchema();
        break;

      case WebviewMessageType.DB_GET_CONNECTION_CONFIG:
        if (message.payload) {
          await this._handleGetConnectionConfig(message.payload.connectionId);
        }
        break;

      case WebviewMessageType.DB_LIST_GROUPS:
        this._handleListGroups();
        break;

      case WebviewMessageType.DB_CREATE_GROUP:
        if (message.payload) {
          await this._handleCreateGroup(message.payload.name, message.payload.description);
        }
        break;

      case WebviewMessageType.DB_UPDATE_GROUP:
        if (message.payload) {
          await this._handleUpdateGroup(message.payload.id, message.payload.name, message.payload.description);
        }
        break;

      case WebviewMessageType.DB_DELETE_GROUP:
        if (message.payload) {
          await this._handleDeleteGroup(message.payload.groupId);
        }
        break;

      case WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP:
        if (message.payload) {
          await this._handleAssignConnectionToGroup(message.payload.connectionId, message.payload.groupId);
        }
        break;

      case WebviewMessageType.DB_COPY_CONNECTION:
        if (message.payload) {
          await this._handleCopyConnection(message.payload.connectionId);
        }
        break;

      case WebviewMessageType.DB_LIST_CLOUD_ACCOUNTS:
        this._handleListCloudAccounts();
        break;

      case WebviewMessageType.DB_CREATE_CLOUD_ACCOUNT:
        if (message.payload) {
          await this._handleCreateCloudAccount(message.payload);
        }
        break;

      case WebviewMessageType.DB_DELETE_CLOUD_ACCOUNT:
        if (message.payload) {
          await this._handleDeleteCloudAccount(message.payload.accountId);
        }
        break;

      default:
        break;
    }
  }

  private _handleListDatabases() {
    const dbList = ALL_DATABASE_DEFINITIONS.map((db) => ({
      id: db.id,
      name: db.name,
      category: db.category,
      description: db.description,
      preview: db.preview,
      installed: true,
    }));
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_DATABASES_LISTED,
      payload: dbList,
    });
  }

  private _handleOpenDbView() {
    const editorPanelProvider = new EditorPanelProvider();
    editorPanelProvider.openEditor(this._provider.context, "editor");
  }

  private async _handleLoadTypesIntoEditor() {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) { throw new Error(`No driver registered for database type: ${config.databaseId}`); }
      const schema = await driver.getSchema();
      const editorPanelProvider = new EditorPanelProvider();
      await editorPanelProvider.openEditor(this._provider.context, "canvas", schema);
    } catch (err) {
      this._sendError(err);
    }
  }

  // ── Generic tree / entity loading (shared across all database clients) ──

  /** Build the per-database tree sections (Firestore/Realtime/Views for Firebase). */
  private async _handleGetTree() {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) { throw new Error(`No driver registered for database type: ${config.databaseId}`); }

      // Stale-while-revalidate: serve the locally-cached definitions first so
      // the UI renders instantly, then refresh live further down — the
      // webview simply overwrites its state when the newer DB_TREE arrives.
      // Definitions only; row data is never part of this payload.
      const treeConnectionId = manager.getActiveConnectionId();
      const cachedTree = treeConnectionId
        ? manager.getSchemaCache<{ sections: DBDatabaseTreeSection[] }>(treeConnectionId)
        : undefined;
      if (cachedTree?.sections?.length) {
        this._provider.HandleSendMessageToWebview({
          type: ExtensionMessageType.DB_TREE,
          payload: { sections: cachedTree.sections },
        });
      }

      const sections: DBDatabaseTreeSection[] = [];
      const warnings: string[] = [];
      const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));
      const backendEnabled = (key: string): boolean => {
        const raw = (config as unknown as Record<string, unknown>)[key] ?? (config.options as Record<string, unknown> | undefined)?.[key];
        if (raw === undefined || raw === null || raw === "") { return true; }
        return raw !== false && raw !== "false";
      };

      if (driver instanceof FirebaseDriver) {
        const fb = driver as FirebaseDriver;

        // Each sub-section is isolated: one failing backend must not stop
        // the others from loading (e.g. Firestore not provisioned while
        // Realtime Database works fine). Backends the user disabled are
        // skipped entirely — no request, no warning.
        if (backendEnabled("enableFirestore")) {
        try {
          // Firestore collections
          const collections = await fb.listFirestoreCollections();
          sections.push({
            id: "firestore",
            label: "Firestore",
            icon: "database",
            kind: "collection",
            items: collections.map((name) => ({ id: name, name, kind: "collection" })),
          });
        } catch (err) {
          warnings.push(`Cloud Firestore: ${errorMessage(err)}`);
          sections.push({ id: "firestore", label: "Firestore", icon: "database", kind: "collection", items: [] });
        }
        }

        if (backendEnabled("enableRealtimeDb")) {
        try {
          // Realtime Database top-level paths (shallow, lazy children later)
          const rtdbPaths = await fb.listRealtimePaths();
          sections.push({
            id: "rtdb",
            label: "Realtime Database",
            icon: "zap",
            kind: "path",
            items: rtdbPaths.map((path) => ({ id: `/ ${path}`, name: path, kind: "path", meta: "shallow" })),
          });
        } catch (err) {
          warnings.push(`Realtime Database: ${errorMessage(err)}`);
          sections.push({ id: "rtdb", label: "Realtime Database", icon: "zap", kind: "path", items: [] });
        }
        }

        try {
          // Analytics views
          const views = await fb.listViews();
          sections.push({
            id: "analytics",
            label: "Views (Analytics)",
            icon: "graph-line",
            kind: "analytics",
            items: views.map((v) => ({ id: v.id, name: v.name, kind: "analytics", meta: v.description })),
          });
        } catch (err) {
          warnings.push(`Views (Analytics): ${errorMessage(err)}`);
          sections.push({ id: "analytics", label: "Views (Analytics)", icon: "graph-line", kind: "analytics", items: [] });
        }
      } else {
        // Generic drivers — build a single "Tables" section from the schema.
        try {
          const schema: DatabaseSchema = await driver.getSchema();
          const tables: DBDatabaseTreeItem[] = schema.tables.map((t) => ({
            id: t.name,
            name: t.name,
            kind: t.type === "view" ? "view" : "table",
          }));
          sections.push({
            id: "tables",
            label: "Tables",
            icon: "table",
            kind: "table",
            items: tables,
          });
        } catch (err) {
          warnings.push(`Tables: ${errorMessage(err)}`);
          sections.push({ id: "tables", label: "Tables", icon: "table", kind: "table", items: [] });
        }
      }

      if (treeConnectionId) {
        manager.saveSchemaCache(treeConnectionId, { sections });
      }

      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_TREE,
        payload: { sections, ...(warnings.length > 0 ? { warnings } : {}) },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  /**
   * Load an entity (table / collection / RTDB path) → convert to schema →
   * arrange layout host-side → push arranged design to the canvas editor.
   */
  private async _handleLoadEntity(entity: string, scope?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) { throw new Error(`No driver registered for database type: ${config.databaseId}`); }

      let schema: DatabaseSchema;
      if (driver instanceof FirebaseDriver) {
        const fb = driver as FirebaseDriver;
        // Scope decides which resolver to use.
        if (scope === "collection") {
          schema = { databaseName: "Firebase", tables: [{ name: entity, type: "collection", columns: await fb.getFirestoreCollectionSchema(entity) }], relationships: [] };
        } else {
          // RTDB path or user-pinned path
          schema = await fb.getSchemaForPath(entity);
        }
      } else {
        const columns = (await driver.getTableColumns?.(entity)) ?? [];
        schema = { databaseName: config.database ?? config.name, tables: [{ name: entity, type: "table", columns }], relationships: [] };
      }

      // Convert DatabaseSchema → SchemaDesign → arranged nodes (host-side).
      const design = databaseSchemaToDesign(schema);
      const arranged = arrangeSchemaDesign(design);

      const editorPanelProvider = new EditorPanelProvider();
      await editorPanelProvider.openEditor(this._provider.context, "canvas", undefined, arranged);
    } catch (err) {
      this._sendError(err);
    }
  }

  /** Lazy shallow children for an RTDB path (never fetches payload data). */
  private async _handleGetRtdbChildren(path: string, limit = 50, orderBy = "$key") {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver || !(driver instanceof FirebaseDriver)) {
        throw new Error("Realtime children are only available for Firebase connections.");
      }
      const children = await (driver as FirebaseDriver).getRealtimeChildren(path, limit, orderBy);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_RTDB_CHILDREN,
        payload: { path, children },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  /** Convert the JSON under an RTDB path into tables/columns/nested children.
   * Serves the locally-cached shape first (stale-while-revalidate) so expanding
   * a table always shows its known definition instantly, then refreshes from
   * the live database and pushes the updated shape. */
  private async _handleGetRtdbTableShape(path: string, limit = 25) {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver || !(driver instanceof FirebaseDriver)) {
        throw new Error("Realtime table shapes are only available for Firebase connections.");
      }
      const connectionId = manager.getActiveConnectionId();
      const cached = connectionId ? manager.getTableShapeCache<RealtimeTableShape>(connectionId, path) : undefined;
      if (cached) {
        this._provider.HandleSendMessageToWebview({
          type: ExtensionMessageType.DB_RTDB_TABLE_SHAPE,
          payload: { path, shape: cached },
        });
      }
      const shape = await (driver as FirebaseDriver).getRealtimeTableShape(path, limit);
      if (connectionId) {
        manager.saveTableShapeCache(connectionId, path, shape);
      }
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_RTDB_TABLE_SHAPE,
        payload: { path, shape },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  // ── User-pinned paths (custom table locations) ──────────────────────

  private async _handleGetUserPaths() {
    const manager = ConnectionManager.getInstance();
    const connectionId = manager.getActiveConnectionId();
    const paths = manager.getUserPaths(connectionId);
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_USER_PATHS_LISTED,
      payload: { paths },
    });
  }

  private async _handleAddUserPath(path: string, label?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const connectionId = manager.getActiveConnectionId();
      if (!connectionId) { throw new Error("No active connection."); }
      const saved = await manager.addUserPath(connectionId, path, label);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_USER_PATH_ADDED,
        payload: { path: saved },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleRemoveUserPath(id: string) {
    const manager = ConnectionManager.getInstance();
    try {
      await manager.removeUserPath(id);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_USER_PATH_REMOVED,
        payload: { id },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  /** Open the analytics dashboard view in the editor panel. */
  private _handleOpenAnalyticsView(viewId: string) {
    const editorPanelProvider = new EditorPanelProvider();
    editorPanelProvider.openEditor(this._provider.context, "analytics");
    // viewId could be forwarded later for per-view dashboards.
    Logger.getInstance().log(`Analytics view: ${viewId}`, true);
  }

  private async _handleGetConnections() {
    const manager = ConnectionManager.getInstance();
    const connections = await manager.getAllConnections();
    Logger.getInstance().log(`[Connections] listing ${connections.length} saved connection(s)`);
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_CONNECTIONS_LISTED,
      payload: { connections },
    });
  }

  private async _handleSaveConnection(config: any) {
    const manager = ConnectionManager.getInstance();
    try {
      const saved = await manager.saveConnection(config);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CONNECTION_SAVED,
        payload: { connection: saved },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleTestConnection(config: any) {
    const manager = ConnectionManager.getInstance();
    try {
      const result = await manager.testConnection(config);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CONNECTION_TESTED,
        payload: { result },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  /**
   * On launch, silently reconnect the last session's saved connection. The
   * point of connecting is to keep the locally-cached table/column
   * definitions in sync with the live database — disconnecting remains a
   * manual choice, and failures only log (the cached definitions still
   * render from local storage).
   */
  private async _autoReconnectLastConnection() {
    try {
      const lastId = await this._provider.context.workspaceState.get<string>(LAST_CONNECTION_KEY);
      if (!lastId) { return; }
      const manager = ConnectionManager.getInstance();
      if (await manager.getActiveConnection()) { return; } // already connected
      const driver = await manager.connect(lastId); // throws if it was deleted
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CONNECTED,
        payload: { connected: true, databaseId: driver.databaseId, connectionId: lastId },
      });
      // Push the (cached + freshly refreshed) tree right away so the
      // sidebar's sub-databases are ready without any click.
      await this._handleGetTree();
    } catch (err) {
      Logger.getInstance().log(
        `[Auto-reconnect] failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private async _handleConnect(payload: { connectionId?: string; config?: any }) {
    const manager = ConnectionManager.getInstance();
    try {
      const connectionId = typeof payload.connectionId === "string" ? payload.connectionId : null;
      const driver = await manager.connect(payload.connectionId ?? payload.config);
      // Remember the last connected saved-connection id for auto-reconnect on
      // the next launch. Manual disconnect intentionally does NOT clear this:
      // dropping the live connection is a per-session choice only.
      if (connectionId) {
        await this._provider.context.workspaceState.update(LAST_CONNECTION_KEY, connectionId);
      }
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CONNECTED,
        payload: { connected: true, databaseId: driver.databaseId, connectionId: connectionId ?? undefined },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleDisconnect() {
    const manager = ConnectionManager.getInstance();
    await manager.disconnect();
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_DISCONNECTED,
    });
  }

  private async _handleExecuteQuery(query: string, params?: unknown[]) {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) { throw new Error(`No driver registered for database type: ${config.databaseId}`); }
      const result = await driver.query(query, params);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_QUERY_RESULT,
        payload: { result },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleGetSchema() {
    const manager = ConnectionManager.getInstance();
    try {
      const config = await manager.getActiveConnection();
      if (!config) { throw new Error("No active connection. Connect to a database first."); }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) { throw new Error(`No driver registered for database type: ${config.databaseId}`); }
      const schema = await driver.getSchema();
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_SCHEMA,
        payload: { schema },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleGetConnectionConfig(connectionId: string) {
    const manager = ConnectionManager.getInstance();
    const config = await manager.getConnectionConfig(connectionId);
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_CONNECTION_CONFIG,
      payload: { config },
    });
  }

  private _handleListGroups() {
    const manager = ConnectionManager.getInstance();
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_GROUPS_LISTED,
      payload: { groups: manager.getGroups() },
    });
  }

  private async _handleCreateGroup(name: string, description?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const group = await manager.createGroup(name, description);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_GROUP_CREATED,
        payload: { group },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleUpdateGroup(id: string, name: string, description?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const group = await manager.updateGroup(id, name, description);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_GROUP_UPDATED,
        payload: { group },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleDeleteGroup(groupId: string) {
    const manager = ConnectionManager.getInstance();
    try {
      await manager.deleteGroup(groupId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_GROUP_DELETED,
        payload: { groupId },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleAssignConnectionToGroup(connectionId: string, groupId?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const connection = await manager.assignConnectionToGroup(connectionId, groupId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_GROUP_ASSIGNED,
        payload: { connection },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleCopyConnection(connectionId: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const saved = await manager.copyConnection(connectionId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CONNECTION_SAVED,
        payload: { connection: saved },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private _handleListCloudAccounts() {
    const manager = CloudAccountManager.getInstance();
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_CLOUD_ACCOUNTS_LISTED,
      payload: { accounts: manager.getAccounts() },
    });
  }

  private async _handleCreateCloudAccount(payload: any) {
    const manager = CloudAccountManager.getInstance();
    try {
      const account = await manager.createAccount(payload);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CLOUD_ACCOUNT_CREATED,
        payload: { account },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleDeleteCloudAccount(accountId: string) {
    const manager = CloudAccountManager.getInstance();
    try {
      await manager.deleteAccount(accountId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_CLOUD_ACCOUNT_DELETED,
        payload: { accountId },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private _sendError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const details = (err as { details?: Record<string, unknown> } | undefined)?.details;
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_ERROR,
      payload: { error: message, details },
    });
  }
  
}