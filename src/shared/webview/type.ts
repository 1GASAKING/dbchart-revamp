import { type WebViewMessageType } from "./webviewmessage";
import type { DesignFile } from "@dbchart/schema";

export interface WebviewMessage {
    messageType: WebViewMessageType;
    payload?: DesignFile;
}