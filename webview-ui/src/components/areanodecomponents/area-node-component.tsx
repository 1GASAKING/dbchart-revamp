import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { AreaFlowNode } from "../../types/schema-node-ui";
import { AreaNodeComponentMainDiv } from "../../styles/areanodecomponentstyles/area-node-component-styles";

/**
 * Visual grouping container node (an "area").
 *
 * It intentionally renders no <Handle /> components, so it cannot be connected
 * to other nodes. It is a purely visual indicator that other nodes can be
 * arranged inside.
 */
const AreaNodeComponent = ({ data, selected }: NodeProps<AreaFlowNode>) => {
  const area = data.area;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={120}
        color={area.color}
      />
      <AreaNodeComponentMainDiv $color={area.color}>
        <div className="area-label">{area.name}</div>
      </AreaNodeComponentMainDiv>
    </>
  );
};

export default AreaNodeComponent;