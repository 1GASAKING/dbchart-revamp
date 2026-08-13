/**
 * Framework-agnostic layout utilities for arranging graph nodes.
 *
 * These helpers intentionally avoid importing any React Flow types so the
 * shared library stays usable from both the extension host and the webview.
 * Any node/edge shape that satisfies the structural interfaces below can be
 * arranged.
 */

/** Minimal structural contract for a graph node. */
export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
  data?: { node?: { fields?: readonly unknown[] } };
}

/** Minimal structural contract for a graph edge. */
export interface LayoutEdge {
  source: string;
  target: string;
}

/** Options for {@link autoArrangeNodes}. */
export interface AutoArrangeOptions {
  /** Horizontal spacing between columns. @default 80 */
  horizontalGap?: number;
  /** Vertical spacing between rows within a column. @default 40 */
  verticalGap?: number;
}

const DEFAULT_OPTIONS: Required<AutoArrangeOptions> = {
  horizontalGap: 80,
  verticalGap: 40,
};

/**
 * Estimate the rendered size of a node for layout purposes.
 *
 * Prefers actual measured dimensions, falls back to explicitly provided
 * width/height, and finally to a heuristic based on the field count.
 */
export function estimateLayoutNodeSize<TNode extends LayoutNode>(
  node: TNode
): { width: number; height: number } {
  const width = node.measured?.width ?? node.width ?? 300;
  const fieldCount = node.data?.node?.fields?.length ?? 0;
  const height = node.measured?.height ?? node.height ?? 60 + fieldCount * 28;
  return { width, height };
}

/**
 * Arrange nodes into a layered left-to-right layout.
 *
 * Columns are determined by each node's distance from a source node
 * (following edge direction). Nodes with no incoming edges are placed in the
 * first column, nodes in cycles are appended to trailing columns, and nodes
 * within a column are stacked vertically.
 *
 * @returns A new array of nodes with updated `position` values.
 */
export function autoArrangeNodes<
  TNode extends LayoutNode,
  TEdge extends LayoutEdge
>(nodes: TNode[], edges: TEdge[], options: AutoArrangeOptions = {}): TNode[] {
  if (nodes.length === 0){ return nodes;}

  const { horizontalGap, verticalGap } = { ...DEFAULT_OPTIONS, ...options };

  const idSet = new Set(nodes.map((n) => n.id));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adjacency.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((edge) => {
    if (!idSet.has(edge.source) || !idSet.has(edge.target)){ return;}
    if (edge.source === edge.target) {return;}
    const targets = adjacency.get(edge.source);
    if (!targets){ return;}
    if (!targets.includes(edge.target)) {
      targets.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  });

  const level = new Map<string, number>();
  nodes.forEach((n) => level.set(n.id, 0));

  const queue = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift() as string;
    processed.add(id);
    for (const target of adjacency.get(id) ?? []) {
      level.set(
        target,
        Math.max(level.get(target) ?? 0, (level.get(id) ?? 0) + 1)
      );
      const nextDegree = (inDegree.get(target) ?? 0) - 1;
      inDegree.set(target, nextDegree);
      if (nextDegree === 0) {queue.push(target);}
    }
  }

  // Remaining nodes are part of a cycle; place them after existing levels.
  let nextLevel = Math.max(0, ...level.values()) + 1;
  nodes.forEach((n) => {
    if (!processed.has(n.id)) {
      level.set(n.id, nextLevel++);
    }
  });

  const columns = new Map<number, TNode[]>();
  nodes.forEach((n) => {
    const lvl = level.get(n.id) ?? 0;
    const column = columns.get(lvl);
    if (column) {column.push(n);}
    else {columns.set(lvl, [n]);}
  });

  const sortedLevels = [...columns.keys()].sort((a, b) => a - b);

  const positioned: TNode[] = [];
  let x = 0;

  sortedLevels.forEach((lvl) => {
    const columnNodes = columns.get(lvl) ?? [];
    let columnWidth = 0;
    let y = 0;

    columnNodes.forEach((node) => {
      const { width, height } = estimateLayoutNodeSize(node);
      columnWidth = Math.max(columnWidth, width);
      positioned.push({ ...node, position: { x, y } });
      y += height + verticalGap;
    });

    x += columnWidth + horizontalGap;
  });

  return positioned;
}