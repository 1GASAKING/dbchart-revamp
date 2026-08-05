import { ExtensionMessageType } from './extensionmessage';

// webview will hold state
export interface ExtensionMessage{
    type: ExtensionMessageType;
    mode?: "sidebar" | "editor";
}