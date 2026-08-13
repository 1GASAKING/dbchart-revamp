import { useEdgesState, useNodesState, Position, MiniMap, type Connection, addEdge, type ReactFlowInstance } from "@xyflow/react"
import { CanvasComponentMainDiv, CanvasComponentReactFlow, CanvasComponentControls, CanvasComponentBackground } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import ConnectionLineComponent from "./connection-line-component"
import SchemaEdgeComponent from "../schemacomponents/schema-edge-component"
import ContextMenuComponent from "./contextmenu-component"
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import type { DesignFlowNode, DesignFlowEdge, ContextMenuData } from "../../types/schema-node-ui"
import { autoArrangeNodes, createSchemaNode, generateId } from "@lib/utils"
import { ToastProvider } from "../../contexts/toast-context"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"


const nodeTypes = {
    test: SchemaNodeComponent,
}

const edgeTypes = {
    schema: SchemaEdgeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes, onNodesChange] = useNodesState<DesignFlowNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<DesignFlowEdge>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
    const [filterState,setFilterState] = useState<boolean>()
    const [zoomValue, setZoomValue] = useState<string>("100")
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
                        color: "red",
                        fields: [
                            { id: "1", name: "id", dataType: "int", color: "#4CAF50" },
                            { id: "2", name: "name", dataType: "varchar" },
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
                        color: "blue",
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
                type: "schema",
                animated: true,
                data: { relationshipId: "rel-1", color: "#4CAF50" },
            },
        ]);

    }, [setNodes, setEdges])

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
        (connection: Connection) => {
            setEdges((eds) => {
                const sourceNode = nodes.find((n) => n.id === connection.source);
                const fieldId = connection.sourceHandle?.replace(/-source$|-target$/, "");
                const fieldColor = sourceNode?.data?.node?.fields.find((f) => f.id === fieldId)?.color;

                const newEdge: DesignFlowEdge = {
                    id: generateId("rel"),
                    source: connection.source,
                    target: connection.target,
                    sourceHandle: connection.sourceHandle,
                    targetHandle: connection.targetHandle,
                    type: "schema",
                    animated: true,
                    data: {
                        relationshipId: generateId("rel"),
                        color: fieldColor,
                    },
                };

                return addEdge(newEdge, eds);
            });
        },
        [setEdges, nodes]
    )

    const syncZoomValue = useCallback((viewport: { zoom: number }) => {
        setZoomValue(Math.round(viewport.zoom * 100).toString());
    }, []);

    const handleZoomInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setZoomValue(event.target.value.replace(/[^\d.]/g, ""));
    };

    const applyZoom = () => {
        const parsed = Number(zoomValue);
        if (Number.isFinite(parsed) && parsed > 0) {
            rfRef.current?.zoomTo(parsed / 100);
        } else {
            const current = rfRef.current?.getZoom() ?? 1;
            setZoomValue(Math.round(current * 100).toString());
        }
    };

    const handleZoomInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.currentTarget.blur();
        }
        if (event.key === "Escape") {
            setZoomValue(Math.round((rfRef.current?.getZoom() ?? 1) * 100).toString());
            event.currentTarget.blur();
        }
    };

    const handleAutoArrange = useCallback(() => {
        setNodes(autoArrangeNodes(nodes, edges));
        setTimeout(() => {
            rfRef.current?.fitView({ padding: 0.2, duration: 300 });
        }, 80);
    }, [nodes, edges, setNodes]);


    return (
        <ToastProvider>
            <CanvasComponentMainDiv>
                <CanvasComponentReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}

                    connectionLineComponent={ConnectionLineComponent}

                    onPaneContextMenu={handlePaneContextMenu}
                    onPaneClick={() => setContextMenu(null)}
                    onConnect={onConnect}
                    onMove={(_, viewport) => syncZoomValue(viewport)}


                    onInit={(instance) => { rfRef.current = instance }}
                    proOptions={{ hideAttribution: true, }}>
                    <CanvasComponentControls  >
                        <div className="button-holder" >
                            <VsButton onClick={() => setFilterState(!filterState) } title="filter">
                                <i className="codicon codicon-search" />
                            </VsButton>

                        </div>
                        <div className="button-holder" >
                            <VsButton onClick={() => rfRef.current?.fitView({ padding: 0.2, duration: 300 })} title="Fit to view">
                                <i className="codicon codicon-screen-full" />
                            </VsButton>

                        </div>
                        <div className="button-holder" >
                            <VsButton onClick={() => rfRef.current?.zoomIn()} title="zoom in">
                                <i className="codicon codicon-zoom-in" />
                            </VsButton>

                        </div>
                        <div className="value-input-holder" >
                            <input
                                value={zoomValue}
                                onChange={handleZoomInputChange}
                                onBlur={applyZoom}
                                onKeyDown={handleZoomInputKeyDown}
                                inputMode="decimal"
                                title="Zoom level (%)"
                            />
                            <span className="zoom-suffix">%</span>
                        </div>
                        <div className="button-holder" >
                            <VsButton onClick={() => rfRef.current?.zoomOut()} title="zoom out">
                                <i className="codicon codicon-zoom-out" />
                            </VsButton>

                        </div>
                        <div className="button-holder" >
                            <VsButton onClick={handleAutoArrange} title="auto arrange">
                                <i className="codicon codicon-layout" />
                            </VsButton>

                        </div>

                    </CanvasComponentControls>
                    <MiniMap
                        nodeColor="#007acc"
                        nodeStrokeColor="#454545"
                        bgColor="#1e1e1e"
                        maskColor="rgba(0, 0, 0, 0.6)"
                        style={{ width: 200, border: "1px solid #454545" }}
                    />
                    <CanvasComponentBackground />

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



