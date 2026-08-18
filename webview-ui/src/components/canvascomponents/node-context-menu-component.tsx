import { useEffect, useRef, useState } from "react";
import { CanvasConntextMenuButton, CanvasConntextMenuComponentMainDiv } from "../../styles/canvascomponentstyles/canvas-context-menu-component-styles";
import type { ContextMenuData, AreaFlowNode } from "../../types/schema-node-ui";
import AlertDialogComponent from "../reusable-components/alert-dialog-component";

interface NodeContextMenuProps {
  /** Position + target node id. */
  contextMenu: ContextMenuData | null;
  /** Available area containers to move the node into. */
  areas: AreaFlowNode[];
  onEditTable: () => void;
  onDuplicateTable: () => void;
  onAddRelationship: () => void;
  onMoveToArea: (areaId: string) => void;
  onDeleteTable: () => void;
}

const MenuItem = ({
  label,
  icon,
  onClick,
  danger,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  label: string;
  icon: string;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => (
  <div className="node-menu-item-wrap" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
    <CanvasConntextMenuButton onClick={onClick}>
      <div>
        <div>
          <p className="canvas-context-menu-text" style={danger ? { color: "#f48771" } : undefined}>
            {label}
          </p>
        </div>
        <div>
          {children
            ? <i className="codicon codicon-chevron-right" />
            : <i className={`codicon ${icon}`} style={danger ? { color: "#f48771" } : undefined} />}
        </div>
      </div>
    </CanvasConntextMenuButton>
    {children}
  </div>
);

/**
 * Context menu shown when right-clicking a specific design node (table/view).
 * This is intentionally separate from the board/pane context menu.
 *
 * "Move to area" opens a hover flyout listing all areas; the user picks one,
 * which repositions the node inside that area.
 */
const NodeContextMenuComponent = ({
  contextMenu,
  areas,
  onEditTable,
  onDuplicateTable,
  onAddRelationship,
  onMoveToArea,
  onDeleteTable,
}: NodeContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<ContextMenuData | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showMoveFlyout, setShowMoveFlyout] = useState(false);

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
      <style>{`
        .node-menu-item-wrap { position: relative; }
        .move-flyout {
          position: absolute;
          left: 100%;
          top: 0;
          min-width: 160px;
          z-index: 1100;
          border: 1px solid var(--vscode-editorWidget-border, #454545);
          border-radius: 4px;
          background: var(--vscode-editor-background, #1e1e1e);
          padding: 4px;
        }
        .move-flyout-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 2px;
          cursor: pointer;
          font-size: 13px;
          color: var(--vscode-editor-foreground, #cccccc);
        }
        .move-flyout-item:hover { background: var(--vscode-editorWidget-border, #454545); }
        .move-flyout-empty {
          padding: 7px 10px;
          font-size: 12px;
          color: var(--vscode-descriptionForeground, #999);
        }
      `}</style>

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
            <MenuItem
              label="Move to area"
              icon="codicon-layout-panel"
              onMouseEnter={() => setShowMoveFlyout(true)}
              onMouseLeave={() => setShowMoveFlyout(false)}
            >
              {showMoveFlyout && (
                <div
                  className="move-flyout"
                  onMouseEnter={() => setShowMoveFlyout(true)}
                  onMouseLeave={() => setShowMoveFlyout(false)}
                >
                  {areas.length === 0 ? (
                    <div className="move-flyout-empty">No areas yet</div>
                  ) : (
                    areas.map((area) => (
                      <div
                        key={area.id}
                        className="move-flyout-item"
                        onClick={() => onMoveToArea(area.id)}
                      >
                        <i className="codicon codicon-preview" style={{ color: area.data.area.color }} />
                        {area.data.area.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </MenuItem>
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