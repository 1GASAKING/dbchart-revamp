import { WebviewMessageType } from "./webviewmessage";
import type { DesignFile } from "@dbchart/schema";
import type { ConnectionConfig } from "../../database/types/connection-config";

/** Payload for {@link WebviewMessageType.REQUEST_OPEN_FILE}. */
export interface OpenFilePayload {
  extensions: string[];
}

/** Payload for {@link WebviewMessageType.REQUEST_SAVE_FILE}. */
export interface SaveFilePayload {
  defaultFileName: string;
  extensions: string[];
  content: string;
  encoding?: "utf8" | "base64";
}

/** Payload for {@link WebviewMessageType.DB_SAVE_CONNECTION}. */
export interface SaveConnectionPayload {
  config: ConnectionConfig;
}

/** Payload for {@link WebviewMessageType.DB_TEST_CONNECTION}. */
export interface TestConnectionPayload {
  config: ConnectionConfig;
}

/** Payload for {@link WebviewMessageType.DB_CONNECT}. */
export interface ConnectPayload {
  connectionId?: string;
  config?: ConnectionConfig;
}

/** Payload for {@link WebviewMessageType.DB_EXECUTE_QUERY}. */
export interface ExecuteQueryPayload {
  query: string;
  params?: unknown[];
}

/** Payload for {@link WebviewMessageType.DB_GET_CONNECTION_CONFIG}. */
export interface GetConnectionConfigPayload {
  connectionId: string;
}

/**
 * Messages sent from the webview to the extension host.
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
    }
  | { messageType: typeof WebviewMessageType.DB_LIST_DATABASES }
  | { messageType: typeof WebviewMessageType.DB_GET_CONNECTIONS }
  | {
      messageType: typeof WebviewMessageType.DB_SAVE_CONNECTION;
      payload: SaveConnectionPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_TEST_CONNECTION;
      payload: TestConnectionPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_CONNECT;
      payload: ConnectPayload;
    }
  | { messageType: typeof WebviewMessageType.DB_DISCONNECT }
  | {
      messageType: typeof WebviewMessageType.DB_EXECUTE_QUERY;
      payload: ExecuteQueryPayload;
    }
  | { messageType: typeof WebviewMessageType.DB_GET_SCHEMA }
  | {
      messageType: typeof WebviewMessageType.DB_GET_CONNECTION_CONFIG;
      payload: GetConnectionConfigPayload;
    };

/** A design file payload (unused by the union above, kept for compatibility). */
export interface DesignFileMessage {
  messageType: typeof WebviewMessageType.OPEN_EDITOR;
  payload?: DesignFile;
}