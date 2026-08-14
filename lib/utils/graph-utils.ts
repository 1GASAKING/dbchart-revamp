/**
 * Framework-agnostic graph traversal helpers.
 *
 * These helpers intentionally avoid importing React Flow types so the shared
 * library stays usable from both the extension host and the webview.
 */

/** Minimal structural contract for a connectable edge (supports field handles). */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/** A selected field reference (a specific handle on a specific node). */
export interface SelectedField {
  nodeId: string;
  fieldId: string;
}

export interface FieldHighlightResult {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/**
 * Compute the nodes and edges to highlight when a field is selected.
 *
 * Highlights:
 * - the edge(s) connected to the selected field's handle,
 * - the directly connected node(s),
 * - and the node(s) connected to those nodes (one additional hop),
 * - plus every edge that links any two highlighted nodes.
 *
 * Returns empty sets when no field is selected.
 */
export function computeFieldHighlight(
  field: SelectedField | null,
  edges: GraphEdge[],
): FieldHighlightResult {
  if (!field) {
    return { nodeIds: new Set(), edgeIds: new Set() };
  }

  const sourceHandleId = `${field.fieldId}-source`;
  const targetHandleId = `${field.fieldId}-target`;

  // Edges that attach to the selected field's handle.
  const fieldEdges = edges.filter(
    (e) =>
      (e.source === field.nodeId && e.sourceHandle === sourceHandleId) ||
      (e.target === field.nodeId && e.targetHandle === targetHandleId),
  );

  const nodeIds = new Set<string>([field.nodeId]);
  const edgeIds = new Set<string>(fieldEdges.map((e) => e.id));

  // Direct neighbors.
  const neighbors = new Set<string>();
  for (const e of fieldEdges) {
    const other = e.source === field.nodeId ? e.target : e.source;
    neighbors.add(other);
    nodeIds.add(other);
  }

  // One additional hop: neighbors of the direct neighbors.
  for (const e of edges) {
    if (neighbors.has(e.source) && !nodeIds.has(e.target)) {
      nodeIds.add(e.target);
    }
    if (neighbors.has(e.target) && !nodeIds.has(e.source)) {
      nodeIds.add(e.source);
    }
  }

  // Include every edge between highlighted nodes.
  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      edgeIds.add(e.id);
    }
  }

  return { nodeIds, edgeIds };
}