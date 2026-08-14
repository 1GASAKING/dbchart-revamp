import type { AreaNodeDataType } from "@dbchart/schema";
import { generateNodeColor, generateNodeId } from "../utils/general-utils";

/**
 * Create and return area node data with a unique id and a randomly generated
 * color.
 *
 * Areas are purely visual grouping containers — they carry no fields or
 * relationships.
 *
 * @param overrides - partial data properties to override the defaults
 */
export function createAreaNodeData(
  overrides: Partial<Omit<AreaNodeDataType, "id">> = {}
): AreaNodeDataType {
  return {
    id: generateNodeId(),
    name: "New Area",
    color: generateNodeColor(),
    ...overrides,
  };
}