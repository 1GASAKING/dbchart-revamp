import type { DatabaseSchema } from '../../database/drivers/database-driver';
import type { ConnectionConfig, ConnectionField, ConnectionTestResult, Project, SavedConnection } from '../../database';
import type { QueryResult } from '../../database/drivers/database-driver';
import { ExtensionMessageType } from './extensionmessage';

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
  projects: Project[];
}

export interface DBProjectCreatedPayload {
  project: Project;
}

export interface DBProjectDeletedPayload {
  projectId: string;
}

export interface DBProjectUpdatedPayload {
  project: Project;
}

export interface DBProjectAssignedPayload {
  connection: SavedConnection;
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
  | { type: typeof ExtensionMessageType.SET_APP_MODE; mode?: "sidebar" | "editor" }
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
  | { type: typeof ExtensionMessageType.DB_PROJECT_ASSIGNED; payload: DBProjectAssignedPayload };
