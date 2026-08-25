"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateFieldId = generateFieldId;
exports.generateNodeId = generateNodeId;
exports.generateNodeColor = generateNodeColor;
const const_1 = require("../schema-node/const");
/**
 * Generate a unique id with an optional prefix.
 * @param prefix - prefix for the generated id
 */
function generateId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
/** Generate a unique id for a design field */
function generateFieldId() {
    return generateId("field");
}
/** Generate a unique id for a design node */
function generateNodeId() {
    return generateId("node");
}
/**
 * Generate a pseudo-random color from the curated node palette.
 * Used as a visual indicator so each schema node is visually distinct.
 */
function generateNodeColor() {
    return const_1.NODE_COLORS[Math.floor(Math.random() * const_1.NODE_COLORS.length)];
}
//# sourceMappingURL=general-utils.js.map