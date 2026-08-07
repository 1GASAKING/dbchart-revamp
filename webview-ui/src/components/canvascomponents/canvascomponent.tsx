import { useEdgesState, useNodesState, type Node, Position } from "@xyflow/react"
import { CanvasComponentBackground, CanvasComponentMainDiv, CanvasComponentMiniMap, CanvasComponentReactFlow } from "../../styles/canvascomponentstyles/canvascomponentstyles"
import SchemaNodeComponent from "../schema-node-components/schema-node-component"
import { useEffect } from "react"

const nodeTypes = {
    test: SchemaNodeComponent,
}


const CanvasComponent = () => {

    const [nodes, setNodes] = useNodesState<Node>([])
    const [edges,] = useEdgesState([]);
    useEffect(() => {

        setNodes([
            {
                id: '1',
                type: "test",
                data: { label: 'An input node' },
                position: { x: 10, y: 50 },
                sourcePosition: Position.Right,

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
                <CanvasComponentMiniMap />
                <CanvasComponentBackground
                    color="red"
                    bgColor="blue"
                />



            </CanvasComponentReactFlow>


        </CanvasComponentMainDiv>
    )

}

export default CanvasComponent