import type { DesignField, FieldDataType } from "@dbchart/schema";
import { generateFieldId } from "./general-utils";

/** Result of validating a field name */
export type FieldNameError = "empty" | "duplicate" | null;

/**
 * Validate a field name within a list of existing fields.
 * @param name      - the proposed field name
 * @param ownId     - id of the field being edited (excluded from duplicate check)
 * @param allFields - all fields in the current node
 * @returns an error code, or null if valid
 */
export function validateFieldName(
  name: string,
  ownId: string,
  allFields: DesignField[],
): FieldNameError {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "empty";
  }
  const duplicate = allFields.some(
    (f) =>
      f.id !== ownId && f.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    return "duplicate";
  }
  return null;
}

/**
 * Whether two field data types are compatible for a relationship.
 *
 * Currently strict: a field may only connect to a field of the same type.
 */
export function areFieldTypesCompatible(
  source: FieldDataType,
  target: FieldDataType,
): boolean {
  return source === target;
}

export function getFieldNameErrorMessage(error: FieldNameError): string {
  switch (error) {
    case "empty":
      return "Field name cannot be empty";
    case "duplicate":
      return "A field with this name already exists";
    default:
      return "";
  }
}

/** Default values used when creating a new DesignField */
const DEFAULT_FIELD: Omit<DesignField, "id"> = {
  name: "new_field",
  dataType: "varchar",
};

/**
 * Create and return a new DesignField with a unique id.
 * @param overrides - partial field properties to override the defaults
 */
export function createDesignField(
  overrides: Partial<Omit<DesignField, "id">> = {},
): DesignField {
  return {
    ...DEFAULT_FIELD,
    ...overrides,
    id: generateFieldId(),
  };
}
