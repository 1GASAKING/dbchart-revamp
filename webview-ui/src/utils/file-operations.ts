 import { vscode } from "./vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import type {
  FileOpenedPayload,
  FileOpenedErrorPayload,
  FileSaveResultPayload,
} from "@shared/extensionmessage/types";

/**
 * A promise-based bridge for the native file pickers exposed by the extension
 * host. The webview asks the extension to show a dialog, and the extension
 * responds asynchronously with the result.
 */

interface OpenFileResult {
  content: string;
  extension: string | null;
  filePath: string;
}

interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

let openResolver: ((value: OpenFileResult | null) => void) | null = null;
let saveResolver: ((value: SaveFileResult | null) => void) | null = null;

/**
 * Resolve a pending open-file request from a FILE_OPENED extension message.
 * Called by App.tsx when it receives the message.
 */
export function resolveFileOpened(
  payload: FileOpenedPayload | FileOpenedErrorPayload
): void {
  if (!openResolver) return;
  if ("error" in payload) {
    // "cancelled" means the user dismissed the dialog; resolve with null.
    openResolver(payload.error === "cancelled" ? null : null);
    openResolver = null;
    return;
  }
  openResolver({
    content: payload.content,
    extension: payload.extension,
    filePath: payload.filePath,
  });
  openResolver = null;
}

/** Resolve a pending save-file request from a FILE_SAVE_RESULT message. */
export function resolveFileSaved(payload: FileSaveResultPayload): void {
  if (!saveResolver) return;
  saveResolver({
    success: payload.success,
    filePath: payload.filePath,
    error: payload.error,
  });
  saveResolver = null;
}

/**
 * Ask the extension host to show an "Open" dialog.
 *
 * @returns the file contents and path, or null if cancelled/errored.
 */
export function requestOpenFile(extensions: string[]): Promise<OpenFileResult | null> {
  return new Promise((resolve) => {
    openResolver = resolve;
    vscode._postMessage({
      messageType: WebviewMessageType.REQUEST_OPEN_FILE,
      payload: { extensions },
    });
  });
}

/**
 * Ask the extension host to show a "Save" dialog and write the content.
 *
 * @returns the save result, or null if cancelled.
 */
export function requestSaveFile(
  defaultFileName: string,
  extensions: string[],
  content: string,
  encoding: "utf8" | "base64" = "utf8"
): Promise<SaveFileResult | null> {
  return new Promise((resolve) => {
    saveResolver = resolve;
    vscode._postMessage({
      messageType: WebviewMessageType.REQUEST_SAVE_FILE,
      payload: { defaultFileName, extensions, content, encoding },
    });
  });
}
