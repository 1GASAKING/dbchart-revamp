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
  data?: { node?: { fields?: readonly unknown[] }; [key: string]: unknown };
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

/** Options for {@link findFreeNodePosition}. */
export interface FindFreeNodePositionOptions {
  /** Extra spacing added around node bounds. @default 24 */
  padding?: number;
}

/**
 * Find a position that does not overlap any existing node.
 *
 * Starts from the provided `preferred` position and, if it collides with an
 * existing node, searches outward on a grid for an empty slot.
 *
 * @returns a collision-free position.
 */
export function findFreeNodePosition<TNode extends LayoutNode>(
  nodes: TNode[],
  preferred: { x: number; y: number },
  size: { width: number; height: number },
  options: FindFreeNodePositionOptions = {}
): { x: number; y: number } {
  const padding = options.padding ?? 24;
  const candidate = { x: preferred.x, y: preferred.y };

  const overlaps = (pos: { x: number; y: number }) =>
    nodes.some((node) => {
      const nodeSize = estimateLayoutNodeSize(node);
      return (
        pos.x < node.position.x + nodeSize.width + padding &&
        pos.x + size.width + padding > node.position.x &&
        pos.y < node.position.y + nodeSize.height + padding &&
        pos.y + size.height + padding > node.position.y
      );
    });

  if (!overlaps(candidate)) {
    return candidate;
  }

  const stepX = size.width + padding;
  const stepY = size.height + padding;

  // Expand outward in rings until an empty slot is found.
  for (let ring = 1; ring < 100; ring++) {
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        const test = {
          x: candidate.x + dx * stepX,
          y: candidate.y + dy * stepY,
        };
        if (test.y < 0 || test.x < 0) {continue;}
        if (!overlaps(test)) {return test;}
      }
    }
  }

  // Fallback: place to the right of the widest point.
  const maxX = nodes.reduce(
    (max, node) =>
      Math.max(max, node.position.x + estimateLayoutNodeSize(node).width + padding),
    0
  );
  return { x: maxX, y: Math.max(0, preferred.y) };
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