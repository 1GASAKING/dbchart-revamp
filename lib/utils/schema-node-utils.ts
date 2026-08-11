import type { SchemaNode } from "@dbchart/schema";
import { generateNodeId } from "./general-utils";

/** Default values used when creating a new SchemaNode */
const DEFAULT_SCHEMA_NODE: Omit<SchemaNode, "id"> = {
  label: "New Table",
  kind: "table",
  color: "blue",
  fields: [],
};

/**
 * Create and return a new SchemaNode with a unique id.
 * @param overrides - partial node properties to override the defaults
 */
export function createSchemaNode(
  overrides: Partial<Omit<SchemaNode, "id">> = {}
): SchemaNode {
  return {
    ...DEFAULT_SCHEMA_NODE,
    ...overrides,
    id: generateNodeId(),
  };
}
