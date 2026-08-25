import { WebviewMessageType } from "./webviewmessage";
import type { DesignFile } from "@dbchart/schema";
import type { ConnectionConfig, CloudAccountCredentials, CloudProvider } from "../../database/types/connection-config";

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

/** Payload for {@link WebviewMessageType.DB_DELETE_CONNECTION}. */
export interface DeleteConnectionPayload {
  connectionId: string;
}

/** Payload for {@link WebviewMessageType.DB_UPDATE_CONNECTION}. */
export interface UpdateConnectionPayload {
  id: string;
  config: ConnectionConfig;
}

/** Payload for {@link WebviewMessageType.DB_CREATE_GROUP}. */
export interface CreateGroupPayload {
  name: string;
  description?: string;
}

/** Payload for {@link WebviewMessageType.DB_UPDATE_GROUP}. */
export interface UpdateGroupPayload {
  id: string;
  name: string;
  description?: string;
}

/** Payload for {@link WebviewMessageType.DB_DELETE_GROUP}. */
export interface DeleteGroupPayload {
  groupId: string;
}

/** Payload for {@link WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP}. */
export interface AssignConnectionToGroupPayload {
  connectionId: string;
  groupId?: string;
}

/** Payload for {@link WebviewMessageType.DB_COPY_CONNECTION}. */
export interface CopyConnectionPayload {
  connectionId: string;
}

/** Payload for {@link WebviewMessageType.DB_CREATE_CLOUD_ACCOUNT}. */
export interface CreateCloudAccountPayload extends CloudAccountCredentials {
  provider: CloudProvider;
  name: string;
  region?: string;
  groupId?: string;
  tenantId?: string;
  subscriptionId?: string;
}

/** Payload for {@link WebviewMessageType.DB_DELETE_CLOUD_ACCOUNT}. */
export interface DeleteCloudAccountPayload {
  accountId: string;
}

export interface LoadEntityPayload {
  entity: string;
  scope?: string;
}

export interface GetRealtimeChildrenPayload {
  path: string;
  limit?: number;
  orderBy?: string;
}

/** Payload for {@link WebviewMessageType.DB_GET_RTDB_TABLE_SHAPE}. */
export interface GetRtdbTableShapePayload {
  path: string;
  /** Max records to sample while inferring the shape. Defaults host-side. */
  limit?: number;
}

export interface AddUserPathPayload {
  path: string;
  label?: string;
}

export interface RemoveUserPathPayload {
  id: string;
}

export interface OpenAnalyticsViewPayload {
  viewId: string;
}

/**
 * Messages sent from the webview to the extension host.
 */
export type WebviewMessage =
  | { messageType: typeof WebviewMessageType.OPEN_EDITOR }
  | { messageType: typeof WebviewMessageType.OPEN_CREATE_CONNECTION }
  | { messageType: typeof WebviewMessageType.CLOSE_EDITOR }
  | { messageType: typeof WebviewMessageType.WEBVIEW_DID_LAUNCH }
  | { messageType: typeof WebviewMessageType.DB_OPEN_DB_VIEW }
  | { messageType: typeof WebviewMessageType.DB_LOAD_TYPES_INTO_EDITOR }
  | { messageType: typeof WebviewMessageType.DB_GET_TREE }
  | { messageType: typeof WebviewMessageType.DB_LOAD_ENTITY; payload: LoadEntityPayload }
  | { messageType: typeof WebviewMessageType.DB_GET_RTDB_CHILDREN; payload: GetRealtimeChildrenPayload }
  | { messageType: typeof WebviewMessageType.DB_GET_RTDB_TABLE_SHAPE; payload: GetRtdbTableShapePayload }
  | { messageType: typeof WebviewMessageType.DB_GET_USER_PATHS }
  | { messageType: typeof WebviewMessageType.DB_ADD_USER_PATH; payload: AddUserPathPayload }
  | { messageType: typeof WebviewMessageType.DB_REMOVE_USER_PATH; payload: RemoveUserPathPayload }
  | { messageType: typeof WebviewMessageType.DB_OPEN_ANALYTICS_VIEW; payload: OpenAnalyticsViewPayload }
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
    }
  | {
      messageType: typeof WebviewMessageType.DB_DELETE_CONNECTION;
      payload: DeleteConnectionPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_UPDATE_CONNECTION;
      payload: UpdateConnectionPayload;
    }
  | { messageType: typeof WebviewMessageType.DB_LIST_GROUPS }
  | {
      messageType: typeof WebviewMessageType.DB_CREATE_GROUP;
      payload: CreateGroupPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_UPDATE_GROUP;
      payload: UpdateGroupPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_DELETE_GROUP;
      payload: DeleteGroupPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP;
      payload: AssignConnectionToGroupPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_COPY_CONNECTION;
      payload: CopyConnectionPayload;
    }
  | { messageType: typeof WebviewMessageType.DB_LIST_CLOUD_ACCOUNTS }
  | {
      messageType: typeof WebviewMessageType.DB_CREATE_CLOUD_ACCOUNT;
      payload: CreateCloudAccountPayload;
    }
  | {
      messageType: typeof WebviewMessageType.DB_DELETE_CLOUD_ACCOUNT;
      payload: DeleteCloudAccountPayload;
    };

/** A design file payload (unused by the union above, kept for compatibility). */
export interface DesignFileMessage {
  messageType: typeof WebviewMessageType.OPEN_EDITOR;
  payload?: DesignFile;
}