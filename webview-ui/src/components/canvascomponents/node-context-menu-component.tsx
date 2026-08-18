import { useEffect, useRef, useState } from "react";
import { CanvasConntextMenuButton, CanvasConntextMenuComponentMainDiv } from "../../styles/canvascomponentstyles/canvas-context-menu-component-styles";
import type { ContextMenuData } from "../../types/schema-node-ui";
import AlertDialogComponent from "../reusable-components/alert-dialog-component";

interface NodeContextMenuProps {
  /** Position + target node id. */
  contextMenu: ContextMenuData | null;
  onEditTable: () => void;
  onDuplicateTable: () => void;
  onAddRelationship: () => void;
  onMoveToArea: () => void;
  onDeleteTable: () => void;
}

const MenuItem = ({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <CanvasConntextMenuButton onClick={onClick}>
    <div>
      <div>
        <p className="canvas-context-menu-text" style={danger ? { color: "#f48771" } : undefined}>
          {label}
        </p>
      </div>
      <div>
        <i className={`codicon ${icon}`} style={danger ? { color: "#f48771" } : undefined} />
      </div>
    </div>
  </CanvasConntextMenuButton>
);

/**
 * Context menu shown when right-clicking a specific design node (table/view).
 * This is intentionally separate from the board/pane context menu.
 */
const NodeContextMenuComponent = ({
  contextMenu,
  onEditTable,
  onDuplicateTable,
  onAddRelationship,
  onMoveToArea,
  onDeleteTable,
}: NodeContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<ContextMenuData | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (contextMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let { x, y } = contextMenu;
      const padding = 10;
      if (y + rect.height > window.innerHeight) {
        y = window.innerHeight - rect.height - padding;
      }
      if (x + rect.width > window.innerWidth) {
        x = window.innerWidth - rect.width - padding;
      }
      if (x < padding) x = padding;
      if (y < padding) y = padding;
      setAdjustedPos({ x, y });
    }
  }, [contextMenu]);

  if (!contextMenu) return null;

  const pos = adjustedPos ?? contextMenu;

  return (
    <>
      <CanvasConntextMenuComponentMainDiv
        ref={menuRef}
        className="canvas-context-menu node-context-menu"
        style={{ top: pos.y, left: pos.x, zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="canvas-context-menu-group canvas-context-menu-group-border">
            <MenuItem label="Edit table" icon="codicon-edit" onClick={onEditTable} />
            <MenuItem label="Duplicate table" icon="codicon-copy" onClick={onDuplicateTable} />
            <MenuItem label="Add relationship" icon="codicon-debug-connected" onClick={onAddRelationship} />
            <MenuItem label="Move to area" icon="codicon-layout-panel" onClick={onMoveToArea} />
          </div>
          <div className="canvas-context-menu-group">
            <MenuItem
              label="Delete table"
              icon="codicon-trash"
              danger
              onClick={() => setConfirmDeleteOpen(true)}
            />
          </div>
        </div>
      </CanvasConntextMenuComponentMainDiv>

      <AlertDialogComponent
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete table"
        description="Are you sure you want to delete this table? Its relationships will also be removed."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDeleteTable();
        }}
      />
    </>
  );
};

export default NodeContextMenuComponent;