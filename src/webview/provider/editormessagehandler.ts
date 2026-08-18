import { Logger } from "../../services/logging/logger";
import { WebviewMessage, OpenFilePayload, SaveFilePayload } from "../../shared/webview/type";
import { WebviewMessageType } from "../../shared/webview/webviewmessage";
import { EditorPanelProvider } from "./editorpanelprovider";
import * as vscode from "vscode";
import { ImessageHandler } from "./IMessageHandler";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import { readFile, writeFile } from "../../utils/file-utils";

export class EditorMessageHandler implements ImessageHandler {
    constructor(private _provider: EditorPanelProvider, private _view: vscode.WebviewPanel) {}

    public async handleMessage(message: WebviewMessage) {
        Logger.getInstance().log(message.messageType.toString(), true);
        switch (message.messageType) {
            case WebviewMessageType.WEBVIEW_DID_LAUNCH:
                this._provider.sendMessageToWebview({
                    type: ExtensionMessageType.SET_APP_MODE,
                    mode: "editor",
                });
                break;

            case WebviewMessageType.REQUEST_OPEN_FILE:
                await this.handleOpenFile(message.payload as OpenFilePayload);
                break;

            case WebviewMessageType.REQUEST_SAVE_FILE:
                await this.handleSaveFile(message.payload as SaveFilePayload);
                break;

            default:
                break;
        }
    }

    /** Open a native file picker and send the contents back to the webview. */
    private async handleOpenFile(payload: OpenFilePayload) {
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
                    type: ExtensionMessageType.FILE_OPENED,
                    payload: { error: "cancelled" },
                });
                return;
            }

            const content = await readFile(uris[0]);
            const extension = uris[0].fsPath.split(".").pop()?.toLowerCase() ?? null;

            this._provider.sendMessageToWebview({
                type: ExtensionMessageType.FILE_OPENED,
                payload: {
                    content,
                    extension,
                    filePath: uris[0].fsPath,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this._provider.sendMessageToWebview({
                type: ExtensionMessageType.FILE_OPENED,
                payload: { error: message },
            });
        }
    }

    /** Show a save dialog and write the provided content to the chosen file. */
    private async handleSaveFile(payload: SaveFilePayload) {
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
                    type: ExtensionMessageType.FILE_SAVE_RESULT,
                    payload: { success: false },
                });
                return;
            }

            await writeFile(uri, payload.content, payload.encoding ?? "utf8");

            this._provider.sendMessageToWebview({
                type: ExtensionMessageType.FILE_SAVE_RESULT,
                payload: { success: true, filePath: uri.fsPath },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this._provider.sendMessageToWebview({
                type: ExtensionMessageType.FILE_SAVE_RESULT,
                payload: { success: false, error: message },
            });
        }
    }
}