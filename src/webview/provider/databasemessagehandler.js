"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseMessageHandler = void 0;
const extensionmessage_1 = require("../../shared/extensionmessage/extensionmessage");
const webviewmessage_1 = require("../../shared/webview/webviewmessage");
const connection_manager_1 = require("../../database/connection-manager");
const registry_1 = require("../../database/registry");
/**
 * Handles all database-related messages coming from a webview.
 * Shared between the sidebar and editor webviews so connection
 * management works in both views.
 */
class DatabaseMessageHandler {
    _sendMessage;
    constructor(_sendMessage) {
        this._sendMessage = _sendMessage;
    }
    /**
     * Handle a database message.
     * @returns true if the message was a database message, false otherwise.
     */
    async handleMessage(message) {
        switch (message.messageType) {
            case webviewmessage_1.WebviewMessageType.DB_LIST_DATABASES:
                this._handleListDatabases();
                return true;
            case webviewmessage_1.WebviewMessageType.DB_GET_CONNECTIONS:
                await this._handleGetConnections();
                return true;
            case webviewmessage_1.WebviewMessageType.DB_SAVE_CONNECTION:
                if (message.payload) {
                    await this._handleSaveConnection(message.payload.config);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_TEST_CONNECTION:
                if (message.payload) {
                    await this._handleTestConnection(message.payload.config);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_CONNECT:
                if (message.payload) {
                    await this._handleConnect(message.payload);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_DISCONNECT:
                await this._handleDisconnect();
                return true;
            case webviewmessage_1.WebviewMessageType.DB_EXECUTE_QUERY:
                if (message.payload) {
                    await this._handleExecuteQuery(message.payload.query, message.payload.params);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_GET_SCHEMA:
                await this._handleGetSchema();
                return true;
            case webviewmessage_1.WebviewMessageType.DB_GET_CONNECTION_CONFIG:
                if (message.payload) {
                    await this._handleGetConnectionConfig(message.payload.connectionId);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_DELETE_CONNECTION:
                if (message.payload) {
                    await this._handleDeleteConnection(message.payload.connectionId);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_UPDATE_CONNECTION:
                if (message.payload) {
                    await this._handleUpdateConnection(message.payload.id, message.payload.config);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_LIST_GROUPS:
                this._handleListGroups();
                return true;
            case webviewmessage_1.WebviewMessageType.DB_CREATE_GROUP:
                if (message.payload) {
                    await this._handleCreateGroup(message.payload.name, message.payload.description);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_UPDATE_GROUP:
                if (message.payload) {
                    await this._handleUpdateGroup(message.payload.id, message.payload.name, message.payload.description);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_DELETE_GROUP:
                if (message.payload) {
                    await this._handleDeleteGroup(message.payload.groupId);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP:
                if (message.payload) {
                    await this._handleAssignConnectionToGroup(message.payload.connectionId, message.payload.groupId);
                }
                return true;
            case webviewmessage_1.WebviewMessageType.DB_COPY_CONNECTION:
                if (message.payload) {
                    await this._handleCopyConnection(message.payload.connectionId);
                }
                return true;
            default:
                return false;
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
            fields: db.fields,
        }));
        this._sendMessage({
            type: extensionmessage_1.ExtensionMessageType.DB_DATABASES_LISTED,
            payload: dbList,
        });
    }
    async _handleGetConnections() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        const connections = await manager.getAllConnections();
        this._sendMessage({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTIONS_LISTED,
            payload: { connections },
        });
    }
    async _handleSaveConnection(config) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const saved = await manager.saveConnection(config);
            this._sendMessage({
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
            this._sendMessage({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_TESTED,
                payload: { result },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleConnect(payload) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const connectionId = typeof payload.connectionId === "string" ? payload.connectionId : null;
            const driver = await manager.connect(payload.connectionId ?? payload.config);
            this._sendMessage({
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
        this._sendMessage({
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
            this._sendMessage({
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
            this._sendMessage({
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
        this._sendMessage({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_CONFIG,
            payload: { config },
        });
    }
    async _handleDeleteConnection(connectionId) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            await manager.deleteConnection(connectionId);
            this._sendMessage({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_DELETED,
                payload: { connectionId },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    async _handleUpdateConnection(id, config) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const updated = await manager.updateConnection(id, config);
            this._sendMessage({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_UPDATED,
                payload: { connection: updated },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    _handleListGroups() {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        this._sendMessage({
            type: extensionmessage_1.ExtensionMessageType.DB_GROUPS_LISTED,
            payload: { groups: manager.getGroups() },
        });
    }
    async _handleCreateGroup(name, description) {
        const manager = connection_manager_1.ConnectionManager.getInstance();
        try {
            const group = await manager.createGroup(name, description);
            this._sendMessage({
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
            this._sendMessage({
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
            this._sendMessage({
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
            this._sendMessage({
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
            this._sendMessage({
                type: extensionmessage_1.ExtensionMessageType.DB_CONNECTION_SAVED,
                payload: { connection: saved },
            });
        }
        catch (err) {
            this._sendError(err);
        }
    }
    _sendError(err) {
        const message = err instanceof Error ? err.message : String(err);
        const details = err?.details;
        this._sendMessage({
            type: extensionmessage_1.ExtensionMessageType.DB_ERROR,
            payload: { error: message, details },
        });
    }
}
exports.DatabaseMessageHandler = DatabaseMessageHandler;
//# sourceMappingURL=databasemessagehandler.js.map