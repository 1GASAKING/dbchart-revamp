import type { SchemaNode } from "@dbchart/schema";
import { generateNodeColor, generateNodeId } from "../utils/general-utils";

/** Result of validating a schema node name */
export type SchemaNameError = "empty" | "duplicate" | null;

/**
 * Validate a schema node name within the given set of existing nodes.
 * @param name     - the proposed node name
 * @param ownId    - id of the node being edited (excluded from duplicate check)
 * @param allNodes - all nodes in the current design document
 * @returns an error code, or null if valid
 */
export function validateSchemaName(
  name: string,
  ownId: string,
  allNodes: { id: string; label: string }[],
): SchemaNameError {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "empty";
  }
  const duplicate = allNodes.some(
    (n) =>
      n.id !== ownId && n.label.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    return "duplicate";
  }
  return null;
}

/**
 * Get a human-readable message for a {@link SchemaNameError}.
 */
export function getSchemaNameErrorMessage(error: SchemaNameError): string {
  switch (error) {
    case "empty":
      return "Node name cannot be empty";
    case "duplicate":
      return "A node with this name already exists";
    default:
      return "";
  }
}

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

