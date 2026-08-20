import styled from "styled-components";

/* ── Root container ─────────────────────────────── */
const DBViewerComponentMianDiv = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-editor-foreground, #cccccc);
  font-size: 13px;
`;

/* ── Header (table name + action buttons) ───────── */
const DBViewerComponentHeaderDiv = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  background: var(--vscode-editorWidget-background, #252526);

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .db-viewer-title-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .db-viewer-table-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--vscode-editor-foreground, #cccccc);
  }

  .db-viewer-table-description {
    font-size: 12px;
  }

  .left-items {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .db-viewer-action-button {
    display: flex;
    align-items: center;
    height: 28px;
    width: fit-content;
  }
`;

/* ── Body container (toolbar + table + footer) ─── */
const DBViewerComponentBodyDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

/* ── Toolbar (search + batch actions) ───────────── */
const DBViewerToolbarDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  background: var(--vscode-editor-background, #1e1e1e);
  flex-wrap: wrap;

  .db-viewer-search {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--vscode-input-background, #3c3c3c);
    border: 1px solid var(--vscode-input-border, #454545);
    border-radius: 4px;
    padding: 0 8px;
    height: 28px;
    min-width: 200px;

    i {
      font-size: 14px;
    }

    input {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      height: 100%;
      width: 100%;
    }
  }

  .db-viewer-toolbar-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .db-viewer-toolbar-button {
    width: fit-content;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

/* ── Table wrapper (scrollable) ─────────────────── */
const DBViewerTableDiv = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 0;
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background, #4a4a4a);
    border-radius: 5px;
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

/* ── Table element ──────────────────────────────── */
const DBViewerTable = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
`;

/* ── Table head ─────────────────────────────────── */
const DBViewerTableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 5;

  tr {
    background: var(--vscode-editorWidget-background, #252526);
  }
`;

/* ── Table body ─────────────────────────────────── */
const DBViewerTableBody = styled.tbody``;

/* ── Row ────────────────────────────────────────── */
const DBViewerTableRow = styled.tr`
  &:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }

  &.db-viewer-selected {
    background: var(--vscode-list-activeSelectionBackground, #04395e);
  }

  &.db-viewer-selected:hover {
    background: var(--vscode-list-activeSelectionBackground, #04395e);
  }
`;

/* ── Cell ───────────────────────────────────────── */
const DBViewerCell = styled.td`
  border-right: 1px solid var(--vscode-editorWidget-border, #303030);
  border-bottom: 1px solid var(--vscode-editorWidget-border, #303030);
  padding: 4px 10px;
  min-width: 140px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: cell;
  height: 28px;
  vertical-align: middle;

  .db-viewer-null {
    color: var(--vscode-descriptionForeground, #888888);
    font-style: italic;
    opacity: 0.7;
  }

  .db-viewer-cell-value {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  input {
    width: 100%;
    background: var(--vscode-input-background, #3c3c3c);
    color: var(--vscode-input-foreground, #cccccc);
    border: 1px solid var(--vscode-focusBorder, #007fd4);
    outline: none;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 13px;
  }

  &.db-viewer-editing {
    background: var(--vscode-input-background, #3c3c3c);
  }

  &.db-viewer-row-actions {
    min-width: 36px;
    width: 36px;
    padding: 2px;
    text-align: center;
    background: var(--vscode-editorWidget-background, #252526);
    position: sticky;
    right: 0;
    z-index: 2;
  }
`;

/* ── Header cell ────────────────────────────────── */
const DBViewerHeaderCell = styled.th`
  border-right: 1px solid var(--vscode-editorWidget-border, #454545);
  border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  padding: 0;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--vscode-descriptionForeground, #bbbbbb);
  background: var(--vscode-editorWidget-background, #252526);
  min-width: 140px;
  height: 32px;
  vertical-align: middle;
  position: relative;

  .db-viewer-col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 4px 8px;
    height: 100%;
  }

  .db-viewer-col-name {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    i.codicon-key {
      color: var(--vscode-charts-yellow, #e2c08d);
      font-size: 12px;
    }
  }

  .db-viewer-col-menu-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--vscode-descriptionForeground, #999999);

    &:hover {
      color: var(--vscode-editor-foreground, #cccccc);
      opacity: 1;
    }

    i {
      font-size: 12px;
    }
  }

  &.db-viewer-add-col-cell {
    min-width: 36px;
    width: 36px;
    padding: 0;
    text-align: center;
  }

  .db-viewer-add-col-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--vscode-descriptionForeground, #999999);

    &:hover {
      color: var(--vscode-editor-foreground, #cccccc);
      opacity: 1;
    }

    i {
      font-size: 14px;
    }
  }
`;

/* ── Row number + checkbox cell ─────────────────── */
const DBViewerRowNumberCell = styled.td`
  border-right: 1px solid var(--vscode-editorWidget-border, #303030);
  border-bottom: 1px solid var(--vscode-editorWidget-border, #303030);
  background: var(--vscode-editorWidget-background, #252526);
  padding: 0 8px;
  min-width: 24px;
  width: 24px;
  height: 28px;
  text-align: center;
  vertical-align: middle;
  position: sticky;
  left: 0;
  z-index: 2;

  &.db-viewer-row-number {
    min-width: 40px;
    width: 40px;
    color: var(--vscode-descriptionForeground, #888888);
    font-size: 12px;
  }

  input[type="checkbox"] {
    accent-color: var(--vscode-checkbox-background, #007fd4);
    cursor: pointer;
  }
`;

/* ── Footer / status bar ────────────────────────── */
const DBViewerFooterDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  border-top: 1px solid var(--vscode-editorWidget-border, #454545);
  background: var(--vscode-statusBar-background, #007acc);
  color: var(--vscode-statusBar-foreground, #ffffff);
  font-size: 12px;
  flex-wrap: wrap;

  .db-viewer-footer-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .db-viewer-footer-filtered {
    opacity: 0.8;
  }

  .db-viewer-footer-pending {
    color: var(--vscode-statusBar-warningForeground, #e2c08d);
  }
`;

/* ── Pagination ─────────────────────────────────── */
const DBViewerPaginationDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  select {
    background: var(--vscode-dropdown-background, #3c3c3c);
    color: var(--vscode-dropdown-foreground, #cccccc);
    border: 1px solid var(--vscode-dropdown-border, #454545);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 12px;
    height: 24px;
    outline: none;
  }

  .db-viewer-page-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--vscode-statusBar-foreground, #ffffff);

    &:hover {
      opacity: 0.8;
    }

    i {
      font-size: 14px;
    }
  }

  .db-viewer-page-indicator {
    min-width: 48px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
`;

/* ── Column context menu (dropdown) ─────────────── */
const DBViewerColMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 180px;
  background: var(--vscode-menu-background, #252526);
  border: 1px solid var(--vscode-menu-border, #454545);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const DBViewerColMenuHeader = styled.div`
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground, #888888);
  border-bottom: 1px solid var(--vscode-menu-separatorBackground, #454545);
  margin-bottom: 4px;
  white-space: nowrap;
`;

const DBViewerColMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--vscode-menu-foreground, #cccccc);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  i {
    font-size: 13px;
    color: var(--vscode-descriptionForeground, #888888);
  }

  &:hover {
    background: var(--vscode-menu-selectionBackground, #04395e);
    color: var(--vscode-menu-selectionForeground, #ffffff);

    i {
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }
  }

  &.db-viewer-danger {
    color: var(--vscode-errorForeground, #f48771);

    i {
      color: var(--vscode-errorForeground, #f48771);
    }

    &:hover {
      background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      color: var(--vscode-errorForeground, #f48771);
    }
  }
`;

/* ── Empty state ────────────────────────────────── */
const DBViewerEmptyStateDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;

  i {
    font-size: 48px;
    color: var(--vscode-descriptionForeground, #555555);
  }

  span {
    color: var(--vscode-descriptionForeground, #999999);
  }
`;

export {
  DBViewerComponentMianDiv,
  DBViewerComponentHeaderDiv,
  DBViewerComponentBodyDiv,
  DBViewerToolbarDiv,
  DBViewerTableDiv,
  DBViewerTable,
  DBViewerTableHead,
  DBViewerTableBody,
  DBViewerTableRow,
  DBViewerCell,
  DBViewerHeaderCell,
  DBViewerRowNumberCell,
  DBViewerFooterDiv,
  DBViewerPaginationDiv,
  DBViewerColMenu,
  DBViewerColMenuHeader,
  DBViewerColMenuItem,
  DBViewerEmptyStateDiv,
};
