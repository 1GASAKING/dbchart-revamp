// Single source of truth lives in the shared @dbchart/schema package.
// Explicit slice to avoid duplicate star-export collisions in barrels.
export {
  ConnectionFieldType,
  type ConnectionField,
  type ConnectionFieldOption,
  type ConnectionConfig,
  type SavedConnection,
  type ConnectionTestResult,
} from "@dbchart/schema";