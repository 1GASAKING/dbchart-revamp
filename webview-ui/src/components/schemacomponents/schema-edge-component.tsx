import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { DesignFlowEdge } from "../../types/schema-node-ui";
import { useFieldSelectionContext } from "../../hooks/use-field-selection-hooks";

/**
 * Custom edge used for rendered connections between schema nodes.
 *
 * This is the edge that appears after a connection is made. It renders as a
 * smooth-step path (right-angle corners with rounded bends), and is drawn as a
 * dashed line. Setting `animated: true` on an edge also triggers React Flow's
 * marching-ants animation for this line.
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
  style,
}: EdgeProps<DesignFlowEdge>) => {
  const { highlightedEdgeIds } = useFieldSelectionContext();
  const isHighlighted = highlightedEdgeIds.has(id);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  // Fall back to the field color captured at connection time.
  const color = isHighlighted
    ? "var(--vscode-focusBorder, #007acc)"
    : data?.color ?? "var(--vscode-editorHoverWidget-border, #2d2d2d)";

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className="schema-edge"
      style={{
        stroke: color,
        strokeWidth: isHighlighted ? 4 : selected ? 3 : 2,
        strokeDasharray: "6 4",
        ...style,
      }}
    />
  );
};

export default SchemaEdgeComponent;