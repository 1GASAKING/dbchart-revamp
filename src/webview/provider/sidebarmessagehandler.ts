import { Logger } from "../../services/logging/logger";
import { ExtensionMessageType } from "../../shared/extensionmessage/extensionmessage";
import { WebviewMessage } from "../../shared/webview/type";
import { WebviewMessageType } from "../../shared/webview/webviewmessage";
import { EditorPanelProvider } from "./editorpanelprovider";
import { ImessageHandler } from "./IMessageHandler";
import { WebviewProvider } from "./webviewprovider";
import * as vscode from "vscode";

export class SidebarMessageHandler implements ImessageHandler {
  constructor(
    private _provider: WebviewProvider,
    private _view: vscode.WebviewView | vscode.WebviewPanel,
  ) {}

  public async handleMessage(messgae: WebviewMessage) {
    Logger.getInstance().log("hhsh" + messgae.messgaseType.toString(), true);
    switch (messgae.messgaseType) {
      case WebviewMessageType.OPEN_EDITOR:
        Logger.getInstance().log(
          "ddd" + (this._provider.context !== undefined),true
        );

        const editorPanelProvider = new EditorPanelProvider();
        editorPanelProvider.openEditor(this._provider.context);
        break;

      case "WEBVIEW_DID_LAUNCH":
        this._provider.HandleSendMessageToWebview({
          type: ExtensionMessageType.SET_APP_MODE,
          mode: "sidebar",
        });

        break;

      default:
        break;
    }
  }
}
