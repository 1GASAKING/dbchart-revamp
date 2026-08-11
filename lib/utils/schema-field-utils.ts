import type { DesignField } from "@dbchart/schema";
import { generateFieldId } from "./general-utils";

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
  overrides: Partial<Omit<DesignField, "id">> = {}
): DesignField {
  return {
    ...DEFAULT_FIELD,
    ...overrides,
    id: generateFieldId(),
  };
}
