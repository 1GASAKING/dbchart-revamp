export const WebviewMessageType = {
    OPEN_EDITOR: "OPEN_EDITOR",
    WEBVIEW_DID_LAUNCH:"WEBVIEW_DID_LAUNCH"
} as const;

export type WebViewMessageType = (typeof WebviewMessageType)[keyof typeof WebviewMessageType];