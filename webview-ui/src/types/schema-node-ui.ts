import type { Node, Edge } from "@xyflow/react";
import type { SchemaNode, ServerNode, EndpointNode } from "@dbchart/schema";

/** All possible node types in the design system */
export type DesignNode = SchemaNode | ServerNode | EndpointNode;

/** Data payload passed to the custom node component */
export interface DesignNodeData extends Record<string, unknown> {
  node: DesignNode;
}

/** React Flow node type for design nodes */
export type DesignFlowNode = Node<DesignNodeData>;

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
