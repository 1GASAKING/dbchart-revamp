import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { DesignFlowEdge } from "../../types/schema-node-ui";
import { useFieldSelectionContext } from "../../hooks/use-field-selection-hooks";

/**
 * Custom edge used for rendered connections between schema nodes.
 *
 * This is the edge that appears after a connection is made. It renders as a
 * smooth-step path (right-angle corners with rounded bends), and is drawn as a
 * dashed line. Setting `animated: true` on an edge also triggers React Flow's
 * marching-ants animation for this line.
 *
 * If the edge's `broken` flag is set (the connected fields' data types no
 * longer match), the edge renders in red with a zig-zag dash pattern to
 * visually indicate a broken relationship.
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
  const isBroken = data?.broken === true;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
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
    : isBroken
      ? "#f48771"
      : data?.color ?? "var(--vscode-editorHoverWidget-border, #2d2d2d)";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={"schema-edge" + (isBroken ? " schema-edge-broken" : "")}
        style={{
          stroke: color,
          strokeWidth: isHighlighted ? 4 : selected ? 3 : 2,
          strokeDasharray: isBroken ? "4 3" : "6 4",
          ...style,
        }}
      />
      {isBroken && (
        <EdgeLabelRenderer>
          <div
            className="schema-edge-broken-icon"
            title="Broken relationship: field types are no longer compatible"
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              left: labelX,
              top: labelY,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--vscode-editor-background, #1e1e1e)",
              border: "1px solid #f48771",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              pointerEvents: "all",
            }}
          >
            <i
              className="codicon codicon-warning"
              style={{ color: "#f48771", fontSize: 14, lineHeight: 1 }}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default SchemaEdgeComponent;