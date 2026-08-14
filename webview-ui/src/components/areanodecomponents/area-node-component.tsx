import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { AreaFlowNode } from "../../types/schema-node-ui";
import { AreaNodeComponentMainDiv } from "../../styles/areanodecomponentstyles/area-node-component-styles";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";
import { useEffect, useState } from "react";

/**
 * Visual grouping container node (an "area").
 *
 * It intentionally renders no <Handle /> components, so it cannot be connected
 * to other nodes. It is a purely visual indicator that other nodes can be
 * arranged inside.
 */
const AreaNodeComponent = ({ data, selected }: NodeProps<AreaFlowNode>) => {
    const area = data.area;
    const [edit,setEdit ]= useState<boolean>(false)
    const [name,setName] = useState<string>("")
    const HandleEditOrSave =()=>{
        if(edit){
        


        }
        else{
            setEdit(false)

        }
    }
    useEffect(()=>{
        setName(area.name)
    },[setName,area])

    return (
        <>

            <AreaNodeComponentMainDiv $color={area.color}>
                <NodeResizer
                    isVisible={selected}
                    minWidth={200}
                    minHeight={120}
                    color={area.color}
                />
                <div className="area-container">
                    <div>
                        <div className="area-label">{area.name}
                            </div>
                        <div className="area-node-button" onClick={()=> setEdit()}>
                            <VsButton >
                                <i className="codicon codicon-edit"></i>
                            </VsButton>
                        </div>

                    </div>


                </div>


            </AreaNodeComponentMainDiv>
        </>
    );
};

export default AreaNodeComponent;