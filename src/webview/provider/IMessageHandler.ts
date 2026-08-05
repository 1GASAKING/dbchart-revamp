import { WebviewMessage } from "../../shared/webview/type";

export interface ImessageHandler {
    handleMessage(message: WebviewMessage): void;
}
