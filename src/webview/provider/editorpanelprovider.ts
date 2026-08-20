import * as vscode from "vscode";
import { Logger } from "../../services/logging/logger";
import { WebviewMessage } from "../../shared/webview/type";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import { getWebviewHtmlContent, getWebviewHORContent } from "../shared/sharedWebviewHtml";
import { EditorMessageHandler } from "./editormessagehandler";
import { ExtensionMessage } from "../../shared/extensionmessage/types";
import { ConnectionManager } from "../../database/connection-manager";

export class EditorPanelProvider {
  private static readonly viewType = "dbchat.editorPanel";
  private _panel: vscode.WebviewPanel | undefined;
  private _messageHandler!: EditorMessageHandler;
  private _onConnectionsChangedDisposable?: { dispose(): void };

  public async openEditor(context: vscode.ExtensionContext) {
    Logger.getInstance().log("Opening editor panel", true);

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

    // Set up message handler before loading the web page
    this._messageHandler = new EditorMessageHandler(this, this._panel);

    this._panel.webview.html =
      context.extensionMode === vscode.ExtensionMode.Development
        ? await getWebviewHORContent(this._panel.webview, context.extensionUri)
        : getWebviewHtmlContent(this._panel.webview, context.extensionUri);

    this._panel.webview.postMessage({
      type: ExtensionMessageType.SET_APP_MODE,
      mode: "editor",
    });

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

  private async _pushConnections(): Promise<void> {
    const connections = await ConnectionManager.getInstance().getAllConnections();
    this.sendMessageToWebview({
      type: ExtensionMessageType.DB_CONNECTIONS_LISTED,
      payload: { connections },
    });
  }

  public sendMessageToWebview(message:ExtensionMessage): void {
    if (this._panel) {
      this._panel.webview.postMessage(message);
    }
  }
}