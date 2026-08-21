import * as vscode from "vscode";
import { Logger } from "../../services/logging/logger";
import { WebviewMessage } from "../../shared/webview/type";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import { getWebviewHtmlContent, getWebviewHORContent } from "../shared/sharedWebviewHtml";
import { EditorMessageHandler } from "./editormessagehandler";
import { ExtensionMessage } from "../../shared/extensionmessage/types";
import { ConnectionManager } from "../../database/connection-manager";
import type { DatabaseSchema } from "@dbchart/schema";

export type EditorPanelMode = "editor" | "canvas";

export class EditorPanelProvider {
  private static readonly viewType = "dbchat.editorPanel";
  private _panel: vscode.WebviewPanel | undefined;
  private _messageHandler!: EditorMessageHandler;
  private _onConnectionsChangedDisposable?: { dispose(): void };
  private _pendingMode: EditorPanelMode = "editor";
  private _pendingSchema?: DatabaseSchema;

  public async openEditor(
    context: vscode.ExtensionContext,
    mode: EditorPanelMode = "editor",
    schema?: DatabaseSchema,
  ) {
    Logger.getInstance().log("Opening editor panel", true);

    this._pendingMode = mode;
    this._pendingSchema = schema;

    // Reuse the existing panel when it is already open, rather than creating a
    // duplicate. Push the new intent so the panel reactively re-enters the
    // requested mode/schema.
    if (this._panel) {
      this._panel.reveal(vscode.ViewColumn.One);
      if (this._pendingSchema) {
        this.sendMessageToWebview({
          type: ExtensionMessageType.EDITOR_LOAD_TYPES,
          payload: { schema: this._pendingSchema },
        });
      } else {
        this.sendMessageToWebview({
          type: ExtensionMessageType.SET_APP_MODE,
          mode: this._pendingMode,
        });
      }
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      EditorPanelProvider.viewType,
      "DBChart Editor",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          context.extensionUri,
          vscode.Uri.joinPath(context.extensionUri, "node_modules"),
          vscode.Uri.joinPath(context.extensionUri, "public"),
        ],
      },
    );

    // Set up message handler before loading the web page. The handler is aware
    // of the pending mode/schema and re-sends them once the webview launches.
    this._messageHandler = this._panel
      ? new EditorMessageHandler(
          this,
          this._panel,
          this._pendingMode,
          this._pendingSchema,
        )
      : this._messageHandler;

    this._panel.webview.html =
      context.extensionMode === vscode.ExtensionMode.Development
        ? await getWebviewHORContent(this._panel.webview, context.extensionUri)
        : getWebviewHtmlContent(this._panel.webview, context.extensionUri);

    this._panel.webview.postMessage({
      type: ExtensionMessageType.SET_APP_MODE,
      mode: this._pendingMode,
    });

    // If a schema was requested, deliver it once the webview signals it is
    // ready (WEBVIEW_DID_LAUNCH) as well as right away for resilience.
    if (this._pendingSchema) {
      this._panel.webview.postMessage({
        type: ExtensionMessageType.EDITOR_LOAD_TYPES,
        payload: { schema: this._pendingSchema },
      });
    }

    // Set up message listener using the handler
    this._panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this._messageHandler.handleMessage(message);
    });

    this._panel.onDidDispose(() => {
      this._onConnectionsChangedDisposable?.dispose();
      this._onConnectionsChangedDisposable = undefined;
      this._panel = undefined;
    });

    // Push the latest connection list to this webview whenever the
    // connection list changes elsewhere (e.g. sidebar or another panel).
    this._onConnectionsChangedDisposable = ConnectionManager.getInstance().onConnectionsChanged(async () => {
      await this._pushConnections();
    });
  }

  public getPendingMode(): EditorPanelMode {
    return this._pendingMode;
  }

  public getPendingSchema(): DatabaseSchema | undefined {
    return this._pendingSchema;
  }

  private async _pushConnections(): Promise<void> {
    const connections = await ConnectionManager.getInstance().getAllConnections();
    this.sendMessageToWebview({
      type: ExtensionMessageType.DB_CONNECTIONS_LISTED,
      payload: { connections },
    });
  }

  public sendMessageToWebview(message: ExtensionMessage): void {
    if (this._panel) {
      this._panel.webview.postMessage(message);
    }
  }
}