import { useEdgesState, useNodesState, Position, MiniMap, type Connection, addEdge, type ReactFlowInstance, type OnConnectEnd, getViewportForBounds } from "@xyflow/react"
import { CanvasComponentMainDiv, CanvasComponentReactFlow, CanvasComponentControls, CanvasComponentBackground } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import AreaNodeComponent from "../areanodecomponents/area-node-component"
import NoteNodeComponent from "../notenodecomponents/note-node-component"
import ConnectionLineComponent from "./connection-line-component"
import SchemaEdgeComponent from "../schemacomponents/schema-edge-component"
import ContextMenuComponent from "./contextmenu-component"
import NodeContextMenuComponent from "./node-context-menu-component"
import AreaContextMenuComponent from "./area-context-menu-component"
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import { type DesignFlowNode, type DesignFlowEdge, type ContextMenuData, type CanvasNode, isDesignNode, isAreaNode, type AreaFlowNode, type NoteFlowNode } from "../../types/schema-node-ui"
import { autoArrangeNodes, findFreeNodePosition, estimateLayoutNodeSize, createSchemaNode, generateId, generateNodeId, generateFieldId, createAreaNodeData, createNoteNodeData, areFieldTypesCompatible, computeBrokenEdges } from "@lib/utils"
import {
  parseSchema,
  canonicalToDesign,
  databaseSchemaToDesign,
  designToCanonical,
  serializeSchema,
} from "@lib/import-export";
import type { DatabaseSchema, SchemaDesign, SchemaNode } from "@dbchart/schema";
import type { ArrangedDesign } from "@lib/utils/design-arrangement";
import ImportDialog, { type ImportResult } from "../import-export/import-dialog";
import ExportDialog, { type ExportKind } from "../import-export/export-dialog";
import { requestOpenFile, requestSaveFile } from "../../utils/file-operations";
import { toPng, toSvg } from "html-to-image";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import AddNodeDialog, { type AddNodeFormData } from "../reusable-components/add-node-dialog"
import AddRelationshipDialog, { type RelationshipFormData } from "../reusable-components/add-relationship-dialog"
import { ToastProvider } from "../../contexts/toastcontext/toast-context-provider"
import { FieldSelectionProvider } from "../../contexts/fieldselectioncontext/field-selection-provider"
import { useToast } from "../../hooks/use-toast-hook"
import type { ToastType } from "../../styles/toastcomponentstyles/toast-component-styles"


const nodeTypes = {
    test: SchemaNodeComponent,
    area: AreaNodeComponent,
    note: NoteNodeComponent,
}

const edgeTypes = {
    schema: SchemaEdgeComponent,
}

// Keeps area nodes behind all other nodes even when selected (React Flow's
// default elevation adds +1000 z-index to a selected node).
const AREA_NODE_Z_INDEX = -2000;

/**
 * Lay out design nodes whose center is inside the given area as a flowing grid
 * within that area's bounds (left-to-right, top-to-bottom, wrapping).
 */
const arrangeNodesInsideArea = (nodes: CanvasNode[], areaId: string): CanvasNode[] => {
  const area = nodes.find((n) => n.id === areaId);
  if (!area || !isAreaNode(area)) return nodes;

  const style = (area.style ?? {}) as { width?: number | string; height?: number | string };
  const areaWidth = Number(style.width) || 520;
  const areaHeight = Number(style.height) || 280;
  const rect = { x: area.position.x, y: area.position.y, width: areaWidth, height: areaHeight };

  const padding = 20;
  const gapX = 40;
  const gapY = 40;

  let cursorX = rect.x + padding;
  let cursorY = rect.y + padding;
  let rowHeight = 0;

  // Track how far the laid-out content extends from the area's top-left.
  let maxRight = rect.x + rect.width;
  let maxBottom = rect.y + rect.height;

  const laidOut = nodes.map((node) => {
    if (node.id === areaId || !isDesignNode(node)) return null;

    const size = estimateLayoutNodeSize(node);
    const centerX = node.position.x + size.width / 2;
    const centerY = node.position.y + size.height / 2;
    const inside =
      centerX >= rect.x &&
      centerX <= rect.x + rect.width &&
      centerY >= rect.y &&
      centerY <= rect.y + rect.height;
    if (!inside) return null;

    if (cursorX + size.width > rect.x + rect.width - padding) {
      cursorX = rect.x + padding;
      cursorY += rowHeight + gapY;
      rowHeight = 0;
    }

    const placed = { ...node, position: { x: cursorX, y: cursorY } };
    maxRight = Math.max(maxRight, placed.position.x + size.width);
    maxBottom = Math.max(maxBottom, placed.position.y + size.height + padding);
    cursorX += size.width + gapX;
    rowHeight = Math.max(rowHeight, size.height);
    return placed;
  });

  // Expand the area container if the laid-out nodes overflow its bounds.
  const neededWidth = maxRight - rect.x + padding;
  const neededHeight = maxBottom - rect.y;
  const newWidth = Math.max(areaWidth, neededWidth);
  const newHeight = Math.max(areaHeight, neededHeight);

  return nodes.map((node) => {
    if (node.id === areaId) {
      return {
        ...node,
        style: { ...(node.style ?? {}), width: newWidth, height: newHeight },
      };
    }
    return laidOut.find((n) => n?.id === node.id) ?? node;
  });
};

