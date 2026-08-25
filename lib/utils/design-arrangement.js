"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrangeSchemaDesign = arrangeSchemaDesign;
const layout_utils_1 = require("./layout-utils");
/**
 * Convert a {@link SchemaDesign} into an arranged (positioned) payload the
 * canvas can render directly. Layout is computed with the shared
 * {@link autoArrangeNodes} layered algorithm.
 */
function arrangeSchemaDesign(design) {
    const nodes = design.nodes.map((node) => ({
        id: node.id,
        type: "test",
        data: { node },
        position: { x: 0, y: 0 },
        sourcePosition: "right",
    }));
    const edges = design.relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceNodeId,
        target: rel.targetNodeId,
        sourceHandle: `${rel.sourceFieldId}-source`,
        targetHandle: `${rel.targetFieldId}-target`,
        type: "schema",
        animated: true,
        data: { relationshipId: rel.id },
    }));
    const arranged = (0, layout_utils_1.autoArrangeNodes)(nodes, edges);
    return { nodes: arranged, edges };
}
//# sourceMappingURL=design-arrangement.js.map