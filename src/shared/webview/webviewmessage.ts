export const WebviewMessageType = {
    OPEN_EDITOR: "OPEN_EDITOR",
    WEBVIEW_DID_LAUNCH:"WEBVIEW_DID_LAUNCH",
    REQUEST_OPEN_FILE: "REQUEST_OPEN_FILE",
    REQUEST_SAVE_FILE: "REQUEST_SAVE_FILE",
} as const;

export type WebViewMessageType = (typeof WebviewMessageType)[keyof typeof WebviewMessageType];