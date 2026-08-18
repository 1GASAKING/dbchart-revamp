import { NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { AreaNodeDataType } from "@dbchart/schema";
import type { AreaFlowNode, CanvasNode } from "../../types/schema-node-ui";
import { validateAreaName, getAreaNameErrorMessage } from "@lib/utils";
import { AreaNodeComponentMainDiv } from "../../styles/areanodecomponentstyles/area-node-component-styles";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";
import { useToast } from "../../contexts/toastcontext/toast-context";

const isAreaNode = (node: CanvasNode): node is AreaFlowNode =>
  node.type === "area";

/**
 * Visual grouping container node (an "area").
 *
 * It intentionally renders no <Handle /> components, so it cannot be connected
 * to other nodes. It is a purely visual indicator that other nodes can be
 * arranged inside.
 */
const AreaNodeComponent = ({ id, data, selected }: NodeProps<AreaFlowNode>) => {
  const area = data.area;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(area.name);
  const { getNodes, updateNodeData } = useReactFlow<CanvasNode>();
  const { showToast } = useToast();

  // Enter name-edit mode when the area context menu requests it.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ nodeId?: string }>).detail;
      if (detail?.nodeId === id) {
        setName(area.name);
        setEditing(true);
      }
    };
    window.addEventListener("dbchart:request-edit-area", handler);
    return () => window.removeEventListener("dbchart:request-edit-area", handler);
  }, [id, area.name]);

  const getAllAreas = (): AreaNodeDataType[] =>
    getNodes()
      .filter(isAreaNode)
      .map((n) => n.data.area);

  const save = () => {
    const error = validateAreaName(name, area.id, getAllAreas());
    if (error) {
      showToast(getAreaNameErrorMessage(error));
      return;
    }
    updateNodeData(id, { area: { ...area, name: name.trim() } });
    setEditing(false);
  };

  const toggleEdit = () => {
    if (editing) {
      save();
    } else {
      setName(area.name);
      setEditing(true);
    }
  };

  return (
    <AreaNodeComponentMainDiv $color={area.color}>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={120}
        color={area.color}
      />
      <div className="area-container">
        <div>
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setName(area.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div
              className="area-label"
              onDoubleClick={() => {
                setName(area.name);
                setEditing(true);
              }}
            >
              {area.name}
            </div>
          )}
          <div className="area-node-button" onClick={toggleEdit}>
            <VsButton>
              <i className={`codicon codicon-${editing ? "save" : "edit"}`} />
            </VsButton>
          </div>
        </div>
      </div>
    </AreaNodeComponentMainDiv>
  );
};

export default AreaNodeComponent;