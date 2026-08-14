import { useEdgesState, useNodesState, Position, MiniMap, type Connection, addEdge, type ReactFlowInstance } from "@xyflow/react"
import { CanvasComponentMainDiv, CanvasComponentReactFlow, CanvasComponentControls, CanvasComponentBackground } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import AreaNodeComponent from "../areanodecomponents/area-node-component"
import ConnectionLineComponent from "./connection-line-component"
import SchemaEdgeComponent from "../schemacomponents/schema-edge-component"
import ContextMenuComponent from "./contextmenu-component"
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import { type DesignFlowNode, type DesignFlowEdge, type ContextMenuData, type CanvasNode, isDesignNode, type AreaFlowNode, } from "../../types/schema-node-ui"
import { autoArrangeNodes, findFreeNodePosition, createSchemaNode, generateId, createAreaNodeData } from "@lib/utils"
import { ToastProvider } from "../../contexts/toast-context"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import AddNodeDialog, { type AddNodeFormData } from "../reusable-components/add-node-dialog"
import AddRelationshipDialog, { type RelationshipFormData } from "../reusable-components/add-relationship-dialog"


const nodeTypes = {
    test: SchemaNodeComponent,
    area: AreaNodeComponent,
}

const edgeTypes = {
    schema: SchemaEdgeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<DesignFlowEdge>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
    const [filterState,setFilterState] = useState<boolean>()
    const [zoomValue, setZoomValue] = useState<string>("100")
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false)
    const [creationPosition, setCreationPosition] = useState<ContextMenuData | null>(null)
    const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false)
    const rfRef = useRef<ReactFlowInstance<CanvasNode, DesignFlowEdge> | null>(null);
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
            {
                id: 'area-1',
                type: 'area',
                position: { x: 0, y: 300 },
                zIndex: -1,
                style: { width: 520, height: 280 },
                data: {
                    area: {
                        id: 'area-1',
                        name: 'Core Tables',
                        color: '#3949AB',
                    },
                },
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

    const handleCreateNode = (data: AddNodeFormData) => {
        const schemaNode = createSchemaNode({
            label: data.label,
            kind: data.kind,
            fields: data.fields,
        });

        // Convert the preserved context-menu click (screen pixels) into flow
        // coordinates, then nudge it to a spot that does not overlap existing nodes.
        const screenPos = creationPosition ?? { x: 100, y: 100 };
        const flowPos = rfRef.current?.screenToFlowPosition(screenPos) ?? screenPos;
        const freePos = findFreeNodePosition(
            nodes,
            flowPos,
            { width: 300, height: 60 + schemaNode.fields.length * 28 }
        );

        const newNode: DesignFlowNode = {
            id: schemaNode.id,
            type: "test",
            data: { node: schemaNode },
            position: freePos,
        };
        setNodes((nds) => [...nds, newNode]);
        setContextMenu(null);
        setCreationPosition(null);
        setIsAddNodeDialogOpen(false);
    };
    const handleCreateRelationship = (data: RelationshipFormData) => {
        const sourceNode = nodes.find((n) => n.id === data.sourceNodeId);
        const sourceField = isDesignNode(sourceNode)
            ? sourceNode.data.node.fields.find((f) => f.id === data.sourceFieldId)
            : undefined;

        const newEdge: DesignFlowEdge = {
            id: generateId("rel"),
            source: data.sourceNodeId,
            target: data.targetNodeId,
            sourceHandle: `${data.sourceFieldId}-source`,
            targetHandle: `${data.targetFieldId}-target`,
            type: "schema",
            animated: true,
            data: {
                relationshipId: generateId("rel"),
                color: sourceField?.color,
            },
        };

        setEdges((eds) => [...eds, newEdge]);
        setContextMenu(null);
        setIsAddRelationshipOpen(false);
    };

    const handleCreateArea = (position?: ContextMenuData | null) => {
        const areaData = createAreaNodeData();
        const screenPos = position ?? { x: 100, y: 100 };
        const flowPos = rfRef.current?.screenToFlowPosition(screenPos) ?? screenPos;
        const freePos = findFreeNodePosition(
            nodes,
            flowPos,
            { width: 520, height: 280 }
        );

        const newArea: AreaFlowNode = {
            id: areaData.id,
            type: "area",
            data: { area: areaData },
            position: freePos,
            zIndex: -1,
            style: { width: 520, height: 280 },
        };
        setNodes((nds) => [...nds, newArea]);
        setContextMenu(null);
    };

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) => {
                const sourceNode = nodes.find((n) => n.id === connection.source);
                const fieldId = connection.sourceHandle?.replace(/-source$|-target$/, "");
                const fieldColor = isDesignNode(sourceNode)
                    ? sourceNode.data.node.fields.find((f) => f.id === fieldId)?.color
                    : undefined;

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
                        onCreateNode={() => {
                            setCreationPosition(contextMenu);
                            setContextMenu(null);
                            setIsAddNodeDialogOpen(true);
                        }}
                        onCreateRelationship={() => {
                            setContextMenu(null);
                            setIsAddRelationshipOpen(true);
                        }}
                        onCreateArea={() => handleCreateArea(contextMenu)}
                    />




                </CanvasComponentReactFlow>

            </CanvasComponentMainDiv>

            <AddNodeDialog
                open={isAddNodeDialogOpen}
                onOpenChange={setIsAddNodeDialogOpen}
                onSubmit={handleCreateNode}
            />

            <AddRelationshipDialog
                open={isAddRelationshipOpen}
                onOpenChange={setIsAddRelationshipOpen}
                nodes={nodes.filter(isDesignNode)}
                onSubmit={handleCreateRelationship}
            />
        </ToastProvider>
    )

}

export default CanvasComponent



