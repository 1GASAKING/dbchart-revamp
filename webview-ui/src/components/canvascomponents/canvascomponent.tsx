import { useEdgesState, useNodesState, Position } from "@xyflow/react"
import { CanvasComponentBackground, CanvasComponentMainDiv, CanvasComponentMiniMap, CanvasComponentReactFlow } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import { useEffect } from "react"
import type { DesignFlowNode, DesignFlowEdge } from "../../types/schema-node-ui"

const nodeTypes = {
    test: SchemaNodeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes] = useNodesState<DesignFlowNode>([])
    const [edges, setEdges] = useEdgesState<DesignFlowEdge>([]);
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
                        fields: [
                            { id: "1", name: "id", dataType: "int" },
                            { id: "2", name: "name", dataType: "varchar" },
                            { id: "3", name: "email", dataType: "varchar", connectable: false },
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
                        fields: [
                            { id: "1", name: "id", dataType: "int" },
                            { id: "2", name: "user_id", dataType: "int" },
                            { id: "3", name: "total", dataType: "decimal", connectable: false },
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

    }, [])

    return (
        <CanvasComponentMainDiv>
            <CanvasComponentReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}


                proOptions={{ hideAttribution: true, }}>
                <CanvasComponentMiniMap  
                />
                <CanvasComponentBackground
                    color="red"
                    bgColor="blue"
                />



            </CanvasComponentReactFlow>


        </CanvasComponentMainDiv>
    )

}

export default CanvasComponent