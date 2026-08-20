import * as vscode from "vscode";
import { Logger } from "../../services/logging/logger";
import { ISidebarProvider } from "../isidebarprovider";
import { ExtensionMessage } from "../../shared/extensionmessage/types";
import { ImessageHandler } from "./IMessageHandler";
import { SidebarMessageHandler } from "./sidebarmessagehandler";
import { getWebviewHtmlContent, getWebviewHORContent } from "../shared/sharedWebviewHtml";
import { ConnectionManager } from "../../database/connection-manager";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";

export class WebviewProvider implements vscode.WebviewViewProvider, ISidebarProvider {
  protected _webviemessagehanler!: ImessageHandler;
  protected _view?: vscode.WebviewView;
  protected readonly _context: vscode.ExtensionContext;
  private _onConnectionsChangedDisposable?: { dispose(): void };

  constructor(readonly context: vscode.ExtensionContext) {
    this._context = context;
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    Logger.getInstance().log("resolving web view", true);
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri,
        vscode.Uri.joinPath(this._context.extensionUri, "node_modules"),
        vscode.Uri.joinPath(this._context.extensionUri, "public"),
      ],
    };
    // Immediately set the handler before launching the web page
    this._webviemessagehanler = new SidebarMessageHandler(this, this._view);

    webviewView.webview.html =
      this._context.extensionMode === vscode.ExtensionMode.Development
        ? await getWebviewHORContent(webviewView.webview, this._context.extensionUri)
        : getWebviewHtmlContent(webviewView.webview, this._context.extensionUri);
    this._setWebViewMessageListner(webviewView.webview);

    // Push the latest connection list to this webview whenever the
    // connection list changes elsewhere (e.g. the editor panel).
    this._onConnectionsChangedDisposable = ConnectionManager.getInstance().onConnectionsChanged(() => {
      void this._pushConnections();
    });

    webviewView.onDidDispose(() => {
      this._onConnectionsChangedDisposable?.dispose();
      this._onConnectionsChangedDisposable = undefined;
    });
  }

  public HandleSendMessageToWebview(message: ExtensionMessage) {
    // TODO: Implement actual chat logic
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _setWebViewMessageListner(
    webview: vscode.Webview,
  ) {
    webview.onDidReceiveMessage((e) =>
      this._webviemessagehanler!.handleMessage(e),
    );
  }

  private async _pushConnections(): Promise<void> {
    const connections = await ConnectionManager.getInstance().getAllConnections();
    this.HandleSendMessageToWebview({
      type: ExtensionMessageType.DB_CONNECTIONS_LISTED,
      payload: { connections },
    });
  }

  /**
   * Delegates to shared HTML generation function.
   * Maintained for backward compatibility with subclasses that may call it.
   */
  protected _getWebviewHtmlContent(webview: vscode.Webview): string {
    return getWebviewHtmlContent(webview, this._context.extensionUri);
  }

  /**
   * Connects to the local Vite dev server to allow HMR, with fallback to the bundled assets.
   * Delegates to shared HTML generation function.
   * Maintained for backward compatibility with subclasses that may call it.
   */
  protected async _getWebviewHORContent(
    webview: vscode.Webview,
  ): Promise<string> {
    return getWebviewHORContent(webview, this._context.extensionUri);
  }
}