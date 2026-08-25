"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFieldName = validateFieldName;
exports.areFieldTypesCompatible = areFieldTypesCompatible;
exports.getFieldNameErrorMessage = getFieldNameErrorMessage;
exports.createDesignField = createDesignField;
const general_utils_1 = require("./general-utils");
/**
 * Validate a field name within a list of existing fields.
 * @param name      - the proposed field name
 * @param ownId     - id of the field being edited (excluded from duplicate check)
 * @param allFields - all fields in the current node
 * @returns an error code, or null if valid
 */
function validateFieldName(name, ownId, allFields) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return "empty";
    }
    const duplicate = allFields.some((f) => f.id !== ownId && f.name.trim().toLowerCase() === trimmed.toLowerCase());
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
function areFieldTypesCompatible(source, target) {
    return source === target;
}
function getFieldNameErrorMessage(error) {
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
const DEFAULT_FIELD = {
    name: "new_field",
    dataType: "varchar",
};
/**
 * Create and return a new DesignField with a unique id.
 * @param overrides - partial field properties to override the defaults
 */
function createDesignField(overrides = {}) {
    return {
        ...DEFAULT_FIELD,
        ...overrides,
        id: (0, general_utils_1.generateFieldId)(),
    };
}
//# sourceMappingURL=schema-field-utils.js.map