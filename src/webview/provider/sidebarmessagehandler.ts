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

      case WebviewMessageType.WEBVIEW_DID_LAUNCH:
        this._provider.HandleSendMessageToWebview({
          type: ExtensionMessageType.SET_APP_MODE,
          mode: "sidebar",
        });
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

      case WebviewMessageType.DB_LIST_PROJECTS:
        this._handleListProjects();
        break;

      case WebviewMessageType.DB_CREATE_PROJECT:
        if (message.payload) {
          await this._handleCreateProject(message.payload.name, message.payload.description);
        }
        break;

      case WebviewMessageType.DB_UPDATE_PROJECT:
        if (message.payload) {
          await this._handleUpdateProject(message.payload.id, message.payload.name, message.payload.description);
        }
        break;

      case WebviewMessageType.DB_DELETE_PROJECT:
        if (message.payload) {
          await this._handleDeleteProject(message.payload.projectId);
        }
        break;

      case WebviewMessageType.DB_ASSIGN_CONNECTION_TO_PROJECT:
        if (message.payload) {
          await this._handleAssignConnectionToProject(message.payload.connectionId, message.payload.projectId);
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
    // Send the list of all supported database definitions
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

  private async _handleGetConnections() {
    const manager = ConnectionManager.getInstance();
    const connections = await manager.getAllConnections();
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

  private async _handleConnect(payload: { connectionId?: string; config?: any }) {
    const manager = ConnectionManager.getInstance();
    try {
      const connectionId = typeof payload.connectionId === "string" ? payload.connectionId : null;
      const driver = await manager.connect(payload.connectionId ?? payload.config);
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
      if (!config) {
        throw new Error("No active connection. Connect to a database first.");
      }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) {
        throw new Error(`No driver registered for database type: ${config.databaseId}`);
      }
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
      if (!config) {
        throw new Error("No active connection. Connect to a database first.");
      }
      const driver = manager.getDriver(config.databaseId);
      if (!driver) {
        throw new Error(`No driver registered for database type: ${config.databaseId}`);
      }
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

  private _handleListProjects() {
    const manager = ConnectionManager.getInstance();
    this._provider.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_PROJECTS_LISTED,
      payload: { projects: manager.getProjects() },
    });
  }

  private async _handleCreateProject(name: string, description?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const project = await manager.createProject(name, description);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_PROJECT_CREATED,
        payload: { project },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleUpdateProject(id: string, name: string, description?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const project = await manager.updateProject(id, name, description);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_PROJECT_UPDATED,
        payload: { project },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleDeleteProject(projectId: string) {
    const manager = ConnectionManager.getInstance();
    try {
      await manager.deleteProject(projectId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_PROJECT_DELETED,
        payload: { projectId },
      });
    } catch (err) {
      this._sendError(err);
    }
  }

  private async _handleAssignConnectionToProject(connectionId: string, projectId?: string) {
    const manager = ConnectionManager.getInstance();
    try {
      const connection = await manager.assignConnectionToProject(connectionId, projectId);
      this._provider.HandleSendMessageToWebview({
        type: ExtensionMessageType.DB_PROJECT_ASSIGNED,
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