interface ToastGetterProps {
  onReady: (show: (message: string, type?: ToastType) => void) => void;
}

const ToastGetter = ({ onReady }: ToastGetterProps) => {
  const toast = useToast();
  useEffect(() => {
    if (toast) onReady(toast.showToast);
  }, [toast, onReady]);
  return null;
};


interface CanvasComponentProps {
  schema?: DatabaseSchema;
  design?: ArrangedDesign;
}

const CanvasComponent = ({ schema, design }: CanvasComponentProps) => {

    const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<DesignFlowEdge>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
    const [filterState,setFilterState] = useState<boolean>()
    const [snapToGrid, setSnapToGrid] = useState(false)
    const [zoomValue, setZoomValue] = useState<string>("100")
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false)
    const [creationPosition, setCreationPosition] = useState<ContextMenuData | null>(null)
    const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [nodeContextMenu, setNodeContextMenu] = useState<ContextMenuData | null>(null)
    const [areaContextMenu, setAreaContextMenu] = useState<ContextMenuData | null>(null)
    const rfRef = useRef<ReactFlowInstance<CanvasNode, DesignFlowEdge> | null>(null);
    const showToastRef = useRef<((message: string, type?: ToastType) => void) | null>(null);
    const flowWrapperRef = useRef<HTMLDivElement>(null);
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
                zIndex: AREA_NODE_Z_INDEX,
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

    // --- broken relationship detection ---
    // Whenever nodes (field types) or edges change, recompute which edges are
    // broken (field types at the endpoints no longer match) and update their
    // `broken` flag so the edge renders as a broken connection line.
    const fieldSources = useMemo(() => {
        const sources: Array<{ nodeId: string; fieldId: string; dataType: string }> = []
        for (const n of nodes) {
            if (isDesignNode(n)) {
                for (const f of n.data.node.fields) {
                    sources.push({ nodeId: n.id, fieldId: f.id, dataType: f.dataType });
                }
            }
        }
        return sources;
    }, [nodes]);

    useEffect(() => {
        const brokenIds = computeBrokenEdges(fieldSources, edges);
        let needsUpdate = false;
        for (const e of edges) {
            const isBroken = brokenIds.has(e.id);
            if ((e.data?.broken ?? false) !== isBroken) {
                needsUpdate = true;
                break;
            }
        }
        if (!needsUpdate) return;
        setEdges((eds) =>
            eds.map((e): DesignFlowEdge => {
                const isBroken = brokenIds.has(e.id);
                if ((e.data?.broken ?? false) !== isBroken) {
                    return {
                        ...e,
                        data: {
                            relationshipId: e.data?.relationshipId ?? e.id,
                            ...(e.data?.color !== undefined ? { color: e.data.color } : {}),
                            broken: isBroken,
                        },
                    };
                }
                return e;
            })
        );
        // Show a toast for each edge that just became broken
        for (const e of edges) {
            const isBroken = brokenIds.has(e.id);
            if (isBroken && (e.data?.broken ?? false) !== true) {
                showToastRef.current?.(
                    `Broken relationship: connected field types are no longer compatible (${e.source} → ${e.target})`,
                    "warning"
                );
            }
        }
    }, [fieldSources, edges, setEdges]);

    const handlePaneContextMenu = (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault();
        setNodeContextMenu(null);
        setAreaContextMenu(null);
        setContextMenu({ x: event.clientX, y: event.clientY });
    };

    const handleNodeContextMenu = (event: React.MouseEvent, node: CanvasNode) => {
        event.preventDefault();
        // Area containers get their own context menu.
        if (isAreaNode(node)) {
            setContextMenu(null);
            setNodeContextMenu(null);
            setAreaContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
            return;
        }
        // Only design nodes (tables/views) get the node context menu.
        if (!isDesignNode(node)) return;
        setContextMenu(null);
        setAreaContextMenu(null);
        setNodeContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    };

    const closeNodeMenu = () => setNodeContextMenu(null);

    const getTargetNode = () => {
        const id = nodeContextMenu?.nodeId;
        if (!id) return null;
        const node = nodes.find((n) => n.id === id);
        return isDesignNode(node) ? node : null;
    };

    /** Ask the node to enter inline name-edit mode via a custom event. */
    const handleEditTable = () => {
        const id = nodeContextMenu?.nodeId;
        if (!id) return;
        window.dispatchEvent(
            new CustomEvent("dbchart:request-edit-node", { detail: { nodeId: id } })
        );
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
        closeNodeMenu();
    };

    /** Clone the node (with new field ids) and place it slightly offset. */
    const handleDuplicateTable = () => {
        const source = getTargetNode();
        if (!source) return;

        const newFields = source.data.node.fields.map((f) => ({
            ...f,
            id: generateFieldId(),
            nestedFields: f.nestedFields?.map((nf) => ({ ...nf, id: generateFieldId() })),
        }));

        const duplicateId = generateNodeId();
        const duplicate: DesignFlowNode = {
            id: duplicateId,
            type: "test",
            data: {
                node: {
                    ...source.data.node,
                    id: duplicateId,
                    label: `${source.data.node.label}_copy`,
                    fields: newFields,
                },
            },
            position: { x: source.position.x + 40, y: source.position.y + 40 },
            sourcePosition: Position.Right,
        };

        setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), duplicate]);
        closeNodeMenu();
    };

    const handleAddRelationship = () => {
        closeNodeMenu();
        setIsAddRelationshipOpen(true);
    };

    /** Move the node into the chosen area's top-left inset. */
    const handleMoveToArea = (areaId: string) => {
        const id = nodeContextMenu?.nodeId;
        if (!id) return;

        const area = nodes.find((n) => n.id === areaId);
        if (!area || !isAreaNode(area)) {
            showToastRef.current?.("Area no longer exists.", "warning");
            closeNodeMenu();
            return;
        }

        const target = { x: area.position.x + 20, y: area.position.y + 20 };
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, position: target } : n)));
        closeNodeMenu();
    };

    const handleDeleteTable = () => {
        const id = nodeContextMenu?.nodeId;
        if (!id) return;
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        closeNodeMenu();
    };

    // --- area context menu actions ---
    const closeAreaMenu = () => setAreaContextMenu(null);

    const handleAreaEditName = () => {
        const id = areaContextMenu?.nodeId;
        if (!id) return;
        window.dispatchEvent(
            new CustomEvent("dbchart:request-edit-area", { detail: { nodeId: id } })
        );
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
        closeAreaMenu();
    };

    const handleAreaAutoArrange = () => {
        const id = areaContextMenu?.nodeId;
        if (!id) return;
        setNodes((nds) => arrangeNodesInsideArea(nds, id));
        closeAreaMenu();
    };

    const handleAreaDelete = () => {
        const id = areaContextMenu?.nodeId;
        if (!id) return;
        setNodes((nds) => nds.filter((n) => n.id !== id));
        closeAreaMenu();
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
            zIndex: AREA_NODE_Z_INDEX,
            style: { width: 520, height: 280 },
        };
        setNodes((nds) => [...nds, newArea]);
        setContextMenu(null);
    };

    const handleCreateNote = (position?: ContextMenuData | null) => {
        const noteData = createNoteNodeData();
        const screenPos = position ?? { x: 100, y: 100 };
        const flowPos = rfRef.current?.screenToFlowPosition(screenPos) ?? screenPos;
        const freePos = findFreeNodePosition(
            nodes,
            flowPos,
            { width: 220, height: 160 }
        );

        const newNote: NoteFlowNode = {
            id: noteData.id,
            type: "note",
            data: { note: noteData },
            position: freePos,
            style: { width: 220, height: 160 },
        };
        setNodes((nds) => [...nds, newNote]);
        setContextMenu(null);
    };

    const isValidConnection = useCallback(
        (connection: Connection | DesignFlowEdge) => {
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);
            const sourceFieldId = connection.sourceHandle?.replace(/-source$|-target$/, "");
            const targetFieldId = connection.targetHandle?.replace(/-source$|-target$/, "");
            const sourceField = isDesignNode(sourceNode)
                ? sourceNode.data.node.fields.find((f) => f.id === sourceFieldId)
                : undefined;
            const targetField = isDesignNode(targetNode)
                ? targetNode.data.node.fields.find((f) => f.id === targetFieldId)
                : undefined;
            if (!sourceField || !targetField) return false;
            return areFieldTypesCompatible(sourceField.dataType, targetField.dataType);
        },
        [nodes]
    );

    const handleConnectEnd = useCallback<OnConnectEnd>(
        (_event, state) => {
            if (state.isValid !== false) return;
            const fromNodeId = state.fromNode?.id;
            const toNodeId = state.toNode?.id;
            if (!fromNodeId || !toNodeId) return;

            const sourceFieldId = state.fromHandle?.id?.replace(/-source$|-target$/, "");
            const targetFieldId = state.toHandle?.id?.replace(/-source$|-target$/, "");

            const sourceNode = nodes.find((n) => n.id === fromNodeId);
            const targetNode = nodes.find((n) => n.id === toNodeId);
            const sourceField = isDesignNode(sourceNode)
                ? sourceNode.data.node.fields.find((f) => f.id === sourceFieldId)
                : undefined;
            const targetField = isDesignNode(targetNode)
                ? targetNode.data.node.fields.find((f) => f.id === targetFieldId)
                : undefined;

            if (
                sourceField &&
                targetField &&
                !areFieldTypesCompatible(sourceField.dataType, targetField.dataType)
            ) {
                showToastRef.current?.(
                    `Cannot connect ${sourceField.dataType} → ${targetField.dataType}: field types must match`,
                    "warning"
                );
            }
        },
        [nodes]
    );

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
        // Auto-arrange only repositions design nodes (tables/views), while
        // areas and notes stay in place. Pinned notes are React Flow children
        // of their target, so they follow their target automatically when it
        // moves — `autoArrangeNodes` handles the static-node split internally.
        setNodes(autoArrangeNodes(nodes, edges));
        setTimeout(() => {
            rfRef.current?.fitView({ padding: 0.2, duration: 300 });
        }, 80);
    }, [nodes, edges, setNodes]);

    // --- import / export ---
    /** Build a SchemaDesign from the current canvas state. */
    const buildSchemaDesign = (): SchemaDesign => ({
        type: "schema",
        nodes: nodes
            .filter(isDesignNode)
            .filter((n) => n.data.node.kind === "table" || n.data.node.kind === "view")
            .map((n) => n.data.node as SchemaNode),
        relationships: edges.map((e) => ({
            id: e.id,
            sourceNodeId: e.source,
            sourceFieldId: e.sourceHandle?.replace(/-source$|-target$/, "") ?? "",
            targetNodeId: e.target,
            targetFieldId: e.targetHandle?.replace(/-source$|-target$/, "") ?? "",
        })),
    });

    /** Replace all nodes/edges with a freshly imported design and auto-layout. */
    const applyImportedSchema = (design: SchemaDesign) => {
        const newNodes: DesignFlowNode[] = design.nodes.map((node) => ({
            id: node.id,
            type: "test",
            data: { node },
            position: { x: 0, y: 0 },
            sourcePosition: Position.Right,
        }));

        const newEdges: DesignFlowEdge[] = design.relationships.map((rel) => ({
            id: rel.id,
            source: rel.sourceNodeId,
            target: rel.targetNodeId,
            sourceHandle: `${rel.sourceFieldId}-source`,
            targetHandle: `${rel.targetFieldId}-target`,
            type: "schema",
            animated: true,
            data: { relationshipId: rel.id },
        }));

        setNodes(newNodes);
        setEdges(newEdges);

        setTimeout(() => {
            setNodes((nds) => autoArrangeNodes(nds, newEdges));
            setTimeout(() => {
                rfRef.current?.fitView({ padding: 0.2, duration: 300 });
            }, 80);
        }, 0);
    };

    // When a live database schema is provided (e.g. "Types" from the sidebar),
    // convert and render it onto the canvas.
    useEffect(() => {
        if (!schema) return;
        try {
            const design = databaseSchemaToDesign(schema);
            applyImportedSchema(design);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            showToastRef.current?.(
                `Failed to load database types: ${message}`,
                "error"
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schema]);

    // When a pre-arranged design is provided (host already converted + laid out),
    // render it directly without re-converting or re-layout.
    useEffect(() => {
        if (!design) return;
        setNodes(design.nodes as CanvasNode[]);
        setEdges(design.edges as DesignFlowEdge[]);
        setTimeout(() => {
            rfRef.current?.fitView({ padding: 0.2, duration: 300 });
        }, 80);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [design]);

    const handleImport = (result: ImportResult) => {
        try {
            const parsed = parseSchema(result.format, result.content);
            const design = canonicalToDesign(parsed.schema);
            applyImportedSchema(design);

            if (parsed.warnings.length > 0) {
                showToastRef.current?.(
                    `Imported with warnings: ${parsed.warnings.join("; ")}`,
                    "warning"
                );
            } else {
                showToastRef.current?.("Schema imported successfully", "notification");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            showToastRef.current?.(`Import failed: ${message}`, "error");
        }
    };

    /** Capture the current flow viewport as an SVG/PNG image. */
    const captureImage = async (kind: "svg" | "png"): Promise<string | null> => {
        const wrapper = flowWrapperRef.current;
        const viewport = wrapper?.querySelector<HTMLElement>(".react-flow__viewport");
        if (!wrapper || !viewport) return null;

        // Compute a viewport that fits all nodes for a clean export.
        const nodesBounds = rfRef.current?.getNodesBounds(nodes) ?? null;
        if (nodesBounds) {
            const width = wrapper.clientWidth || 1024;
            const height = wrapper.clientHeight || 768;
            try {
                const vp = getViewportForBounds(nodesBounds, width, height, 0.05, 2, 0.1);
                await rfRef.current?.setViewport(vp, { duration: 0 });
                // Give the DOM one frame to apply the transform before capture.
                await new Promise((resolve) => requestAnimationFrame(resolve));
            } catch {
                /* layout viewport fallback: use current view */
            }
        }

        const options = {
            filter: (node: HTMLElement) =>
                !node?.classList?.contains("react-flow__minimap") &&
                !node?.classList?.contains("react-flow__controls"),
            backgroundColor: "var(--vscode-editor-background, #1e1e1e)",
        };

        return kind === "svg"
            ? await toSvg(viewport, options)
            : await toPng(viewport, { ...options, pixelRatio: 2 });
    };

    const handleExport = async (kind: ExportKind) => {
        try {
            if (kind === "svg" || kind === "png") {
                const dataUrl = await captureImage(kind);
                if (!dataUrl) {
                    showToastRef.current?.("Nothing to export", "warning");
                    return;
                }

                if (kind === "png") {
                    // toPng returns a base64 data URL.
                    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
                    const result = await requestSaveFile(
                        `diagram.png`,
                        ["png"],
                        base64,
                        "base64"
                    );
                    if (result && result.success) {
                        showToastRef.current?.("Image exported successfully", "notification");
                    } else if (result && !result.success) {
                        showToastRef.current?.(
                            `Export failed: ${result.error ?? "unknown error"}`,
                            "error"
                        );
                    }
                } else {
                    // toSvg returns a URL-encoded UTF-8 data URL; decode to raw SVG.
                    const svg = decodeURIComponent(
                        dataUrl.replace(/^data:image\/svg\+xml(;charset=utf-8)?,/, "")
                    );
                    const result = await requestSaveFile(`diagram.svg`, ["svg"], svg, "utf8");
                    if (result && result.success) {
                        showToastRef.current?.("Image exported successfully", "notification");
                    } else if (result && !result.success) {
                        showToastRef.current?.(
                            `Export failed: ${result.error ?? "unknown error"}`,
                            "error"
                        );
                    }
                }
                return;
            }

            const design = buildSchemaDesign();
            const canonical = designToCanonical(design);
            const content = serializeSchema(kind, canonical);
            const defaultFileName = `diagram.${kind}`;
            const extensions = kind === "dbml" ? ["dbml"] : [kind];

            const result = await requestSaveFile(defaultFileName, extensions, content);
            if (result === null) return; // cancelled
            if (result.success) {
                showToastRef.current?.("Schema exported successfully", "notification");
            } else {
                showToastRef.current?.(
                    `Export failed: ${result.error ?? "unknown error"}`,
                    "error"
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            showToastRef.current?.(`Export failed: ${message}`, "error");
        }
    };

    const handlePickFile = async (extensions: string[]): Promise<string | null> => {
        const result = await requestOpenFile(extensions);
        return result?.content ?? null;
    };

    const handleFetchUrl = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            showToastRef.current?.(`Failed to fetch URL: ${message}`, "error");
            return null;
        }
    };

    const entityCount = nodes.filter(isDesignNode).length;


    return (
        <FieldSelectionProvider edges={edges}>
        <ToastProvider>
            <ToastGetter onReady={(show) => { showToastRef.current = show; }} />
            <CanvasComponentMainDiv ref={flowWrapperRef}>
                <CanvasComponentReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}

                    connectionLineComponent={ConnectionLineComponent}

                    onPaneContextMenu={handlePaneContextMenu}
                    onNodeContextMenu={handleNodeContextMenu}
                    onPaneClick={() => { setContextMenu(null); closeNodeMenu(); closeAreaMenu(); }}
                    onConnect={onConnect}
                    onConnectEnd={handleConnectEnd}
                     maxZoom={5}
                    minZoom={0.1}

                    isValidConnection={isValidConnection}
                    snapToGrid={snapToGrid}
                     deleteKeyCode={['Backspace', 'Delete']}
                    multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
                    snapGrid={[20, 20]}


                    onMove={(_, viewport) => syncZoomValue(viewport)}


                    onInit={(instance) => { rfRef.current = instance as ReactFlowInstance<CanvasNode, DesignFlowEdge> }}
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
                         <div className="button-holder" >
                            <VsButton
                                onClick={()=>{setSnapToGrid(!snapToGrid)}}
                                title={snapToGrid ? "Snap to grid: On" : "Snap to grid: Off"}
                                className={snapToGrid ? "active" : ""}
                            >
                                <i className="codicon codicon-layout-panel-justify" />
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

                    <NodeContextMenuComponent
                        contextMenu={nodeContextMenu}
                        areas={nodes.filter(isAreaNode)}
                        onEditTable={handleEditTable}
                        onDuplicateTable={handleDuplicateTable}
                        onAddRelationship={handleAddRelationship}
                        onMoveToArea={handleMoveToArea}
                        onDeleteTable={handleDeleteTable}
                    />

                    <AreaContextMenuComponent
                        contextMenu={areaContextMenu}
                        onEditName={handleAreaEditName}
                        onAutoArrange={handleAreaAutoArrange}
                        onDeleteArea={handleAreaDelete}
                    />

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
                        onCreateNote={() => handleCreateNote(contextMenu)}
                        onImport={() => {
                            setContextMenu(null);
                            setIsImportDialogOpen(true);
                        }}
                        onExport={() => {
                            setContextMenu(null);
                            setIsExportDialogOpen(true);
                        }}
                    />




                </CanvasComponentReactFlow>

            </CanvasComponentMainDiv>

            <AddNodeDialog
                open={isAddNodeDialogOpen}
                onOpenChange={setIsAddNodeDialogOpen}
                existingLabels={nodes
                    .filter(isDesignNode)
                    .map((n) => ({ id: n.id, label: n.data.node.label }))}
                onSubmit={handleCreateNode}
            />

            <AddRelationshipDialog
                open={isAddRelationshipOpen}
                onOpenChange={setIsAddRelationshipOpen}
                nodes={nodes.filter(isDesignNode)}
                onSubmit={handleCreateRelationship}
            />

            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImport={handleImport}
                onPickFile={handlePickFile}
                onFetchUrl={handleFetchUrl}
            />

            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                entityCount={entityCount}
                onExport={handleExport}
            />
        </ToastProvider>
        </FieldSelectionProvider>
    )

}

export default CanvasComponent



