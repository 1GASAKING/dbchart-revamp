import type { Node, Edge } from "@xyflow/react";
import type { SchemaNode, ServerNode, EndpointNode, AreaNodeDataType, NoteNodeDataType } from "@dbchart/schema";

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

/** Data payload carried by a sticky note node. */
export interface NoteNodeData extends Record<string, unknown> {
  note: NoteNodeDataType;
}

/** React Flow node type for design nodes */
export type DesignFlowNode = Node<DesignNodeData>;

/** React Flow node type for area containers (visual only, no handles). */
export type AreaFlowNode = Node<AreaNodeData>;

/** React Flow node type for sticky notes. */
export type NoteFlowNode = Node<NoteNodeData>;

/** Any node that can live on the canvas (design nodes, areas, or notes). */
export type CanvasNode = DesignFlowNode | AreaFlowNode | NoteFlowNode;

/**
 * Type guard: whether a canvas node is a design node (carries `data.node`)
 * versus a visual area node (carries `data.area`).
 */
export function isDesignNode(
  node: CanvasNode | undefined
): node is DesignFlowNode {
  return !!node && "node" in node.data;
}

/** Type guard: whether a canvas node is a sticky note (carries `data.note`). */
export function isNoteNode(
  node: CanvasNode | undefined
): node is NoteFlowNode {
  return !!node && "note" in node.data;
}

/** Type guard: whether a canvas node is an area (carries `data.area`). */
export function isAreaNode(
  node: CanvasNode | undefined
): node is AreaFlowNode {
  return !!node && "area" in node.data;
}

/** Data payload passed to a design edge */
export interface DesignEdgeData extends Record<string, unknown> {
  relationshipId: string;
  /** Stroke color for the rendered edge, copied from the source field. */
  color?: string;
  /** Whether this relationship is broken (field types no longer compatible). */
  broken?: boolean;
}

/** React Flow edge type for design relationships */
export type DesignFlowEdge = Edge<DesignEdgeData>;

/** Context menu position data */
export interface ContextMenuData {
  x: number;
  y: number;
  /** Present when the context menu targets a specific node. */
  nodeId?: string;
}

/** Sentinel target id meaning "pinned to the board" (no parent node). */
export const NOTE_BOARD_TARGET = "__board__";
