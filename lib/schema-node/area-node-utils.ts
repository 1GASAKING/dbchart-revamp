import type { AreaNodeDataType } from "@dbchart/schema";
import { generateNodeColor, generateNodeId } from "../utils/general-utils";

/** Result of validating an area name */
export type AreaNameError = "empty" | "duplicate" | null;

/**
 * Validate an area name within the given set of existing areas.
 * @param name        - the proposed area name
 * @param ownId       - id of the area being edited (excluded from duplicate check)
 * @param allAreas    - all areas in the current design document
 * @returns an error code, or null if valid
 */
export function validateAreaName(
  name: string,
  ownId: string,
  allAreas: AreaNodeDataType[],
): AreaNameError {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "empty";
  }
  const duplicate = allAreas.some(
    (a) =>
      a.id !== ownId && a.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    return "duplicate";
  }
  return null;
}

/**
 * Get a human-readable message for an {@link AreaNameError}.
 */
export function getAreaNameErrorMessage(error: AreaNameError): string {
  switch (error) {
    case "empty":
      return "Area name cannot be empty";
    case "duplicate":
      return "An area with this name already exists";
    default:
      return "";
  }
}

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