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
exports.EditorMessageHandler = void 0;
const logger_1 = require("../../services/logging/logger");
const webviewmessage_1 = require("../../shared/webview/webviewmessage");
const vscode = __importStar(require("vscode"));
const extensionmessage_1 = require("../../shared/extensionmessage/extensionmessage");
const file_utils_1 = require("../../utils/file-utils");
const databasemessagehandler_1 = require("./databasemessagehandler");
class EditorMessageHandler {
    _provider;
    _view;
    _initialMode;
    _initialSchema;
    _initialDesign;
    _dbMessageHandler;
    constructor(_provider, _view, _initialMode = "editor", _initialSchema, _initialDesign) {
        this._provider = _provider;
        this._view = _view;
        this._initialMode = _initialMode;
        this._initialSchema = _initialSchema;
        this._initialDesign = _initialDesign;
        this._dbMessageHandler = new databasemessagehandler_1.DatabaseMessageHandler((msg) => this._provider.sendMessageToWebview(msg));
    }
    async handleMessage(message) {
        logger_1.Logger.getInstance().log(message.messageType.toString(), true);
        // Route database messages to the shared handler
        if (await this._dbMessageHandler.handleMessage(message)) {
            return;
        }
        switch (message.messageType) {
            case webviewmessage_1.WebviewMessageType.WEBVIEW_DID_LAUNCH:
                this._provider.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.SET_APP_MODE,
                    mode: this._initialMode,
                });
                if (this._initialDesign) {
                    this._provider.sendMessageToWebview({
                        type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_ARRANGED_DESIGN,
                        payload: { design: this._initialDesign },
                    });
                }
                else if (this._initialSchema) {
                    this._provider.sendMessageToWebview({
                        type: extensionmessage_1.ExtensionMessageType.EDITOR_LOAD_TYPES,
                        payload: { schema: this._initialSchema },
                    });
                }
                break;
            case webviewmessage_1.WebviewMessageType.REQUEST_OPEN_FILE:
                await this.handleOpenFile(message.payload);
                break;
            case webviewmessage_1.WebviewMessageType.REQUEST_SAVE_FILE:
                await this.handleSaveFile(message.payload);
                break;
            case webviewmessage_1.WebviewMessageType.CLOSE_EDITOR:
                this._provider.closeEditor();
                break;
            default:
                break;
        }
    }
    /** Open a native file picker and send the contents back to the webview. */
    async handleOpenFile(payload) {
        try {
            const uris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: "Import schema",
                filters: {
                    "Schema files": payload.extensions.map((ext) => ext.replace(/^\./, "")),
                },
            });
            if (!uris || uris.length === 0) {
                // User cancelled the dialog.
                this._provider.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.FILE_OPENED,
                    payload: { error: "cancelled" },
                });
                return;
            }
            const content = await (0, file_utils_1.readFile)(uris[0]);
            const extension = uris[0].fsPath.split(".").pop()?.toLowerCase() ?? null;
            this._provider.sendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.FILE_OPENED,
                payload: {
                    content,
                    extension,
                    filePath: uris[0].fsPath,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this._provider.sendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.FILE_OPENED,
                payload: { error: message },
            });
        }
    }
    /** Show a save dialog and write the provided content to the chosen file. */
    async handleSaveFile(payload) {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(payload.defaultFileName),
                filters: {
                    "Schema files": payload.extensions.map((ext) => ext.replace(/^\./, "")),
                },
                saveLabel: "Export schema",
            });
            if (!uri) {
                // User cancelled the dialog.
                this._provider.sendMessageToWebview({
                    type: extensionmessage_1.ExtensionMessageType.FILE_SAVE_RESULT,
                    payload: { success: false },
                });
                return;
            }
            await (0, file_utils_1.writeFile)(uri, payload.content, payload.encoding ?? "utf8");
            this._provider.sendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.FILE_SAVE_RESULT,
                payload: { success: true, filePath: uri.fsPath },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this._provider.sendMessageToWebview({
                type: extensionmessage_1.ExtensionMessageType.FILE_SAVE_RESULT,
                payload: { success: false, error: message },
            });
        }
    }
}
exports.EditorMessageHandler = EditorMessageHandler;
//# sourceMappingURL=editormessagehandler.js.map