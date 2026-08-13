import { useEdgesState, useNodesState, Position, MiniMap, Controls, type Connection, addEdge, type ReactFlowInstance } from "@xyflow/react"
import {  CanvasComponentMainDiv, CanvasComponentReactFlow } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import ConnectionLineComponent from "./connection-line-component"
import ContextMenuComponent from "./contextmenu-component"
import { useCallback, useEffect, useRef, useState } from "react"
import type { DesignFlowNode, DesignFlowEdge, ContextMenuData } from "../../types/schema-node-ui"
import { createSchemaNode } from "@lib/utils"
import { ToastProvider } from "../../contexts/toast-context"

const filterBarStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 12,
  left: 12,
  zIndex: 10,
  display: "flex",
  gap: 6,
}

const nodeTypes = {
    test: SchemaNodeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes,onNodesChange] = useNodesState<DesignFlowNode>([])
    const [edges, setEdges,onEdgesChange] = useEdgesState<DesignFlowEdge>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
    const [filterText, setFilterText] = useState("");
    const rfRef = useRef<ReactFlowInstance<DesignFlowNode, DesignFlowEdge> | null>(null);
    useEffect(() => {

        setNodes([
            {
                id: '1',
                type: "test",
                data: {
                    node: {
                        id: "1",
                        label: "Users",
                        kind: "table",
                        color:"red",
                        fields: [
                            { id: "1", name: "id", dataType: "int", color: "#4CAF50" },
                            { id: "2", name: "name", dataType: "varchar"},
                            { id: "3", name: "email", dataType: "varchar", color: "#FF9800" },
                        ],
                    },
                },
                position: { x: 10, y: 0 },
                sourcePosition: Position.Right,

            },
            {
                id: '2',
                type: "test",
                data: {
                    node: {
                        id: "2",
                        label: "Orders",
                        kind: "table",
                        color:"blue",
                        fields: [
                            { id: "1", name: "id", dataType: "int", color: "#4CAF50" },
                            { id: "2", name: "user_id", dataType: "int", color: "#2196F3" },
                            { id: "3", name: "total", dataType: "decimal", connectable: false, color: "#FF9800" },
                        ],
                    },
                },
                position: { x: 400, y: 0 },
                sourcePosition: Position.Right,

            },
            {
                id: 'test-simple',
                type: "test",
                data: {
                    node: {
                        id: "test-simple",
                        label: "TEST-SIMPLE",
                        kind: "table",
                        color: "green",
                        fields: [],
                    },
                },
                position: { x: 10, y: 150 },
                sourcePosition: Position.Right,
            },
        ]);

        setEdges([
            {
                id: "rel-1",
                source: "1",
                target: "2",
                sourceHandle: "1-source",
                targetHandle: "2-target",
                data: { relationshipId: "rel-1" },
            },
        ]);

    }, [setNodes,setEdges])

    const handlePaneContextMenu = (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
    };

    const handleCreateNode = (node: { label: string; kind: string }) => {
        const schemaNode = createSchemaNode({
            label: node.label,
            kind: node.kind as "table" | "view",
        });
        const newNode: DesignFlowNode = {
            id: schemaNode.id,
            type: "test",
            data: { node: schemaNode },
            position: { x: contextMenu?.x ?? 100, y: contextMenu?.y ?? 100 },
        };
        setNodes((nds) => [...nds, newNode]);
        setContextMenu(null);
    };
     const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )


    return (
        <ToastProvider>
        <CanvasComponentMainDiv>
            <CanvasComponentReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                   onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
                
                connectionLineComponent={ConnectionLineComponent}
            
                onPaneContextMenu={handlePaneContextMenu}
                onPaneClick={() => setContextMenu(null)}
                onConnect={onConnect}
                onNodeClick={(_event, node) => {
                    console.log("[DEBUG] Node clicked:", node.id, node.selected);
                }}

                onInit={(instance) => { rfRef.current = instance }}
                proOptions={{ hideAttribution: true, }}>
                <Controls showInteractive={false} position="bottom-center" />
                <MiniMap
                    nodeColor="#007acc"
                    nodeStrokeColor="#454545"
                    bgColor="#1e1e1e"
                    maskColor="rgba(0, 0, 0, 0.6)"
                    style={{ width: 200, border: "1px solid #454545" }}
                />
                <div style={filterBarStyle}>
                    <input
                        type="text"
                        placeholder="Filter nodes..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{
                            width: 200,
                            height: 28,
                            padding: "0 8px",
                            background: "var(--vscode-input-background, #3c3c3c)",
                            color: "var(--vscode-input-foreground, #cccccc)",
                            border: "1px solid var(--vscode-input-border, #454545)",
                            borderRadius: 4,
                            fontSize: 12,
                            outline: "none",
                        }}
                    />
                    <button
                        onClick={() => rfRef.current?.fitView({ padding: 0.2, duration: 300 })}
                        title="Fit view"
                        style={{
                            width: 28, height: 28, border: "1px solid var(--vscode-editorWidget-border, #454545)",
                            borderRadius: 4, background: "var(--vscode-editor-background, #1e1e1e)",
                            color: "var(--vscode-editor-foreground, #cccccc)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                        }}
                    >
                        <i className="codicon codicon-screen-full" />
                    </button>
                </div>
                <ContextMenuComponent
                    contextMenu={contextMenu}
                    onCreateNode={handleCreateNode}
                />
                



            </CanvasComponentReactFlow>

        </CanvasComponentMainDiv>
        </ToastProvider>
    )

}

export default CanvasComponent



