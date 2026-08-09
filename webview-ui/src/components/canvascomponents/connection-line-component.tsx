import { useConnection, type ConnectionLineComponentProps } from "@xyflow/react";

const ConnectionLineComponent = ({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) => {
    const connection = useConnection();

    // Access the source node's data
    const fromNodeData = connection.fromNode?.data;

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
        </g>
    )
}

export default ConnectionLineComponent