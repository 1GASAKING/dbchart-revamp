import type { DatabaseSchema } from '../../database/drivers/database-driver';
import type { ConnectionConfig, ConnectionField, ConnectionTestResult,  SavedConnection, CloudAccount } from '../../database';
import type { QueryResult } from '../../database/drivers/database-driver';
import { ExtensionMessageType } from './extensionmessage';
import type { ArrangedDesign } from '../../../lib/utils/design-arrangement';
import { Group } from '@dbchart/schema';

/** Payload delivered with a {@link ExtensionMessageType.FILE_OPENED} message. */
export interface FileOpenedPayload {
  content: string;
  extension: string | null;
  filePath: string;
}

/** Error payload delivered with a {@link ExtensionMessageType.FILE_OPENED} message. */
export interface FileOpenedErrorPayload {
  error: string;
}

/** Payload delivered with a {@link ExtensionMessageType.FILE_SAVE_RESULT} message. */
export interface FileSaveResultPayload {
  success: boolean;
  filePath?: string;
  error?: string;
}

/** Database response payloads. */
export interface DBConnectionsListedPayload {
  connections: SavedConnection[];
}

export interface DBConnectionSavedPayload {
  connection: SavedConnection;
}

export interface DBConnectionTestedPayload {
  result: ConnectionTestResult;
}

export interface DBConnectedPayload {
  connected: boolean;
  databaseId: string;
  connectionId?: string;
}

export interface DBQueryResultPayload {
  result: QueryResult;
}

export interface DBErrorPayload {
  error: string;
  details?: Record<string, unknown>;
}

export interface DBConnectionConfigPayload {
  config: ConnectionConfig | null;
}

export interface DBSchemaPayload {
  schema: DatabaseSchema;
}

export interface DBConnectionDeletedPayload {
  connectionId: string;
}

export interface DBConnectionUpdatedPayload {
  connection: SavedConnection;
}

export interface DBProjectsListedPayload {
  groups: Group[];
}

export interface DBProjectCreatedPayload {
  group: Group;
}

export interface DBProjectDeletedPayload {
  groupId: string;
}

export interface DBProjectUpdatedPayload {
  group: Group;
}

export interface DBProjectAssignedPayload {
  connection: SavedConnection;
}

export interface DBCloudAccountsListedPayload {
  accounts: CloudAccount[];
}

export interface DBCloudAccountCreatedPayload {
  account: CloudAccount;
}

export interface DBCloudAccountDeletedPayload {
  accountId: string;
}

export interface EditorLoadTypesPayload {
  schema: DatabaseSchema;
}

/** Section tree for the active connection (Firestore/Realtime/Views/etc). */
export interface DBDatabaseTreeSection {
  id: string;
  label: string;
  icon: string;
  kind: "collection" | "table" | "path" | "view" | "analytics";
  items: DBDatabaseTreeItem[];
}

export interface DBDatabaseTreeItem {
  /** e.g. collection name, RTDB path, view id */
  id: string;
  name: string;
  kind: "collection" | "table" | "path" | "view" | "analytics";
  /** Optional metadata (e.g. estimated key count) */
  meta?: string;
}

export interface DBDatabaseTreePayload {
  sections: DBDatabaseTreeSection[];
}

/** Pre-arranged design (nodes + edges) rendered directly on the canvas. */
export interface EditorLoadArrangedDesignPayload {
  design: ArrangedDesign;
}

/** Shallow RTDB children for a given path (lazy-loaded). */
export interface DBRealtimeChildrenPayload {
  path: string;
  children: { key: string; hasChildren: boolean }[];
}

/** User-pinned paths for the active connection. */
export interface DBUserPathsListedPayload {
  paths: { id: string; connectionId: string; path: string; label: string; createdAt: number }[];
}

export interface DBUserPathAddedPayload {
  path: { id: string; connectionId: string; path: string; label: string; createdAt: number };
}

export interface DBUserPathRemovedPayload {
  id: string;
}

export interface DBDatabaseInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  preview?: boolean;
  installed: boolean;
  fields?: ConnectionField[];
}

/**
 * Messages sent from the extension host to the webview.
 */
export type ExtensionMessage =
  | { type: typeof ExtensionMessageType.WORKSPACEUPDATED }
  | { type: typeof ExtensionMessageType.SET_APP_MODE; mode?: "sidebar" | "editor" | "canvas" | "analytics" }
  | { type: typeof ExtensionMessageType.FILE_OPENED; payload: FileOpenedPayload | FileOpenedErrorPayload }
  | { type: typeof ExtensionMessageType.FILE_SAVE_RESULT; payload: FileSaveResultPayload }
  | { type: typeof ExtensionMessageType.DB_DATABASES_LISTED; payload: DBDatabaseInfo[] }
  | { type: typeof ExtensionMessageType.DB_CONNECTIONS_LISTED; payload: DBConnectionsListedPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTION_SAVED; payload: DBConnectionSavedPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTION_TESTED; payload: DBConnectionTestedPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTED; payload: DBConnectedPayload }
  | { type: typeof ExtensionMessageType.DB_DISCONNECTED }
  | { type: typeof ExtensionMessageType.DB_QUERY_RESULT; payload: DBQueryResultPayload }
  | { type: typeof ExtensionMessageType.DB_ERROR; payload: DBErrorPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTION_CONFIG; payload: DBConnectionConfigPayload }
  | { type: typeof ExtensionMessageType.DB_SCHEMA; payload: DBSchemaPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTION_DELETED; payload: DBConnectionDeletedPayload }
  | { type: typeof ExtensionMessageType.DB_CONNECTION_UPDATED; payload: DBConnectionUpdatedPayload }
  | { type: typeof ExtensionMessageType.DB_PROJECTS_LISTED; payload: DBProjectsListedPayload }
  | { type: typeof ExtensionMessageType.DB_PROJECT_CREATED; payload: DBProjectCreatedPayload }
  | { type: typeof ExtensionMessageType.DB_PROJECT_DELETED; payload: DBProjectDeletedPayload }
  | { type: typeof ExtensionMessageType.DB_PROJECT_UPDATED; payload: DBProjectUpdatedPayload }
  | { type: typeof ExtensionMessageType.DB_PROJECT_ASSIGNED; payload: DBProjectAssignedPayload }
  | { type: typeof ExtensionMessageType.DB_CLOUD_ACCOUNTS_LISTED; payload: DBCloudAccountsListedPayload }
  | { type: typeof ExtensionMessageType.DB_CLOUD_ACCOUNT_CREATED; payload: DBCloudAccountCreatedPayload }
  | { type: typeof ExtensionMessageType.DB_CLOUD_ACCOUNT_DELETED; payload: DBCloudAccountDeletedPayload }
  | { type: typeof ExtensionMessageType.EDITOR_LOAD_TYPES; payload: EditorLoadTypesPayload }
  | { type: typeof ExtensionMessageType.DB_TREE; payload: DBDatabaseTreePayload }
  | { type: typeof ExtensionMessageType.EDITOR_LOAD_ARRANGED_DESIGN; payload: EditorLoadArrangedDesignPayload }
  | { type: typeof ExtensionMessageType.DB_RTDB_CHILDREN; payload: DBRealtimeChildrenPayload }
  | { type: typeof ExtensionMessageType.DB_USER_PATHS_LISTED; payload: DBUserPathsListedPayload }
  | { type: typeof ExtensionMessageType.DB_USER_PATH_ADDED; payload: DBUserPathAddedPayload }
  | { type: typeof ExtensionMessageType.DB_USER_PATH_REMOVED; payload: DBUserPathRemovedPayload };