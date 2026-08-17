import { ExtensionMessageType } from './extensionmessage';

/** Payload delivered with a {@link ExtensionMessageType.FILE_OPENED} message. */
export interface FileOpenedPayload {
  /** The file contents read from disk (UTF-8). */
  content: string;
  /** The selected file's extension (without the dot), or null. */
  extension: string | null;
  /** The absolute path of the opened file. */
  filePath: string;
}

/** Error payload delivered with a {@link ExtensionMessageType.FILE_OPENED} message. */
export interface FileOpenedErrorPayload {
  error: string;
}

/** Payload delivered with a {@link ExtensionMessageType.FILE_SAVE_RESULT} message. */
export interface FileSaveResultPayload {
  /** True if the file was written successfully. */
  success: boolean;
  /** The absolute path the file was written to (or attempted). */
  filePath?: string;
  /** Present when `success` is false. */
  error?: string;
}

/**
 * Messages sent from the extension host to the webview.
 *
 * This is a discriminated union: the `type` determines the optional payload
 * fields.
 */
export type ExtensionMessage =
  | { type: typeof ExtensionMessageType.WORKSPACEUPDATED }
  | { type: typeof ExtensionMessageType.SET_APP_MODE; mode?: "sidebar" | "editor" }
  | {
      type: typeof ExtensionMessageType.FILE_OPENED;
      payload: FileOpenedPayload | FileOpenedErrorPayload;
    }
  | {
      type: typeof ExtensionMessageType.FILE_SAVE_RESULT;
      payload: FileSaveResultPayload;
    };