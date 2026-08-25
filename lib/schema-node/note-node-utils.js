"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNoteNodeData = createNoteNodeData;
const general_utils_1 = require("../utils/general-utils");
/**
 * Create and return note node data with a unique id and a randomly generated
 * color.
 *
 * Notes are free-form sticky notes that can be pinned to a node, an area, or
 * left floating on the board.
 *
 * @param overrides - partial data properties to override the defaults
 */
function createNoteNodeData(overrides = {}) {
    return {
        id: (0, general_utils_1.generateNodeId)(),
        content: "",
        color: (0, general_utils_1.generateNodeColor)(),
        ...overrides,
    };
}
//# sourceMappingURL=note-node-utils.js.map