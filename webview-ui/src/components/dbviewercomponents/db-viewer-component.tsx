import { useMemo, useState } from "react";
import {
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
  DBViewerColMenu,
  DBViewerColMenuHeader,
  DBViewerColMenuItem,
  DBViewerPaginationDiv,
} from "../../styles/dbviewcomponentsstyles/dbviewercomponentstyles";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

/* ─────────────────────────────────────────────
   Pseudo input data
   (In production this would be passed in as props
   from the extension host, e.g. from a SQL query result.)
───────────────────────────────────────────── */
interface DBColumnDef {
  id: string;
  label: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
}

interface DBRowData {
  id: string;
  [columnId: string]: string | number | boolean | null | undefined;
}

const pseudoColumns: DBColumnDef[] = [
  { id: "id", label: "id", type: "int", primaryKey: true },
  { id: "name", label: "name", type: "varchar(255)" },
  { id: "email", label: "email", type: "varchar(255)" },
  { id: "role", label: "role", type: "varchar(50)" },
  { id: "created_at", label: "created_at", type: "timestamp" },
];

const pseudoRows: DBRowData[] = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "admin",
    created_at: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    name: "Alan Turing",
    email: "alan@example.com",
    role: "editor",
    created_at: "2024-02-01 09:00:00",
  },
  {
    id: "3",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "viewer",
    created_at: "2024-02-14 14:45:00",
  },
  {
    id: "4",
    name: "Linus Torvalds",
    email: "linus@example.com",
    role: "editor",
    created_at: "2024-03-05 08:15:00",
  },
  {
    id: "5",
    name: "Margaret Hamilton",
    email: "margaret@example.com",
    role: "admin",
    created_at: "2024-03-20 16:20:00",
  },
];

