import { useEdgesState, useNodesState, Position, MiniMap } from "@xyflow/react"
import { CanvasComponentBackground, CanvasComponentMainDiv, CanvasComponentReactFlow } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import ConnectionLineComponent from "./connection-line-component"
import ContextMenuComponent from "./contextmenu-component"
import { useEffect, useState } from "react"
import type { DesignFlowNode, DesignFlowEdge, ContextMenuData } from "../../types/schema-node-ui"

const nodeTypes = {
    test: SchemaNodeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes] = useNodesState<DesignFlowNode>([])
    const [edges, setEdges] = useEdgesState<DesignFlowEdge>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
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
        const newNode: DesignFlowNode = {
            id: `node-${Date.now()}`,
            type: "test",
            data: {
                node: {
                    id: `node-${Date.now()}`,
                    color:"red",
                    label: node.label,
                    kind: node.kind as "table" | "view",
                    fields: [],
                },
            },
            position: { x: contextMenu?.x ?? 100, y: contextMenu?.y ?? 100 },
        };
        setNodes((nds) => [...nds, newNode]);
        setContextMenu(null);
    };

    return (
        <CanvasComponentMainDiv>
            <CanvasComponentReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                connectionLineComponent={ConnectionLineComponent}
            
                onPaneContextMenu={handlePaneContextMenu}
                onPaneClick={() => setContextMenu(null)}

                proOptions={{ hideAttribution: true, }}>
                <MiniMap
                    nodeColor="#007acc"
                    nodeStrokeColor="#454545"
                    bgColor="#1e1e1e"
                    maskColor="rgba(0, 0, 0, 0.6)"
                    style={{ width: 200, border: "1px solid #454545" }}
                />
                <CanvasComponentBackground
                />
                <ContextMenuComponent
                    contextMenu={contextMenu}
                    onCreateNode={handleCreateNode}
                />



            </CanvasComponentReactFlow>


        </CanvasComponentMainDiv>
    )

}

export default CanvasComponent
