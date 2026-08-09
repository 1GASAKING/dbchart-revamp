import { useConnection, type ConnectionLineComponentProps } from "@xyflow/react";
import type { DesignNode } from "../../types/schema-node-ui";

const ConnectionLineComponent = ({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) => {
    const connection = useConnection();

    // Get the source node's data
    const fromNodeData = connection.fromNode?.data as { node?: DesignNode } | undefined;
    const fromNode = fromNodeData?.node;

    // Get the handle ID (e.g., "1-source") and extract the field ID
    const handleId = connection.fromHandle?.id;
    const fieldId = handleId?.replace(/-source$|-target$/, "");

    // Find the field and use its color
    const fieldColor = fromNode?.fields.find(f => f.id === fieldId)?.color ?? "var(--vscode-editorHoverWidget-border, #2d2d2d)";

    return (
        <g>
            <path
                fill="none"
                stroke={fieldColor}
                strokeWidth={2}
                className="animated"
                d={`M${fromX},${fromY} C ${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
            />
            <circle
                cx={toX}
                cy={toY}
                fill={fieldColor}
                r={4}
            />
        </g>
    )
}

export default ConnectionLineComponent