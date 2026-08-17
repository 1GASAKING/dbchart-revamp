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

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NOTE_WIDTH = 220;
const NOTE_EXPANDED_HEIGHT = 160;
const NOTE_COLLAPSED_HEIGHT = 32;
const PIN_GAP = 16;
// How far a pinned note may be dragged away from its target (each side).
const PIN_MARGIN = 600;

const getCanvasNodeLabel = (node: CanvasNode): string => {
  if (isDesignNode(node)) return node.data.node.label;
  if (isAreaNode(node)) return node.data.area.name;
  return node.id;
};

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

/**
 * A sticky note that can be left on the board or pinned to a node/area.
 *
 * When pinned, the note remains a child of that node (so it follows it) but is
 * placed to the side/top of the target — never covering it — and is constrained
 * by a padded extent so it can be dragged near the target but not far away.
 * On the board it has no parent, so it can be dragged anywhere.
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
  const { getNodes, getNode, getInternalNode, updateNode, updateNodeData } =
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

  /** Absolute bounds (flow coordinates) of a canvas node. */
  const getNodeBounds = (nodeId: string): Rect => {
    const internal = getInternalNode(nodeId);
    const user = getNode(nodeId);
    let w = internal?.measured?.width ?? user?.width ?? user?.measured?.width;
    let h = internal?.measured?.height ?? user?.height ?? user?.measured?.height;

    if (w === undefined || h === undefined) {
      if (user && isDesignNode(user)) {
        w = 300;
        h = 60 + (user.data.node.fields?.length ?? 0) * 28;
      } else if (user && isAreaNode(user)) {
        const style = user.style as
          | { width?: number | string; height?: number | string }
          | undefined;
        w = Number(style?.width) || 520;
        h = Number(style?.height) || 280;
      } else {
        w = NOTE_WIDTH;
        h = NOTE_EXPANDED_HEIGHT;
      }
    }
    const pos =
      internal?.internals.positionAbsolute ??
      user?.position ?? { x: 0, y: 0 };
    return { x: pos.x, y: pos.y, width: w, height: h };
  };

  const isFreePlacement = (
    absX: number,
    absY: number,
    ignoreNodeId: string
  ) =>
    getNodes().every((n) => {
      if (n.id === id || n.id === ignoreNodeId) return true;
      return !intersects(
        { x: absX, y: absY, width: noteWidth, height: noteHeight },
        getNodeBounds(n.id)
      );
    });

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
      // Unpin: board-level node, free dragging anywhere.
      updateNode(id, {
        parentId: undefined,
        extent: undefined,
        style: {
          width: noteWidth,
          height: collapsed ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT,
        },
        position: { x: positionAbsoluteX, y: positionAbsoluteY },
      });
      setOpenPopover(null);
      return;
    }

    const parent = getNodeBounds(targetId);
    const w = noteWidth;
    const h = collapsed ? NOTE_COLLAPSED_HEIGHT : NOTE_EXPANDED_HEIGHT;

    // Candidate parent-relative placements: side/top preferred, never covering.
    const candidates: Array<{ x: number; y: number }> = [
      { x: parent.width + PIN_GAP, y: 0 }, // right
      { x: 0, y: -h - PIN_GAP }, // top
      { x: -w - PIN_GAP, y: 0 }, // left
      { x: 0, y: parent.height + PIN_GAP }, // bottom
    ];

    let chosen = candidates[0];
    for (const candidate of candidates) {
      const absX = parent.x + candidate.x;
      const absY = parent.y + candidate.y;
      if (absX >= 0 && absY >= 0 && isFreePlacement(absX, absY, targetId)) {
        chosen = candidate;
        break;
      }
    }

    updateNode(id, {
      parentId: targetId,
      // Padded extent (in parent-relative coordinates) so the note can be
      // dragged around the target but stays near it.
      extent: [
        [-PIN_MARGIN, -PIN_MARGIN],
        [parent.width + PIN_MARGIN, parent.height + PIN_MARGIN],
      ],
      style: { width: w, height: h },
      position: { x: chosen.x, y: chosen.y },
    });
    setOpenPopover(null);
  };

  const popoverVisible = selected && !collapsed ? openPopover : null;

  return (
    <NoteNodeComponentMainDiv
      ref={mainDivRef}
      $color={note.color}
      className={(selected ? "selected " : "") + (collapsed ? "collapsed" : "")}
    >
      <div className="note-header">
        <div
          className="note-pin-indicator"
          title={`Pinned to ${currentPinLabel}`}
        >
          {currentPinLabel}
        </div>
        <div className="note-actions nodrag">
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
          <div className="note-color-popover nodrag">
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
          <div className="note-pin-popover nodrag">
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

      <div className="note-body">
        <div className="note-body-inner">
          <textarea
            className="note-editor nodrag"
            placeholder="Write a note..."
            defaultValue={note.content}
            onBlur={(e) => saveContent(e.target.value)}
          />
        </div>
      </div>
    </NoteNodeComponentMainDiv>
  );
};

export default NoteNodeComponent;