import { useConnection, type ConnectionLineComponentProps } from "@xyflow/react";

const ConnectionLineComponent = ({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) => {
    const connection = useConnection();

    // Access the source node's data
    const fromNodeData = connection.fromNode?.data as { node?: { label?: string } } | undefined;
    const sourceLabel = fromNodeData?.node?.label;

    return (
        <g>
            <path
                fill="none"
                stroke="#888"
                strokeWidth={2}
                className="animated"
                d={`M${fromX},${fromY} C ${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
            />
            <circle
                cx={toX}
                cy={toY}
                fill="#888"
                r={4}
            />
            {sourceLabel && (
                <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 10}
                    fill="#888"
                    fontSize={12}
                    textAnchor="middle"
                >
                    {sourceLabel}
                </text>
            )}
        </g>
    )
}

export default ConnectionLineComponent