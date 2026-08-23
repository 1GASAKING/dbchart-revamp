import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "../../shared/extensionmessage/types";
import { WebviewMessage } from "../../shared/webview/type";
import { WebviewMessageType } from "../../shared/webview/webviewmessage";
import { ConnectionManager } from "../../database/connection-manager";
import { ALL_DATABASE_DEFINITIONS } from "../../database/registry";

/**
 * Handles all database-related messages coming from a webview.
 * Shared between the sidebar and editor webviews so connection
 * management works in both views.
 */
export class DatabaseMessageHandler {
  constructor(private _sendMessage: (msg: ExtensionMessage) => void) {}

  /**
   * Handle a database message.
   * @returns true if the message was a database message, false otherwise.
   */
  public async handleMessage(message: WebviewMessage): Promise<boolean> {
    switch (message.messageType) {
      case WebviewMessageType.DB_LIST_DATABASES:
        this._handleListDatabases();
        return true;

      case WebviewMessageType.DB_GET_CONNECTIONS:
        await this._handleGetConnections();
        return true;

      case WebviewMessageType.DB_SAVE_CONNECTION:
        if (message.payload) {
          await this._handleSaveConnection(message.payload.config);
        }
        return true;

      case WebviewMessageType.DB_TEST_CONNECTION:
        if (message.payload) {
          await this._handleTestConnection(message.payload.config);
        }
        return true;

      case WebviewMessageType.DB_CONNECT:
        if (message.payload) {
          await this._handleConnect(message.payload);
        }
        return true;

      case WebviewMessageType.DB_DISCONNECT:
        await this._handleDisconnect();
        return true;

      case WebviewMessageType.DB_EXECUTE_QUERY:
        if (message.payload) {
          await this._handleExecuteQuery(message.payload.query, message.payload.params);
        }
        return true;

      case WebviewMessageType.DB_GET_SCHEMA:
        await this._handleGetSchema();
        return true;

      case WebviewMessageType.DB_GET_CONNECTION_CONFIG:
        if (message.payload) {
          await this._handleGetConnectionConfig(message.payload.connectionId);
        }
        return true;

      case WebviewMessageType.DB_DELETE_CONNECTION:
        if (message.payload) {
          await this._handleDeleteConnection(message.payload.connectionId);
        }
        return true;

      case WebviewMessageType.DB_UPDATE_CONNECTION:
        if (message.payload) {
          await this._handleUpdateConnection(message.payload.id, message.payload.config);
        }
        return true;

      case WebviewMessageType.DB_LIST_GROUPS:
        this._handleListGroups();
        return true;

      case WebviewMessageType.DB_CREATE_GROUP:
        if (message.payload) {
          await this._handleCreateGroup(message.payload.name, message.payload.description);
        }
        return true;

      case WebviewMessageType.DB_UPDATE_GROUP:
        if (message.payload) {
          await this._handleUpdateGroup(message.payload.id, message.payload.name, message.payload.description);
        }
        return true;

      case WebviewMessageType.DB_DELETE_GROUP:
        if (message.payload) {
          await this._handleDeleteGroup(message.payload.groupId);
        }
        return true;

      case WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP:
        if (message.payload) {
          await this._handleAssignConnectionToGroup(message.payload.connectionId, message.payload.groupId);
        }
        return true;

      case WebviewMessageType.DB_COPY_CONNECTION:
        if (message.payload) {
          await this._handleCopyConnection(message.payload.connectionId);
        }
        return true;

      default:
        return false;
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
      fields: db.fields,
    }));
    this._sendMessage({
      type: ExtensionMessageType.DB_DATABASES_LISTED,
      payload: dbList,
    });
  }

  private async _handleGetConnections() {
    const manager = ConnectionManager.getInstance();
    const connections = await manager.getAllConnections();
    this._sendMessage({
      type: ExtensionMessageType.DB_CONNECTIONS_LISTED,
      payload: { connections },
    });
  }

  private async _handleSaveConnection(config: any) {
    const manager = ConnectionManager.getInstance();
    try {
      const saved = await manager.saveConnection(config);
      this._sendMessage({
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
      this._sendMessage({
        type: ExtensionMessageType.DB_CONNECTION_TESTED,
        payload: { result },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleConnect(payload: { connectionId?: string; config?: any }) {
    const manager = ConnectionManager.getInstance();
    try {
      const connectionId = typeof payload.connectionId === "string" ? payload.connectionId : null;
      const driver = await manager.connect(payload.connectionId ?? payload.config);
      this._sendMessage({
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
    this._sendMessage({
      type: ExtensionMessageType.DB_DISCONNECTED,
    });
  }

  private async _handleExecuteQuery(query: string, params?: unknown[]) {
    const manager = ConnectionManager.getInstance();
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
      if (!config) {
        throw new Error("No active connection. Connect to a database first.");
      }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) {
        throw new Error(`No driver registered for database type: ${config.databaseId}`);
      }
      const schema = await driver.getSchema();
      this._sendMessage({
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
    this._sendMessage({
      type: ExtensionMessageType.DB_CONNECTION_CONFIG,
      payload: { config },
    });
  }

  private async _handleDeleteConnection(connectionId: string) {
    const manager = ConnectionManager.getInstance();
    try {
      await manager.deleteConnection(connectionId);
      this._sendMessage({
        type: ExtensionMessageType.DB_CONNECTION_DELETED,
        payload: { connectionId },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleUpdateConnection(id: string, config: any) {
    const manager = ConnectionManager.getInstance();
    try {
      const updated = await manager.updateConnection(id, config);
      this._sendMessage({
        type: ExtensionMessageType.DB_CONNECTION_UPDATED,
        payload: { connection: updated },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private _handleListGroups() {
    const manager = ConnectionManager.getInstance();
    this._sendMessage({
      type: ExtensionMessageType.DB_GROUPS_LISTED,
      payload: { groups: manager.getGroups() },
    });
  }

  private async _handleCreateGroup(name: string, description?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const group = await manager.createGroup(name, description);
      this._sendMessage({
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
      this._sendMessage({
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
      this._sendMessage({
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
      this._sendMessage({
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
      this._sendMessage({
        type: ExtensionMessageType.DB_CONNECTION_SAVED,
        payload: { connection: saved },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private _sendError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const details = (err as { details?: Record<string, unknown> } | undefined)?.details;
    this._sendMessage({
      type: ExtensionMessageType.DB_ERROR,
      payload: { error: message, details },
    });
  }
}