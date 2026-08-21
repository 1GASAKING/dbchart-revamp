import type { SchemaDesign, SchemaNode, DesignRelationship } from "@dbchart/schema";
import { autoArrangeNodes } from "./layout-utils";

/**
 * Framework-agnostic arranged design produced by the extension host.
 *
 * The host converts a raw {@link DatabaseSchema} into a {@link SchemaDesign}
 * (schema-node type), runs the layered layout algorithm, and forwards this
 * arrangement to the webview canvas so the recipient renders exactly what was
 * intended — no webview-side re-conversion or re-layout needed.
 */

/** A positioned React Flow-style node representing a schema node. */
export interface ArrangedDesignNode {
  id: string;
  type: "test";
  data: { node: SchemaNode };
  position: { x: number; y: number };
  sourcePosition: "right";
}

/** A React Flow-style edge connecting two arranged design nodes. */
export interface ArrangedDesignEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: "schema";
  animated: true;
  data: { relationshipId: string };
}

/** The complete arrangement payload sent to the webview canvas. */
export interface ArrangedDesign {
  nodes: ArrangedDesignNode[];
  edges: ArrangedDesignEdge[];
}

/**
 * Convert a {@link SchemaDesign} into an arranged (positioned) payload the
 * canvas can render directly. Layout is computed with the shared
 * {@link autoArrangeNodes} layered algorithm.
 */
export function arrangeSchemaDesign(design: SchemaDesign): ArrangedDesign {
  const nodes: ArrangedDesignNode[] = design.nodes.map((node) => ({
    id: node.id,
    type: "test",
    data: { node },
    position: { x: 0, y: 0 },
    sourcePosition: "right",
  }));

  const edges: ArrangedDesignEdge[] = design.relationships.map(
    (rel: DesignRelationship) => ({
      id: rel.id,
      source: rel.sourceNodeId,
      target: rel.targetNodeId,
      sourceHandle: `${rel.sourceFieldId}-source`,
      targetHandle: `${rel.targetFieldId}-target`,
      type: "schema",
      animated: true,
      data: { relationshipId: rel.id },
    })
  );

  const arranged = autoArrangeNodes(nodes, edges);
  return { nodes: arranged, edges };
}