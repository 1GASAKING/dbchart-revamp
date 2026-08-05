import * as vscode from "vscode";
import axios from "axios";
import { getNonce } from "../../utils/webview-utils/getNonce";
import { getUri } from "../../utils/webview-utils/getUri";

/**
 * Shared utility functions for generating webview HTML content.
 * Used by both sidebar (WebviewView) and editor panel (WebviewPanel) providers.
 */

export function getWebviewHtmlContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const stylesUri = getUri(webview, extensionUri, [
    "webview-ui",
    "build",
    "assets",
    "index.css",
  ]);
  const scriptUri = getUri(webview, extensionUri, [
    "webview-ui",
    "build",
    "assets",
    "index.js",
  ]);
  const codiconsUri = getUri(webview, extensionUri, [
    "node_modules",
    "@vscode",
    "codicons",
    "dist",
    "codicon.css",
  ]);
  const nonce = getNonce();

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

export async function getWebviewHORContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): Promise<string> {
  const localPort = 5174;
  const localServerUrl = `localhost:${localPort}`;

  try {
    await axios.get(`http://${localServerUrl}`);
  } catch (error) {
    vscode.window.showErrorMessage(
      "DBCHART: Local webview dev server is not running, HMR will not work. Please run 'npm run dev:webview' before launching the extension to enable HMR. Using bundled assets.",
    );
    return getWebviewHtmlContent(webview, extensionUri);
  }

  const nonce = getNonce();
  const stylesUri = getUri(webview, extensionUri, [
    "webview-ui",
    "build",
    "assets",
    "index.css",
  ]);
  const codiconsUri = getUri(webview, extensionUri, [
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