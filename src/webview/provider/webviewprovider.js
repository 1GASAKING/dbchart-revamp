"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../../services/logging/logger");
const sidebarmessagehandler_1 = require("./sidebarmessagehandler");
const sharedWebviewHtml_1 = require("../shared/sharedWebviewHtml");
const connection_manager_1 = require("../../database/connection-manager");
const extensionmessage_1 = require("../../shared/extensionmessage/extensionmessage");
class WebviewProvider {
    context;
    _webviemessagehanler;
    _view;
    _context;
    _onConnectionsChangedDisposable;
    constructor(context) {
        this.context = context;
        this._context = context;
    }
    async resolveWebviewView(webviewView) {
        logger_1.Logger.getInstance().log("resolving web view", true);
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
        this._webviemessagehanler = new sidebarmessagehandler_1.SidebarMessageHandler(this, this._view);
        webviewView.webview.html =
            this._context.extensionMode === vscode.ExtensionMode.Development
                ? await (0, sharedWebviewHtml_1.getWebviewHORContent)(webviewView.webview, this._context.extensionUri)
                : (0, sharedWebviewHtml_1.getWebviewHtmlContent)(webviewView.webview, this._context.extensionUri);
        this._setWebViewMessageListner(webviewView.webview);
        // Push the latest connection list to this webview whenever the
        // connection list changes elsewhere (e.g. the editor panel).
        this._onConnectionsChangedDisposable = connection_manager_1.ConnectionManager.getInstance().onConnectionsChanged(() => {
            void this._pushConnections();
        });
        // Also push once immediately so components that mount while the view is
        // still resolving still receive the current list even if their own
        // initial DB_GET_CONNECTIONS request raced startup.
        void this._pushConnections();
        webviewView.onDidDispose(() => {
            this._onConnectionsChangedDisposable?.dispose();
            this._onConnectionsChangedDisposable = undefined;
        });
    }
    HandleSendMessageToWebview(message) {
        // TODO: Implement actual chat logic
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
    _setWebViewMessageListner(webview) {
        webview.onDidReceiveMessage((e) => this._webviemessagehanler.handleMessage(e));
    }
    async _pushConnections() {
        const connections = await connection_manager_1.ConnectionManager.getInstance().getAllConnections();
        this.HandleSendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTIONS_LISTED,
            payload: { connections },
        });
    }
    /**
     * Delegates to shared HTML generation function.
     * Maintained for backward compatibility with subclasses that may call it.
     */
    _getWebviewHtmlContent(webview) {
        return (0, sharedWebviewHtml_1.getWebviewHtmlContent)(webview, this._context.extensionUri);
    }
    /**
     * Connects to the local Vite dev server to allow HMR, with fallback to the bundled assets.
     * Delegates to shared HTML generation function.
     * Maintained for backward compatibility with subclasses that may call it.
     */
    async _getWebviewHORContent(webview) {
        return (0, sharedWebviewHtml_1.getWebviewHORContent)(webview, this._context.extensionUri);
    }
}
exports.WebviewProvider = WebviewProvider;
//# sourceMappingURL=webviewprovider.js.map