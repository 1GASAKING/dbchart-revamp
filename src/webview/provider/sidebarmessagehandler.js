"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarMessageHandler = void 0;
const logger_1 = require("../../services/logging/logger");
const extensionmessage_1 = require("../../shared/extensionmessage/extensionmessage");
const webviewmessage_1 = require("../../shared/webview/webviewmessage");
const connection_manager_1 = require("../../database/connection-manager");
const cloud_account_manager_1 = require("../../database/cloud-account-manager");
const registry_1 = require("../../database/registry");
const editorpanelprovider_1 = require("./editorpanelprovider");
const import_export_1 = require("../../../lib/import-export");
const design_arrangement_1 = require("../../../lib/utils/design-arrangement");
const firebase_driver_1 = require("../../database/drivers/firebase-driver");
/** Workspace key holding the last successfully connected saved-connection id. */
const LAST_CONNECTION_KEY = "dbchat.lastConnectionId";
class SidebarMessageHandler {
    _provider;
    _view;
    constructor(_provider, _view) {
        this._provider = _provider;
        this._view = _view;
    }
    async handleMessage(message) {
        logger_1.Logger.getInstance().log("msg: " + message.messageType.toString(), true);
        switch (message.messageType) {
            case webviewmessage_1.WebviewMessageType.OPEN_EDITOR:
                const editorPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
                editorPanelProvider.openEditor(this._provider.context);
                break;
            case webviewmessage_1.WebviewMessageType.OPEN_CREATE_CONNECTION:
                const createConnectionPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
                createConnectionPanelProvider.openEditor(this._provider.context, "createConnection");
                break;
            case webviewmessage_1.WebviewMessageType.DB_OPEN_DB_VIEW:
                this._handleOpenDbView();
                break;
            case webviewmessage_1.WebviewMessageType.DB_LOAD_TYPES_INTO_EDITOR:
                await this._handleLoadTypesIntoEditor();
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_TREE:
                await this._handleGetTree();
                break;
            case webviewmessage_1.WebviewMessageType.DB_LOAD_ENTITY:
                if (message.payload) {
                    await this._handleLoadEntity(message.payload.entity, message.payload.scope);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_RTDB_CHILDREN:
                if (message.payload) {
                    await this._handleGetRtdbChildren(message.payload.path, message.payload.limit, message.payload.orderBy);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_RTDB_TABLE_SHAPE:
                if (message.payload) {
                    await this._handleGetRtdbTableShape(message.payload.path, message.payload.limit);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_USER_PATHS:
                await this._handleGetUserPaths();
                break;
            case webviewmessage_1.WebviewMessageType.DB_ADD_USER_PATH:
                if (message.payload) {
                    await this._handleAddUserPath(message.payload.path, message.payload.label);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_REMOVE_USER_PATH:
                if (message.payload) {
                    await this._handleRemoveUserPath(message.payload.id);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_OPEN_ANALYTICS_VIEW:
                if (message.payload) {
                    this._handleOpenAnalyticsView(message.payload.viewId);
                }
                break;
            case webviewmessage_1.WebviewMessageType.WEBVIEW_DID_LAUNCH:
                this._provider.HandleSendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.SET_APP_MODE,
                    mode: "sidebar",
                });
                // Lifecycle step: on load, silently reconnect the last session's
                // saved connection so its cached table/column definitions can be
                // shown immediately and refreshed from the live database.
                void this._autoReconnectLastConnection();
                break;
            // ==================== DATABASE OPERATIONS ====================
            case webviewmessage_1.WebviewMessageType.DB_LIST_DATABASES:
                this._handleListDatabases();
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_CONNECTIONS:
                await this._handleGetConnections();
                break;
            case webviewmessage_1.WebviewMessageType.DB_SAVE_CONNECTION:
                if (message.payload) {
                    await this._handleSaveConnection(message.payload.config);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_TEST_CONNECTION:
                if (message.payload) {
                    await this._handleTestConnection(message.payload.config);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_CONNECT:
                if (message.payload) {
                    await this._handleConnect(message.payload);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_DISCONNECT:
                await this._handleDisconnect();
                break;
            case webviewmessage_1.WebviewMessageType.DB_EXECUTE_QUERY:
                if (message.payload) {
                    await this._handleExecuteQuery(message.payload.query, message.payload.params);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_SCHEMA:
                await this._handleGetSchema();
                break;
            case webviewmessage_1.WebviewMessageType.DB_GET_CONNECTION_CONFIG:
                if (message.payload) {
                    await this._handleGetConnectionConfig(message.payload.connectionId);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_LIST_GROUPS:
                this._handleListGroups();
                break;
            case webviewmessage_1.WebviewMessageType.DB_CREATE_GROUP:
                if (message.payload) {
                    await this._handleCreateGroup(message.payload.name, message.payload.description);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_UPDATE_GROUP:
                if (message.payload) {
                    await this._handleUpdateGroup(message.payload.id, message.payload.name, message.payload.description);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_DELETE_GROUP:
                if (message.payload) {
                    await this._handleDeleteGroup(message.payload.groupId);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP:
                if (message.payload) {
                    await this._handleAssignConnectionToGroup(message.payload.connectionId, message.payload.groupId);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_COPY_CONNECTION:
                if (message.payload) {
                    await this._handleCopyConnection(message.payload.connectionId);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_LIST_CLOUD_ACCOUNTS:
                this._handleListCloudAccounts();
                break;
            case webviewmessage_1.WebviewMessageType.DB_CREATE_CLOUD_ACCOUNT:
                if (message.payload) {
                    await this._handleCreateCloudAccount(message.payload);
                }
                break;
            case webviewmessage_1.WebviewMessageType.DB_DELETE_CLOUD_ACCOUNT:
                if (message.payload) {
                    await this._handleDeleteCloudAccount(message.payload.accountId);
                }
                break;
            default:
                break;
        }
    }
    _handleListDatabases() {
        const dbList = registry_1.ALL_DATABASE_DEFINITIONS.map((db) => ({
            id: db.id,
            name: db.name,
            category: db.category,
            description: db.description,
            preview: db.preview,
            installed: true,
        }));
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_DATABASES_LISTED,
            payload: dbList,
        });
    }
    _handleOpenDbView() {
        const editorPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
        editorPanelProvider.openEditor(this._provider.context, "editor");
    }
    async _handleLoadTypesIntoEditor() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver) {
                throw new Error(`No driver registered for database type: ${config.databaseId}`);
            }
            const schema = await driver.getSchema();
            const editorPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
            await editorPanelProvider.openEditor(this._provider.context, "canvas", schema);
        }
        catch (err) {
            this._sendError(err);
        }
    }
    // ── Generic tree / entity loading (shared across all database clients) ──
    /** Build the per-database tree sections (Firestore/Realtime/Views for Firebase). */
    async _handleGetTree() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver) {
                throw new Error(`No driver registered for database type: ${config.databaseId}`);
            }
            // Stale-while-revalidate: serve the locally-cached definitions first so
            // the UI renders instantly, then refresh live further down — the
            // webview simply overwrites its state when the newer DB_TREE arrives.
            // Definitions only; row data is never part of this payload.
            const treeConnectionId = manager.getActiveConnectionId();
            const cachedTree = treeConnectionId
                ? manager.getSchemaCache(treeConnectionId)
                : undefined;
            if (cachedTree?.sections?.length) {
                this._provider.HandleSendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.DB_TREE,
                    payload: { sections: cachedTree.sections },
                });
            }
            const sections = [];
            const warnings = [];
            const errorMessage = (err) => (err instanceof Error ? err.message : String(err));
            const backendEnabled = (key) => {
                const raw = config[key] ?? config.options?.[key];
                if (raw === undefined || raw === null || raw === "") {
                    return true;
                }
                return raw !== false && raw !== "false";
            };
            if (driver instanceof firebase_driver_1.FirebaseDriver) {
                const fb = driver;
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
                    }
                    catch (err) {
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
                    }
                    catch (err) {
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
                }
                catch (err) {
                    warnings.push(`Views (Analytics): ${errorMessage(err)}`);
                    sections.push({ id: "analytics", label: "Views (Analytics)", icon: "graph-line", kind: "analytics", items: [] });
                }
            }
            else {
                // Generic drivers — build a single "Tables" section from the schema.
                try {
                    const schema = await driver.getSchema();
                    const tables = schema.tables.map((t) => ({
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
                }
                catch (err) {
                    warnings.push(`Tables: ${errorMessage(err)}`);
                    sections.push({ id: "tables", label: "Tables", icon: "table", kind: "table", items: [] });
                }
            }
            if (treeConnectionId) {
                manager.saveSchemaCache(treeConnectionId, { sections });
            }
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_TREE,
                payload: { sections, ...(warnings.length > 0 ? { warnings } : {}) },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    /**
     * Load an entity (table / collection / RTDB path) → convert to schema →
     * arrange layout host-side → push arranged design to the canvas editor.
     */
    async _handleLoadEntity(entity, scope) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver) {
                throw new Error(`No driver registered for database type: ${config.databaseId}`);
            }
            let schema;
            if (driver instanceof firebase_driver_1.FirebaseDriver) {
                const fb = driver;
                // Scope decides which resolver to use.
                if (scope === "collection") {
                    schema = { databaseName: "Firebase", tables: [{ name: entity, type: "collection", columns: await fb.getFirestoreCollectionSchema(entity) }], relationships: [] };
                }
                else {
                    // RTDB path or user-pinned path
                    schema = await fb.getSchemaForPath(entity);
                }
            }
            else {
                const columns = (await driver.getTableColumns?.(entity)) ?? [];
                schema = { databaseName: config.database ?? config.name, tables: [{ name: entity, type: "table", columns }], relationships: [] };
            }
            // Convert DatabaseSchema → SchemaDesign → arranged nodes (host-side).
            const design = (0, import_export_1.databaseSchemaToDesign)(schema);
            const arranged = (0, design_arrangement_1.arrangeSchemaDesign)(design);
            const editorPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
            await editorPanelProvider.openEditor(this._provider.context, "canvas", undefined, arranged);
        }
        catch (err) {
            this._sendError(err);
        }
    }
    /** Lazy shallow children for an RTDB path (never fetches payload data). */
    async _handleGetRtdbChildren(path, limit = 50, orderBy = "$key") {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver || !(driver instanceof firebase_driver_1.FirebaseDriver)) {
                throw new Error("Realtime children are only available for Firebase connections.");
            }
            const children = await driver.getRealtimeChildren(path, limit, orderBy);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_RTDB_CHILDREN,
                payload: { path, children },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    /** Convert the JSON under an RTDB path into tables/columns/nested children.
     * Serves the locally-cached shape first (stale-while-revalidate) so expanding
     * a table always shows its known definition instantly, then refreshes from
     * the live database and pushes the updated shape. */
    async _handleGetRtdbTableShape(path, limit = 25) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver || !(driver instanceof firebase_driver_1.FirebaseDriver)) {
                throw new Error("Realtime table shapes are only available for Firebase connections.");
            }
            const connectionId = manager.getActiveConnectionId();
            const cached = connectionId ? manager.getTableShapeCache(connectionId, path) : undefined;
            if (cached) {
                this._provider.HandleSendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.DB_RTDB_TABLE_SHAPE,
                    payload: { path, shape: cached },
                });
            }
            const shape = await driver.getRealtimeTableShape(path, limit);
            if (connectionId) {
                manager.saveTableShapeCache(connectionId, path, shape);
            }
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_RTDB_TABLE_SHAPE,
                payload: { path, shape },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    // ── User-pinned paths (custom table locations) ──────────────────────
    async _handleGetUserPaths() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        const connectionId = manager.getActiveConnectionId();
        const paths = manager.getUserPaths(connectionId);
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_USER_PATHS_LISTED,
            payload: { paths },
        });
    }
    async _handleAddUserPath(path, label) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const connectionId = manager.getActiveConnectionId();
            if (!connectionId) {
                throw new Error("No active connection.");
            }
            const saved = await manager.addUserPath(connectionId, path, label);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_USER_PATH_ADDED,
                payload: { path: saved },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleRemoveUserPath(id) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            await manager.removeUserPath(id);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_USER_PATH_REMOVED,
                payload: { id },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    /** Open the analytics dashboard view in the editor panel. */
    _handleOpenAnalyticsView(viewId) {
        const editorPanelProvider = new editorpanelprovider_1.EditorPanelProvider();
        editorPanelProvider.openEditor(this._provider.context, "analytics");
        // viewId could be forwarded later for per-view dashboards.
        logger_1.Logger.getInstance().log(`Analytics view: ${viewId}`, true);
    }
    async _handleGetConnections() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        const connections = await manager.getAllConnections();
        logger_1.Logger.getInstance().log(`[Connections] listing ${connections.length} saved connection(s)`);
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTIONS_LISTED,
            payload: { connections },
        });
    }
    async _handleSaveConnection(config) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const saved = await manager.saveConnection(config);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_SAVED,
                payload: { connection: saved },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleTestConnection(config) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const result = await manager.testConnection(config);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_TESTED,
                payload: { result },
            });
        }
        catch (err) {
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
    async _autoReconnectLastConnection() {
        try {
            const lastId = await this._provider.context.workspaceState.get(LAST_CONNECTION_KEY);
            if (!lastId) {
                return;
            }
            const manager = connection_manager_1.ConnectionManager.getInstance();
            if (await manager.getActiveConnection()) {
                return;
            } // already connected
            const driver = await manager.connect(lastId); // throws if it was deleted
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTED,
                payload: { connected: true, databaseId: driver.databaseId, connectionId: lastId },
            });
            // Push the (cached + freshly refreshed) tree right away so the
            // sidebar's sub-databases are ready without any click.
            await this._handleGetTree();
        }
        catch (err) {
            logger_1.Logger.getInstance().log(`[Auto-reconnect] failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async _handleConnect(payload) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
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
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTED,
                payload: { connected: true, databaseId: driver.databaseId, connectionId: connectionId ?? undefined },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleDisconnect() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        await manager.disconnect();
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_DISCONNECTED,
        });
    }
    async _handleExecuteQuery(query, params) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver) {
                throw new Error(`No driver registered for database type: ${config.databaseId}`);
            }
            const result = await driver.query(query, params);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_QUERY_RESULT,
                payload: { result },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleGetSchema() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const config = await manager.getActiveConnection();
            if (!config) {
                throw new Error("No active connection. Connect to a database first.");
            }
            const driver = manager.getDriver(config.databaseId);
            if (!driver) {
                throw new Error(`No driver registered for database type: ${config.databaseId}`);
            }
            const schema = await driver.getSchema();
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_SCHEMA,
                payload: { schema },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleGetConnectionConfig(connectionId) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        const config = await manager.getConnectionConfig(connectionId);
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_CONFIG,
            payload: { config },
        });
    }
    _handleListGroups() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_GROUPS_LISTED,
            payload: { groups: manager.getGroups() },
        });
    }
    async _handleCreateGroup(name, description) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const group = await manager.createGroup(name, description);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_GROUP_CREATED,
                payload: { group },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleUpdateGroup(id, name, description) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const group = await manager.updateGroup(id, name, description);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_GROUP_UPDATED,
                payload: { group },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleDeleteGroup(groupId) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            await manager.deleteGroup(groupId);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_GROUP_DELETED,
                payload: { groupId },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleAssignConnectionToGroup(connectionId, groupId) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const connection = await manager.assignConnectionToGroup(connectionId, groupId);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_GROUP_ASSIGNED,
                payload: { connection },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleCopyConnection(connectionId) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const saved = await manager.copyConnection(connectionId);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_SAVED,
                payload: { connection: saved },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    _handleListCloudAccounts() {
        const manager = cloud_account_manager_1.CloudAccountManager.getInstance();
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_CLOUD_ACCOUNTS_LISTED,
            payload: { accounts: manager.getAccounts() },
        });
    }
    async _handleCreateCloudAccount(payload) {
        const manager = cloud_account_manager_1.CloudAccountManager.getInstance();
        try {
            const account = await manager.createAccount(payload);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CLOUD_ACCOUNT_CREATED,
                payload: { account },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleDeleteCloudAccount(accountId) {
        const manager = cloud_account_manager_1.CloudAccountManager.getInstance();
        try {
            await manager.deleteAccount(accountId);
            this._provider.HandleSendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.DB_CLOUD_ACCOUNT_DELETED,
                payload: { accountId },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    _sendError(err) {
        const message = err instanceof Error ? err.message : String(err);
        const details = err?.details;
        this._provider.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_ERROR,
            payload: { error: message, details },
        });
    }
}
exports.SidebarMessageHandler = SidebarMessageHandler;
//# sourceMappingURL=sidebarmessagehandler.js.map