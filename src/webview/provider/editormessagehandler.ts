import { Logger } from "../../services/logging/logger";
import { WebviewMessage } from "../../shared/webview/type";
import { WebviewMessageType } from "../../shared/webview/webviewmessage";
import { EditorPanelProvider } from "./editorpanelprovider";
import * as vscode from "vscode";
import { ImessageHandler } from "./IMessageHandler";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";

export class EditorMessageHandler implements ImessageHandler {
    constructor (private _provider:EditorPanelProvider, private _view:vscode.WebviewPanel){

    }
    public async handleMessage( messgae :WebviewMessage)
    {
        
        Logger.getInstance().log(messgae.messgaseType.toString(),true);
        switch (messgae.messgaseType) {
            case WebviewMessageType.WEBVIEW_DID_LAUNCH:
                this._provider.sendMessageToWebview({
                    type:ExtensionMessageType.SET_APP_MODE,
                    mode:"editor",
                });
                
            
                break;
        
            default:
                break;
        }
        

    }
}


