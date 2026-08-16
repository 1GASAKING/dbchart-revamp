import { useReactFlow, type NodeProps } from "@xyflow/react";
import { useRef, useState } from "react";
import type { NoteFlowNode, CanvasNode } from "../../types/schema-node-ui";
import {
  isDesignNode,
  isAreaNode,
  NOTE_BOARD_TARGET,
} from "../../types/schema-node-ui";
import { NODE_COLORS } from "@lib/utils";
import {
  NoteNodeComponentMainDiv,
  NotePinOption,
  NoteHeaderButton,
} from "../../styles/notenodecomponentstyles/note-node-component-styles";

interface PinTarget {
  id: string;
  label: string;
}

const NOTE_WIDTH = 220;
const NOTE_EXPANDED_HEIGHT = 160;
const NOTE_COLLAPSED_HEIGHT = 32;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const getCanvasNodeLabel = (node: CanvasNode): string => {
  if (isDesignNode(node)) return node.data.node.label;
  if (isAreaNode(node)) return node.data.area.name;
  return node.id;
};

/**
 * A sticky note that can be left on the board or pinned to a node/area.
 *
 * Pinning is implemented via React Flow's `parentId`:
 *  - pinned to a design node/area  -> `parentId` is that node's id and
 *    `extent: "parent"` keeps the note draggable only inside that element.
 *  - pinned to the board           -> `parentId` is undefined, so the note
 *    can be dragged anywhere.
 */
const NoteNodeComponent = ({
  id,
  data,
  selected,
  parentId,
  positionAbsoluteX,
  positionAbsoluteY,
  width,
  height,
}: NodeProps<NoteFlowNode>) => {
  const note = data.note;
  const { getNodes, getInternalNode, updateNode, updateNodeData } =
    useReactFlow<CanvasNode>();
  const mainDivRef = useRef<HTMLDivElement>(null);

  const [openPopover, setOpenPopover] = useState<"color" | "pin" | null>(null);
  const [customColor, setCustomColor] = useState("");

  const collapsed = note.collapsed === true;
  const noteWidth = width ?? NOTE_WIDTH;
  const noteHeight =
    height ?? (collapsed ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT);

  const pinTargets: PinTarget[] = getNodes()
    .filter((n) => n.id !== id)
    .map((n) => ({ id: n.id, label: getCanvasNodeLabel(n) }));

  const currentPinId = parentId ?? NOTE_BOARD_TARGET;
  const currentPinLabel =
    currentPinId === NOTE_BOARD_TARGET
      ? "Board"
      : pinTargets.find((t) => t.id === currentPinId)?.label ?? currentPinId;

  const saveContent = (content: string) => {
    updateNodeData(id, { note: { ...note, content } });
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    updateNode(id, {
      style: {
        width: noteWidth,
        height: next ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT,
      },
    });
    updateNodeData(id, { note: { ...note, collapsed: next } });
    setOpenPopover(null);
  };

  const handleColorSelect = (color: string) => {
    updateNodeData(id, { note: { ...note, color } });
    setOpenPopover(null);
  };

  const handleCustomColorApply = () => {
    const hex = customColor.trim();
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return;
    handleColorSelect(hex);
    setCustomColor("");
  };

  const handlePinSelect = (targetId: string) => {
    if (targetId === NOTE_BOARD_TARGET) {
      // Unpin: move note back to board coordinates (absolute position).
      updateNode(id, {
        parentId: undefined,
        extent: undefined,
        style: {
          width: noteWidth,
          height: collapsed ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT,
        },
        position: { x: positionAbsoluteX, y: positionAbsoluteY },
      });
    } else {
      const parentInternal = getInternalNode(targetId);
      const parentAbs = parentInternal?.internals.positionAbsolute ?? {
        x: 0,
        y: 0,
      };
      const parentWidth = parentInternal?.measured?.width ?? 0;
      const parentHeight = parentInternal?.measured?.height ?? 0;

      // Convert the note's absolute position into parent-relative coordinates
      // and clamp it fully inside the parent bounds.
      const relativeX = positionAbsoluteX - parentAbs.x;
      const relativeY = positionAbsoluteY - parentAbs.y;
      const x = clamp(relativeX, 8, parentWidth - noteWidth - 8);
      const y = clamp(relativeY, 8, parentHeight - noteHeight - 8);

      updateNode(id, {
        parentId: targetId,
        extent: "parent",
        style: {
          width: noteWidth,
          height: collapsed ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT,
        },
        position: { x, y },
      });
    }
    setOpenPopover(null);
  };

  const popoverVisible = selected && !collapsed ? openPopover : null;

  return (
    <NoteNodeComponentMainDiv
      ref={mainDivRef}
      $color={note.color}
      className={selected ? "selected" : ""}
    >
      <div className="note-header nodrag">
        <div
          className="note-pin-indicator"
          title={`Pinned to ${currentPinLabel}`}
        >
          <i className="codicon codicon-pin" /> {currentPinLabel}
        </div>
        <div className="note-actions">
          <NoteHeaderButton
            title="Change color"
            onClick={() =>
              setOpenPopover((prev) => (prev === "color" ? null : "color"))
            }
          >
            <i className="codicon codicon-symbol-color" />
          </NoteHeaderButton>
          <NoteHeaderButton
            title="Pin to..."
            onClick={() =>
              setOpenPopover((prev) => (prev === "pin" ? null : "pin"))
            }
          >
            <i className="codicon codicon-pin" />
          </NoteHeaderButton>
          <NoteHeaderButton
            title={collapsed ? "Expand" : "Collapse"}
            onClick={toggleCollapse}
          >
            <i
              className={`codicon codicon-${
                collapsed ? "chevron-down" : "chevron-up"
              }`}
            />
          </NoteHeaderButton>
        </div>

        {popoverVisible === "color" && (
          <div className="note-color-popover">
            <div className="note-color-grid">
              {NODE_COLORS.map((color) => (
                <button
                  key={color}
                  className={`note-color-option${
                    color === note.color ? " active" : ""
                  }`}
                  style={{ background: color }}
                  title={color}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
            <div className="note-custom-color-row">
              <input
                className="note-custom-color-input"
                placeholder="#RRGGBB"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomColorApply();
                }}
              />
              <NoteHeaderButton
                title="Apply color"
                onClick={handleCustomColorApply}
              >
                <i className="codicon codicon-check" />
              </NoteHeaderButton>
            </div>
          </div>
        )}

        {popoverVisible === "pin" && (
          <div className="note-pin-popover">
            <div className="note-pin-list">
              <NotePinOption
                className={
                  currentPinId === NOTE_BOARD_TARGET ? "selected" : ""
                }
                onClick={() => handlePinSelect(NOTE_BOARD_TARGET)}
              >
                <i className="codicon codicon-globe" /> Board
              </NotePinOption>
              {pinTargets.map((target) => (
                <NotePinOption
                  key={target.id}
                  className={currentPinId === target.id ? "selected" : ""}
                  onClick={() => handlePinSelect(target.id)}
                >
                  <i className="codicon codicon-pin" /> {target.label}
                </NotePinOption>
              ))}
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <textarea
          className="note-editor nodrag"
          placeholder="Write a note..."
          defaultValue={note.content}
          onBlur={(e) => saveContent(e.target.value)}
        />
      )}
    </NoteNodeComponentMainDiv>
  );
};

export default NoteNodeComponent;