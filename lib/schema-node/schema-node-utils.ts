import type { SchemaNode } from "@dbchart/schema";
import { generateNodeColor, generateNodeId } from "../utils/general-utils";

/**
 * Create and return a new SchemaNode with a unique id and a randomly
 * generated color.
 * @param overrides - partial node properties to override the defaults
 */
export function createSchemaNode(
  overrides: Partial<Omit<SchemaNode, "id">> = {}
): SchemaNode {
  return {
    label: "New Table",
    kind: "table",
    color: generateNodeColor(),
    fields: [],
    ...overrides,
    id: generateNodeId(),
  };
}

