import { WebviewMessageType } from "./webviewmessage";
import type { DesignFile } from "@dbchart/schema";

/** Payload for {@link WebviewMessageType.REQUEST_OPEN_FILE}. */
export interface OpenFilePayload {
  /** File extension filters (without the leading dot). */
  extensions: string[];
}

/** Payload for {@link WebviewMessageType.REQUEST_SAVE_FILE}. */
export interface SaveFilePayload {
  /** Default file name offered in the save dialog. */
  defaultFileName: string;
  /** File extension filters (without the leading dot). */
  extensions: string[];
  /** The serialized content to write. */
  content: string;
  /** How `content` should be decoded before writing. @default "utf8" */
  encoding?: "utf8" | "base64";
}

/**
 * Messages sent from the webview to the extension host.
 *
 * This is a discriminated union: the `messageType` determines the shape of
 * `payload`, so each message kind carries only the fields it needs.
 */
export type WebviewMessage =
  | { messageType: typeof WebviewMessageType.OPEN_EDITOR }
  | { messageType: typeof WebviewMessageType.WEBVIEW_DID_LAUNCH }
  | {
      messageType: typeof WebviewMessageType.REQUEST_OPEN_FILE;
      payload: OpenFilePayload;
    }
  | {
      messageType: typeof WebviewMessageType.REQUEST_SAVE_FILE;
      payload: SaveFilePayload;
    };

/** A design file payload (unused by the union above, kept for compatibility). */
export interface DesignFileMessage {
  messageType: typeof WebviewMessageType.OPEN_EDITOR;
  payload?: DesignFile;
}