const DBViewerComponent = () => {
  /* ── State (pseudo — replace with real data from props) ────────── */
  const [columns] = useState<DBColumnDef[]>(pseudoColumns);
  const [rows] = useState<DBRowData[]>(pseudoRows);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [cellValue, setCellValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [colMenuOpen, setColMenuOpen] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<unknown[]>([]);
  const [redoStack, setRedoStack] = useState<unknown[]>([]);

  const [originalRowsPseudo] = useState<DBRowData[]>(pseudoRows); // for revert
  void originalRowsPseudo;

  /* ── Derived data ─────────────────────────────────────────────── */
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  /* ── Pseudo action handlers (replace with real logic) ─────────── */
  const handleUndo = () => {
    // Pseudo: pop undoStack, apply, push to redoStack
    // const previous = undoStack.at(-1); applyDiff(previous); ...
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([]);
  };

  const handleRedo = () => {
    // Pseudo: pop redoStack, apply, push to undoStack
    // const next = redoStack.at(-1); applyDiff(next); ...
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([]);
  };

  const handleSave = () => {
    // Pseudo: collect diff vs originalRowsPseudo, send via vscode.postMessage
    // const diff = computeDiff(originalRowsPseudo, rows); vscode._postMessage({...});
  };

  const handleAddRow = () => {
    // Pseudo: insert a new blank row at the bottom
    // const newRow = createBlankRow(columns); setRows([...rows, newRow]);
  };

  const handleAddColumn = () => {
    // Pseudo: prompt for column name/type, append to columns
    // const colMeta = await promptForColumn(); setColumns([...columns, colMeta]);
  };

  const handleDeleteSelected = () => {
    // Pseudo: if selectedRows.size > 0, confirm then remove
    // setRows(rows.filter(r => !selectedRows.has(r.id)));
    setSelectedRows(new Set());
  };

  const handleRevert = (_rowId: string, _columnId: string) => {
    // Pseudo: restore original value from originalRowsPseudo
    // const originalRow = originalRowsPseudo.find(r => r.id === rowId);
    // patchCell(rowId, columnId, originalRow?.[columnId]);
  };

  const handleCellClick = (rowId: string, columnId: string, value: unknown) => {
    setEditingCell({ rowId, columnId });
    setCellValue(String(value ?? ""));
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCellValue(e.target.value);
  };

  const handleCellCommit = () => {
    // Pseudo: push old value to undoStack, write new value to rows
    // if (editingCell) setUndoStack([...undoStack, { type: "cell", ...editingCell, oldValue }]);
    setEditingCell(null);
  };

  const handleOptions = (columnId: string) => {
    setColMenuOpen(colMenuOpen === columnId ? null : columnId);
  };

  const handleCopy = () => {
    // Pseudo: navigator.clipboard.writeText(buildTextFromSelection(selectedRows, columns));
  };

  const handlePaste = () => {
    // Pseudo: const text = await navigator.clipboard.readText(); applyPastedMatrix(text);
  };

  return (
    <DBViewerComponentMianDiv>
      {/* ── Header: table name + actions ─────────────────────────── */}
      <DBViewerComponentHeaderDiv>
        <div>
          <div className="db-viewer-title-group">
            <div className="db-viewer-table-title">users</div>
            <div className="db-viewer-table-description">
              Showing {pagedRows.length} of {filteredRows.length} rows ·{" "}
              {columns.length} columns
            </div>
          </div>
          <div className="left-items">
            <div className="db-viewer-action-button">
              <VsButton onClick={()=> handleOptions?.(columns[0]?.id ?? "")} title="Options">
                <i className="codicon codicon-settings-gear" /> options
              </VsButton>
            </div>
            <div className="db-viewer-action-button">
              <VsButton onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={undoStack.length === 0}>
                <i className="codicon codicon-undo" /> undo
              </VsButton>
            </div>
            <div className="db-viewer-action-button">
              <VsButton onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={redoStack.length === 0}>
                <i className="codicon codicon-redo" /> redo
              </VsButton>
            </div>
            <div className="db-viewer-action-button">
              <VsButton onClick={handleSave} title="Save changes">
                <i className="codicon codicon-save" /> save
              </VsButton>
            </div>
            <div className="db-viewer-action-button">
              <VsButton onClick={handleAddRow} title="Insert new row">
                <i className="codicon codicon-add" /> new
              </VsButton>
            </div>
          </div>
        </div>
      </DBViewerComponentHeaderDiv>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <DBViewerComponentBodyDiv>
        {/* Toolbar: search + batch operations */}
        <DBViewerToolbarDiv>
          <div className="db-viewer-search">
            <i className="codicon codicon-search" />
            <input
              type="text"
              placeholder="Search rows…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="db-viewer-toolbar-actions">
            <VsButton className="db-viewer-toolbar-button" onClick={handleAddColumn}>
              <i className="codicon codicon-new-file" /> Add column
            </VsButton>
            <VsButton
              className={`db-viewer-toolbar-button${selectedRows.size > 0 ? " action" : ""}`}
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
            >
              <i className="codicon codicon-trash" /> Delete rows
            </VsButton>
            <VsButton className="db-viewer-toolbar-button" onClick={handleCopy}>
              <i className="codicon codicon-copy" /> Copy
            </VsButton>
            <VsButton className="db-viewer-toolbar-button" onClick={handlePaste}>
              <i className="codicon codicon-paste" /> Paste
            </VsButton>
          </div>
        </DBViewerToolbarDiv>

        {/* Table */}
        <DBViewerTableDiv>
          <DBViewerTable>
            <DBViewerTableHead>
              <tr>
                <DBViewerRowNumberCell>
                  <input
                    type="checkbox"
                    title="Select all rows on this page"
                    checked={pagedRows.length > 0 && pagedRows.every((r) => selectedRows.has(r.id))}
                    onChange={(e) => {
                      const next = new Set(selectedRows);
                      pagedRows.forEach((r) => {
                        if (e.target.checked) next.add(r.id);
                        else next.delete(r.id);
                      });
                      setSelectedRows(next);
                    }}
                  />
                </DBViewerRowNumberCell>
                <DBViewerRowNumberCell>#</DBViewerRowNumberCell>
                {columns.map((col) => (
                  <DBViewerHeaderCell key={col.id}>
                    <div className="db-viewer-col-header">
                      <span className="db-viewer-col-name">
                        {col.primaryKey && <i className="codicon codicon-key" title="Primary key" />}
                        {col.label}
                      </span>
                      <VsButton
                        className="db-viewer-col-menu-btn"
                        onClick={() => handleOptions(col.id)}
                        title="Column options"
                      >
                        <i className="codicon codicon-chevron-down" />
                      </VsButton>
                    </div>
                    {colMenuOpen === col.id && (
                      <DBViewerColMenu>
                        <DBViewerColMenuHeader>
                          {col.label} — {col.type}
                        </DBViewerColMenuHeader>
                        <DBViewerColMenuItem onClick={handleAddColumn}>
                          <i className="codicon codicon-insert" /> Insert column after
                        </DBViewerColMenuItem>
                        <DBViewerColMenuItem onClick={handleCopy}>
                          <i className="codicon codicon-copy" /> Copy column values
                        </DBViewerColMenuItem>
                        <DBViewerColMenuItem
                          onClick={handleAddColumn}
                          className="db-viewer-danger"
                        >
                          <i className="codicon codicon-trash" /> Delete column
                        </DBViewerColMenuItem>
                      </DBViewerColMenu>
                    )}
                  </DBViewerHeaderCell>
                ))}
                <DBViewerHeaderCell className="db-viewer-add-col-cell">
                  <VsButton className="db-viewer-add-col-btn" onClick={handleAddColumn} title="Add column">
                    <i className="codicon codicon-add" />
                  </VsButton>
                </DBViewerHeaderCell>
              </tr>
            </DBViewerTableHead>

            <DBViewerTableBody>
              {pagedRows.length === 0 ? (
                <tr className="db-viewer-empty-row">
                  <td colSpan={columns.length + 3}>
                    <div className="db-viewer-empty">
                      <i className="codicon codicon-inbox" />
                      <span>
                        {searchTerm ? "No rows match your search." : "No rows here yet."}
                      </span>
                      <VsButton className="db-viewer-empty-btn" onClick={handleAddRow}>
                        <i className="codicon codicon-add" /> New row
                      </VsButton>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, rowIndex) => {
                  const globalIndex = (safePage - 1) * pageSize + rowIndex + 1;
                  const isSelected = selectedRows.has(row.id);
                  return (
                    <DBViewerTableRow
                      key={row.id}
                      className={isSelected ? "db-viewer-selected" : ""}
                    >
                      <DBViewerRowNumberCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const next = new Set(selectedRows);
                            if (e.target.checked) next.add(row.id);
                            else next.delete(row.id);
                            setSelectedRows(next);
                          }}
                        />
                      </DBViewerRowNumberCell>
                      <DBViewerRowNumberCell className="db-viewer-row-number">
                        {globalIndex}
                      </DBViewerRowNumberCell>
                      {columns.map((col) => {
                        const value = row[col.id];
                        const isEditing =
                          editingCell?.rowId === row.id &&
                          editingCell?.columnId === col.id;
                        return (
                          <DBViewerCell
                            key={col.id}
                            className={isEditing ? "db-viewer-editing" : ""}
                            onClick={() => handleCellClick(row.id, col.id, value)}
                            title={col.nullable && value == null ? "NULL" : String(value ?? "")}
                          >
                            {value == null ? (
                              <span className="db-viewer-null">NULL</span>
                            ) : isEditing ? (
                              <input
                                autoFocus
                                value={cellValue}
                                onChange={handleCellChange}
                                onBlur={handleCellCommit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCellCommit();
                                  if (e.key === "Escape") {
                                    setEditingCell(null);
                                    setCellValue("");
                                  }
                                }}
                              />
                            ) : (
                              <span className="db-viewer-cell-value">
                                {String(value)}
                              </span>
                            )}
                          </DBViewerCell>
                        );
                      })}
                      <DBViewerCell className="db-viewer-row-actions">
                        <VsButton
                          className="db-viewer-row-revert"
                          title="Revert this row to original"
                          onClick={() => handleRevert(row.id, "name")}
                        >
                          <i className="codicon codicon-discard" />
                        </VsButton>
                      </DBViewerCell>
                    </DBViewerTableRow>
                  );
                })
              )}
            </DBViewerTableBody>
          </DBViewerTable>
        </DBViewerTableDiv>

        {/* Footer / status bar */}
        <DBViewerFooterDiv>
          <div className="db-viewer-footer-info">
            <span>
              {selectedRows.size > 0
                ? `${selectedRows.size} row${selectedRows.size === 1 ? "" : "s"} selected`
                : `${filteredRows.length} row${filteredRows.length === 1 ? "" : "s"}`}
            </span>
            {searchTerm && (
              <span className="db-viewer-footer-filtered">
                (filtered from {rows.length})
              </span>
            )}
            <span className="db-viewer-footer-pending">
              {undoStack.length > 0 ? `● ${undoStack.length} unsaved change${undoStack.length === 1 ? "" : "s"}` : ""}
            </span>
          </div>

          <DBViewerPaginationDiv>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              title="Rows per page"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <VsButton
              className="db-viewer-page-btn"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              <i className="codicon codicon-chevron-left" />
            </VsButton>
            <span className="db-viewer-page-indicator">
              {safePage} / {totalPages}
            </span>
            <VsButton
              className="db-viewer-page-btn"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              <i className="codicon codicon-chevron-right" />
            </VsButton>
          </DBViewerPaginationDiv>
        </DBViewerFooterDiv>
      </DBViewerComponentBodyDiv>
    </DBViewerComponentMianDiv>
  );
};

export default DBViewerComponent;
