"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchemaName = validateSchemaName;
exports.getSchemaNameErrorMessage = getSchemaNameErrorMessage;
exports.createSchemaNode = createSchemaNode;
const general_utils_1 = require("../utils/general-utils");
/**
 * Validate a schema node name within the given set of existing nodes.
 * @param name     - the proposed node name
 * @param ownId    - id of the node being edited (excluded from duplicate check)
 * @param allNodes - all nodes in the current design document
 * @returns an error code, or null if valid
 */
function validateSchemaName(name, ownId, allNodes) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return "empty";
    }
    const duplicate = allNodes.some((n) => n.id !== ownId && n.label.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
        return "duplicate";
    }
    return null;
}
/**
 * Get a human-readable message for a {@link SchemaNameError}.
 */
function getSchemaNameErrorMessage(error) {
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
function createSchemaNode(overrides = {}) {
    return {
        label: "New Table",
        kind: "table",
        color: (0, general_utils_1.generateNodeColor)(),
        fields: [],
        ...overrides,
        id: (0, general_utils_1.generateNodeId)(),
    };
}
//# sourceMappingURL=schema-node-utils.js.map