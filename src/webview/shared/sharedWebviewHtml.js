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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewHtmlContent = getWebviewHtmlContent;
exports.getWebviewHORContent = getWebviewHORContent;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const getNonce_1 = require("../../utils/webview-utils/getNonce");
const getUri_1 = require("../../utils/webview-utils/getUri");
/**
 * Shared utility functions for generating webview HTML content.
 * Used by both sidebar (WebviewView) and editor panel (WebviewPanel) providers.
 */
function getWebviewHtmlContent(webview, extensionUri) {
    const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, [
        "webview-ui",
        "build",
        "assets",
        "index.css",
    ]);
    const scriptUri = (0, getUri_1.getUri)(webview, extensionUri, [
        "webview-ui",
        "build",
        "assets",
        "index.js",
    ]);
    const codiconsUri = (0, getUri_1.getUri)(webview, extensionUri, [
        "node_modules",
        "@vscode",
        "codicons",
        "dist",
        "codicon.css",
    ]);
    const nonce = (0, getNonce_1.getNonce)();
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
        <meta name="theme-color" content="#000000">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <link href="${codiconsUri}" rel="stylesheet" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';
            connect-src https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com;
            font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';
            img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}' 'unsafe-eval';">
        <title>DBCHART</title>
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}
async function getWebviewHORContent(webview, extensionUri) {
    const localPort = 5174;
    const localServerUrl = `localhost:${localPort}`;
    try {
        await axios_1.default.get(`http://${localServerUrl}`);
    }
    catch (error) {
        vscode.window.showErrorMessage("DBCHART: Local webview dev server is not running, HMR will not work. Please run 'npm run dev:webview' before launching the extension to enable HMR. Using bundled assets.");
        return getWebviewHtmlContent(webview, extensionUri);
    }
    const nonce = (0, getNonce_1.getNonce)();
    const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, [
        "webview-ui",
        "build",
        "assets",
        "index.css",
    ]);
    const codiconsUri = (0, getUri_1.getUri)(webview, extensionUri, [
        "node_modules",
        "@vscode",
        "codicons",
        "dist",
        "codicon.css",
    ]);
    const scriptEntrypoint = "src/main.tsx";
    const scriptUri = `http://${localServerUrl}/${scriptEntrypoint}`;
    const reactRefresh = /*html*/ `
    <script nonce="${nonce}" type="module">
      import RefreshRuntime from "http://${localServerUrl}/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
  `;
    const csp = [
        "default-src 'none'",
        `font-src ${webview.cspSource} https://cdnjs.cloudflare.com`,
        `style-src ${webview.cspSource} 'unsafe-inline' https://* http://${localServerUrl} http://0.0.0.0:${localPort}`,
        `img-src ${webview.cspSource} https: data:`,
        `script-src 'unsafe-eval' https://* http://${localServerUrl} http://0.0.0.0:${localPort} 'nonce-${nonce}'`,
        `connect-src https://* ws://${localServerUrl} ws://0.0.0.0:${localPort} http://${localServerUrl} http://0.0.0.0:${localPort}`,
    ];
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
        <meta http-equiv="Content-Security-Policy" content="${csp.join("; ")}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <link href="${codiconsUri}" rel="stylesheet" />
        <title>DBCHART</title>
      </head>
      <body>
        <div id="root"></div>
        ${reactRefresh}
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}
//# sourceMappingURL=sharedWebviewHtml.js.map