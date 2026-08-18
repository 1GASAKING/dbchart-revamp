import { useEffect, useRef, useState } from "react";
import { CanvasConntextMenuButton, CanvasConntextMenuComponentMainDiv } from "../../styles/canvascomponentstyles/canvas-context-menu-component-styles";
import type { ContextMenuData } from "../../types/schema-node-ui";
import AlertDialogComponent from "../reusable-components/alert-dialog-component";

interface AreaContextMenuProps {
  contextMenu: ContextMenuData | null;
  onEditName: () => void;
  onAutoArrange: () => void;
  onDeleteArea: () => void;
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
 * Context menu shown when right-clicking an area container.
 * This is separate from the board/pane and design-node context menus.
 */
const AreaContextMenuComponent = ({
  contextMenu,
  onEditName,
  onAutoArrange,
  onDeleteArea,
}: AreaContextMenuProps) => {
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
        className="canvas-context-menu area-context-menu"
        style={{ top: pos.y, left: pos.x, zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="canvas-context-menu-group canvas-context-menu-group-border">
            <MenuItem label="Edit name" icon="codicon-edit" onClick={onEditName} />
            <MenuItem label="Auto arrange" icon="codicon-layout" onClick={onAutoArrange} />
          </div>
          <div className="canvas-context-menu-group">
            <MenuItem
              label="Delete area"
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
        title="Delete area"
        description="Are you sure you want to delete this area? Nodes inside it will stay on the board."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDeleteArea();
        }}
      />
    </>
  );
};

export default AreaContextMenuComponent;