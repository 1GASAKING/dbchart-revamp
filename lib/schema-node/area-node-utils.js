"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAreaName = validateAreaName;
exports.getAreaNameErrorMessage = getAreaNameErrorMessage;
exports.createAreaNodeData = createAreaNodeData;
const general_utils_1 = require("../utils/general-utils");
/**
 * Validate an area name within the given set of existing areas.
 * @param name        - the proposed area name
 * @param ownId       - id of the area being edited (excluded from duplicate check)
 * @param allAreas    - all areas in the current design document
 * @returns an error code, or null if valid
 */
function validateAreaName(name, ownId, allAreas) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return "empty";
    }
    const duplicate = allAreas.some((a) => a.id !== ownId && a.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
        return "duplicate";
    }
    return null;
}
/**
 * Get a human-readable message for an {@link AreaNameError}.
 */
function getAreaNameErrorMessage(error) {
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
function createAreaNodeData(overrides = {}) {
    return {
        id: (0, general_utils_1.generateNodeId)(),
        name: "New Area",
        color: (0, general_utils_1.generateNodeColor)(),
        ...overrides,
    };
}
//# sourceMappingURL=area-node-utils.js.map