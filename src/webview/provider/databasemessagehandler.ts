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
      const driver = await manager.connect(payload.connectionId ?? payload.config);
      this._sendMessage({
        type: ExtensionMessageType.DB_CONNECTED,
        payload: { connected: true, databaseId: driver.databaseId },
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

  private _sendError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    this._sendMessage({
      type: ExtensionMessageType.DB_ERROR,
      payload: { error: message },
    });
  }
}