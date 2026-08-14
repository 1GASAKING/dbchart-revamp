import type { Node, Edge } from "@xyflow/react";
import type { SchemaNode, ServerNode, EndpointNode, AreaNodeDataType } from "@dbchart/schema";

/** All possible node types in the design system */
export type DesignNode = SchemaNode | ServerNode | EndpointNode;

/** Data payload passed to the custom node component */
export interface DesignNodeData extends Record<string, unknown> {
  node: DesignNode;
}

/** Data payload carried by an area (visual grouping container) node. */
export interface AreaNodeData extends Record<string, unknown> {
  area: AreaNodeDataType;
}

/** React Flow node type for design nodes */
export type DesignFlowNode = Node<DesignNodeData>;

/** React Flow node type for area containers (visual only, no handles). */
export type AreaFlowNode = Node<AreaNodeData>;

/** Any node that can live on the canvas (design nodes or visual areas). */
export type CanvasNode = DesignFlowNode | AreaFlowNode;

/**
 * Type guard: whether a canvas node is a design node (carries `data.node`)
 * versus a visual area node (carries `data.area`).
 */
export function isDesignNode(
  node: CanvasNode | undefined
): node is DesignFlowNode {
  return !!node && "node" in node.data;
}

/** Data payload passed to a design edge */
export interface DesignEdgeData extends Record<string, unknown> {
  relationshipId: string;
  /** Stroke color for the rendered edge, copied from the source field. */
  color?: string;
}

/** React Flow edge type for design relationships */
export type DesignFlowEdge = Edge<DesignEdgeData>;

/** Context menu position data */
export interface ContextMenuData {
  x: number;
  y: number;
}
