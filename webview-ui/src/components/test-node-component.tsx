import { type NodeProps, Handle, Position } from "@xyflow/react";
import type { DesignFlowNode } from "../types/schema-node-ui";

const TestNodeComponent = ({ data, selected }: NodeProps<DesignFlowNode>) => {
  console.log("[TEST-NODE] render", data.node.label, "selected:", selected);

  return (
    <div
      style={{
        padding: 10,
        border: selected ? "3px solid #007acc" : "1px solid #ccc",
        background: selected ? "#1a3a5c" : "#333",
        color: "#fff",
        borderRadius: 4,
        minWidth: 150,
        cursor: "pointer",
      }}
    >
      <strong>{selected ? "✅ " : ""}{data.node.label}</strong>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default TestNodeComponent;