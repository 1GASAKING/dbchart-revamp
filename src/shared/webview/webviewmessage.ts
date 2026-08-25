export const WebviewMessageType = {
  OPEN_EDITOR: "OPEN_EDITOR",
  OPEN_CREATE_CONNECTION: "OPEN_CREATE_CONNECTION",
  CLOSE_EDITOR: "CLOSE_EDITOR",
  WEBVIEW_DID_LAUNCH: "WEBVIEW_DID_LAUNCH",
  REQUEST_OPEN_FILE: "REQUEST_OPEN_FILE",
  REQUEST_SAVE_FILE: "REQUEST_SAVE_FILE",

  // Database operations
  DB_OPEN_DB_VIEW: "DB_OPEN_DB_VIEW",
  DB_LOAD_TYPES_INTO_EDITOR: "DB_LOAD_TYPES_INTO_EDITOR",
  DB_LIST_DATABASES: "DB_LIST_DATABASES",
  DB_GET_CONNECTIONS: "DB_GET_CONNECTIONS",
  DB_SAVE_CONNECTION: "DB_SAVE_CONNECTION",
  DB_TEST_CONNECTION: "DB_TEST_CONNECTION",
  DB_CONNECT: "DB_CONNECT",
  DB_DISCONNECT: "DB_DISCONNECT",
  DB_EXECUTE_QUERY: "DB_EXECUTE_QUERY",
  DB_GET_SCHEMA: "DB_GET_SCHEMA",
  DB_GET_CONNECTION_CONFIG: "DB_GET_CONNECTION_CONFIG",
  DB_DELETE_CONNECTION: "DB_DELETE_CONNECTION",
  DB_UPDATE_CONNECTION: "DB_UPDATE_CONNECTION",
  DB_LIST_GROUPS: "DB_LIST_GROUPS",
  DB_CREATE_GROUP: "DB_CREATE_GROUP",
  DB_UPDATE_GROUP: "DB_UPDATE_GROUP",
  DB_DELETE_GROUP: "DB_DELETE_GROUP",
  DB_ASSIGN_CONNECTION_TO_GROUP: "DB_ASSIGN_CONNECTION_TO_GROUP",
  DB_COPY_CONNECTION: "DB_COPY_CONNECTION",
  DB_LIST_CLOUD_ACCOUNTS: "DB_LIST_CLOUD_ACCOUNTS",
  DB_CREATE_CLOUD_ACCOUNT: "DB_CREATE_CLOUD_ACCOUNT",
  DB_DELETE_CLOUD_ACCOUNT: "DB_DELETE_CLOUD_ACCOUNT",

  /**
   * Generic tree / loading events shared across every database client.
   * e.g. a Firebase Firestore collection and a SQL table both use
   * DB_LOAD_ENTITY — only the driver-specific conversion differs host-side.
   *
   * User-pinned paths let users add custom locations (e.g. an RTDB path
   * like /users/2026) where their data lives, when auto-discovery is not
   * possible or too expensive.
   */
  DB_GET_TREE: "DB_GET_TREE",                       // get the database tree
  DB_LOAD_ENTITY: "DB_LOAD_ENTITY",                 // { entity, scope } → arranged design to canvas
  DB_GET_RTDB_CHILDREN: "DB_GET_RTDB_CHILDREN",     // { path, limit, orderBy } → shallow children list
  DB_GET_RTDB_TABLE_SHAPE: "DB_GET_RTDB_TABLE_SHAPE", // { path, limit } → JSON converted to table/columns/nested children
  DB_GET_USER_PATHS: "DB_GET_USER_PATHS",           // { } → pinned paths for active connection
  DB_ADD_USER_PATH: "DB_ADD_USER_PATH",             // { path, label } → pin a custom path
  DB_REMOVE_USER_PATH: "DB_REMOVE_USER_PATH",       // { id } → unpin a saved path
  DB_OPEN_ANALYTICS_VIEW: "DB_OPEN_ANALYTICS_VIEW", // { viewId } → open the analytics dashboard
} as const;

export type WebViewMessageType = (typeof WebviewMessageType)[keyof typeof WebviewMessageType];