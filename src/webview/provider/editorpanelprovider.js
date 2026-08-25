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
exports.EditorPanelProvider = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../../services/logging/logger");
const extensionmessage_1 = require("../../shared/extensionmessage/extensionmessage");
const sharedWebviewHtml_1 = require("../shared/sharedWebviewHtml");
const editormessagehandler_1 = require("./editormessagehandler");
const connection_manager_1 = require("../../database/connection-manager");
class EditorPanelProvider {
    static viewType = "dbchat.editorPanel";
    _panel;
    _messageHandler;
    _onConnectionsChangedDisposable;
    _pendingMode = "editor";
    _pendingSchema;
    _pendingDesign;
    async openEditor(context, mode = "editor", schema, design) {
        logger_1.Logger.getInstance().log("Opening editor panel", true);
        this._pendingMode = mode;
        this._pendingSchema = schema;
        this._pendingDesign = design;
        // Reuse the existing panel when it is already open, rather than creating a
        // duplicate. Push the new intent so the panel reactively re-enters the
        // requested mode/schema.
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
            if (this._pendingDesign) {
                this.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_ARRANGED_DESIGN,
                    payload: { design: this._pendingDesign },
                });
            }
            else if (this._pendingSchema) {
                this.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_TYPES,
                    payload: { schema: this._pendingSchema },
                });
            }
            else {
                this.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.SET_APP_MODE,
                    mode: this._pendingMode,
                });
            }
            return;
        }
        this._panel = vscode.window.createWebviewPanel(EditorPanelProvider.viewType, "DBChart Editor", vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                context.extensionUri,
                vscode.Uri.joinPath(context.extensionUri, "node_modules"),
                vscode.Uri.joinPath(context.extensionUri, "public"),
            ],
        });
        // Set up message handler before loading the web page. The handler is aware
        // of the pending mode/schema and re-sends them once the webview launches.
        this._messageHandler = this._panel
            ? new editormessagehandler_1.EditorMessageHandler(this, this._panel, this._pendingMode, this._pendingSchema, this._pendingDesign)
            : this._messageHandler;
        this._panel.webview.html =
            context.extensionMode === vscode.ExtensionMode.Development
                ? await (0, sharedWebviewHtml_1.getWebviewHORContent)(this._panel.webview, context.extensionUri)
                : (0, sharedWebviewHtml_1.getWebviewHtmlContent)(this._panel.webview, context.extensionUri);
        this._panel.webview.postMessage({
            type: extensionmessage_1.ExtensionMessageType.SET_APP_MODE,
            mode: this._pendingMode,
        });
        // If a schema/design was requested, deliver it once the webview signals it
        // is ready (WEBVIEW_DID_LAUNCH) as well as right away for resilience.
        if (this._pendingDesign) {
            this._panel.webview.postMessage({
                type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_ARRANGED_DESIGN,
                payload: { design: this._pendingDesign },
            });
        }
        else if (this._pendingSchema) {
            this._panel.webview.postMessage({
                type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_TYPES,
                payload: { schema: this._pendingSchema },
            });
        }
        // Set up message listener using the handler
        this._panel.webview.onDidReceiveMessage((message) => {
            this._messageHandler.handleMessage(message);
        });
        this._panel.onDidDispose(() => {
            this._onConnectionsChangedDisposable?.dispose();
            this._onConnectionsChangedDisposable = undefined;
            this._panel = undefined;
        });
        // Push the latest connection list to this webview whenever the
        // connection list changes elsewhere (e.g. sidebar or another panel).
        this._onConnectionsChangedDisposable = connection_manager_1.ConnectionManager.getInstance().onConnectionsChanged(async () => {
            await this._pushConnections();
        });
    }
    getPendingMode() {
        return this._pendingMode;
    }
    /** Close the editor panel (used by "Back to Sidebar" in editor-hosted pages). */
    closeEditor() {
        this._panel?.dispose();
    }
    getPendingSchema() {
        return this._pendingSchema;
    }
    getPendingDesign() {
        return this._pendingDesign;
    }
    async _pushConnections() {
        const connections = await connection_manager_1.ConnectionManager.getInstance().getAllConnections();
        this.sendMessageToWebview({
            type: extensionmessage_1.ExtensionMessageType.DB_CONNECTIONS_LISTED,
            payload: { connections },
        });
    }
    sendMessageToWebview(message) {
        if (this._panel) {
            this._panel.webview.postMessage(message);
        }
    }
}
exports.EditorPanelProvider = EditorPanelProvider;
//# sourceMappingURL=editorpanelprovider.js.map