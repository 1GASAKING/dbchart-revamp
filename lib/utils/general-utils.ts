import { NODE_COLORS } from "../schema-node/const";

/**
 * Generate a unique id with an optional prefix.
 * @param prefix - prefix for the generated id
 */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a unique id for a design field */
export function generateFieldId(): string {
  return generateId("field");
}

/** Generate a unique id for a design node */
export function generateNodeId(): string {
  return generateId("node");
}

/**
 * Generate a pseudo-random color from the curated node palette.
 * Used as a visual indicator so each schema node is visually distinct.
 */
export function generateNodeColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}
