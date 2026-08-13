import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { DesignFlowEdge } from "../../types/schema-node-ui";

/**
 * Custom edge used for rendered connections between schema nodes.
 *
 * This is the edge that appears after a connection is made. Its path and
 * styling can be edited here to customize how connections look.
 */
const SchemaEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<DesignFlowEdge>) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Fall back to the field color captured at connection time.
  const color =
    data?.color ?? "var(--vscode-editorHoverWidget-border, #2d2d2d)";

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className="schema-edge"
      style={{
        stroke: color,
        strokeWidth: selected ? 3 : 2,
      }}
    />
  );
};

export default SchemaEdgeComponent;