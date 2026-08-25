"use strict";
/**
 * Framework-agnostic graph traversal helpers.
 *
 * These helpers intentionally avoid importing React Flow types so the shared
 * library stays usable from both the extension host and the webview.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldKey = fieldKey;
exports.computeFieldHighlight = computeFieldHighlight;
exports.computeBrokenEdges = computeBrokenEdges;
/** Build a stable key for a field reference. */
function fieldKey(nodeId, fieldId) {
    return `${nodeId}:${fieldId}`;
}
/** Strip the `-source` / `-target` suffix from a handle id. */
function fieldIdFromHandle(handle) {
    if (!handle) {
        return null;
    }
    return handle.replace(/-source$|-target$/, "");
}
/**
 * Compute the transitively connected set of fields and their edges when a
 * field is selected.
 *
 * Starting at the selected field, it walks every edge attached to that field
 * into the field on the other end, and continues walking that field's edges,
 * and so on. This means the selected field, the fields directly connected to
 * it, and the fields connected to those fields (and so on) are all highlighted
 * at the field level — not the whole node.
 */
function computeFieldHighlight(field, edges) {
    const empty = { fieldKeys: new Set(), edgeIds: new Set() };
    if (!field) {
        return empty;
    }
    // Build a field-level adjacency map (both directions).
    const adjacency = new Map();
    const edgeKeyToId = new Map();
    const link = (a, b, edgeId) => {
        if (!a || !b) {
            return;
        }
        if (!adjacency.has(a)) {
            adjacency.set(a, new Set());
        }
        if (!adjacency.has(b)) {
            adjacency.set(b, new Set());
        }
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
        edgeKeyToId.set([a, b].sort().join("|"), edgeId);
    };
    for (const e of edges) {
        const sourceField = fieldIdFromHandle(e.sourceHandle);
        const targetField = fieldIdFromHandle(e.targetHandle);
        if (!sourceField || !targetField) {
            continue;
        }
        link(fieldKey(e.source, sourceField), fieldKey(e.target, targetField), e.id);
    }
    const start = fieldKey(field.nodeId, field.fieldId);
    const fieldKeys = new Set();
    const queue = [start];
    fieldKeys.add(start);
    while (queue.length > 0) {
        const current = queue.shift();
        for (const neighbor of adjacency.get(current) ?? []) {
            if (!fieldKeys.has(neighbor)) {
                fieldKeys.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    // Collect edges whose two endpoints are both in the highlighted set.
    const edgeIds = new Set();
    for (const e of edges) {
        const sourceField = fieldIdFromHandle(e.sourceHandle);
        const targetField = fieldIdFromHandle(e.targetHandle);
        if (!sourceField || !targetField) {
            continue;
        }
        const a = fieldKey(e.source, sourceField);
        const b = fieldKey(e.target, targetField);
        if (fieldKeys.has(a) && fieldKeys.has(b)) {
            edgeIds.add(e.id);
        }
    }
    return { fieldKeys, edgeIds };
}
/**
 * Given all nodes (as field sources) and all edges, compute which edges are
 * "broken" — i.e. the connected fields' data types are no longer compatible.
 *
 * This is used when a field's data type changes, so the UI can render a broken
 * connection line for any relationship whose endpoint types no longer match.
 */
function computeBrokenEdges(fields, edges) {
    const broken = new Set();
    for (const e of edges) {
        const sourceFieldId = fieldIdFromHandle(e.sourceHandle);
        const targetFieldId = fieldIdFromHandle(e.targetHandle);
        if (!sourceFieldId || !targetFieldId) {
            continue;
        }
        const source = fields.find((f) => f.nodeId === e.source && f.fieldId === sourceFieldId);
        const target = fields.find((f) => f.nodeId === e.target && f.fieldId === targetFieldId);
        if (!source || !target) {
            continue;
        }
        if (source.dataType !== target.dataType) {
            broken.add(e.id);
        }
    }
    return broken;
}
//# sourceMappingURL=graph-utils.js.map