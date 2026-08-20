import { useEffect, useState } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";

interface ColumnDef {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
}

interface SchemaData {
  databaseName: string;
  tables: { name: string; columns: ColumnDef[] }[];
}

interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  executionTimeMs: number;
  isResultSet: boolean;
  rawOutput?: string;
}

interface Props {
  onConnect: () => void;
}

const CONTAINER: React.CSSProperties = {
  display: "flex",
  height: "100%",
  gap: "0",
  overflow: "hidden",
};

const SIDEBAR: React.CSSProperties = {
  width: "200px",
  borderRight: "1px solid var(--vscode-panel-border)",
  overflowY: "auto",
  padding: "8px 0",
  flexShrink: 0,
};

const MAIN: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const TABLE_ITEM: React.CSSProperties = {
  padding: "4px 12px",
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const TOOLBAR: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--vscode-panel-border)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const GRID_WRAP: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
};

const TABLE: React.CSSProperties = {
  borderCollapse: "collapse",
  fontSize: "12px",
  width: "100%",
};

const TH: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--vscode-editor-background)",
  borderBottom: "1px solid var(--vscode-panel-border)",
  borderRight: "1px solid var(--vscode-panel-border)",
  padding: "4px 8px",
  textAlign: "left",
  fontWeight: 600,
  zIndex: 1,
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  borderBottom: "1px solid var(--vscode-panel-border)",
  borderRight: "1px solid var(--vscode-panel-border)",
  padding: "0",
};

const CELL_INPUT: React.CSSProperties = {
  width: "100%",
  minWidth: "80px",
  padding: "4px 8px",
  border: "none",
  background: "transparent",
  color: "var(--vscode-input-foreground)",
  fontSize: "12px",
  fontFamily: "inherit",
};

const STATUS: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--vscode-descriptionForeground)",
  padding: "4px 12px",
  borderTop: "1px solid var(--vscode-panel-border)",
};

const BTN: React.CSSProperties = {
  padding: "4px 10px",
  cursor: "pointer",
  background: "var(--vscode-button-background)",
  color: "var(--vscode-button-foreground)",
  border: "none",
  borderRadius: "3px",
  fontSize: "12px",
};

export const DatabaseBrowser = ({ onConnect }: Props) => {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const handle = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_SCHEMA:
          if ("schema" in message.payload) {
            setSchema(message.payload.schema as SchemaData);
          }
          break;
        case ExtensionMessageType.DB_QUERY_RESULT:
          if (message.payload.result.columns.length || message.payload.result.rows.length) {
            setColumns(cs => cs.length > 0 ? cs : message.payload.result.columns.map(c => ({ name: c, type: "", nullable: true, primaryKey: false })));
            setRows(message.payload.result.rows);
            setStatus(`${message.payload.result.rows.length} row(s) · ${message.payload.result.executionTimeMs}ms`);
            setError(null);
          } else {
            // write result
            setStatus(`${message.payload.result.rowCount ?? 0} row(s) affected`);
            setError(null);
          }
          setLoading(false);
          break;
        case ExtensionMessageType.DB_ERROR:
          setError(message.payload.error);
          setLoading(false);
          break;
        case ExtensionMessageType.DB_CONNECTED:
          refreshSchema();
          break;
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  const refreshSchema = () => {
    setError(null);
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_SCHEMA });
  };

  useEffect(() => {
    refreshSchema();
  }, []);

  const openTable = (name: string) => {
    setActiveTable(name);
    setLoading(true);
    setError(null);
    const cols = schema?.tables.find((t) => t.name === name)?.columns ?? [];
    setColumns(cols);
    const quoted = quoteIdent(name);
    vscode._postMessage({
      messageType: WebviewMessageType.DB_EXECUTE_QUERY,
      payload: { query: `SELECT * FROM ${quoted} LIMIT 200` },
    });
  };

  const pk = columns.find((c) => c.primaryKey)?.name ?? columns.find((c) => c.name.toLowerCase() === "id")?.name;

  const editCell = (row: Record<string, unknown>, col: ColumnDef, value: string) => {
    if (!pk) { setError("No primary key / id column detected for row updates."); return; }
    const id = row[pk];
    const quoted = quoteIdent(activeTable!);
    const qcol = quoteIdent(col.name);
    const sql = `UPDATE ${quoted} SET ${qcol} = ${toSqlValue(value)} WHERE ${quoteIdent(pk)} = ${toSqlValue(String(id))}`;
    run(sql);
  };

  const addRow = () => {
    if (!columns.length) { return; }
    const quoted = quoteIdent(activeTable!);
    const cols = columns.filter((c) => !c.primaryKey);
    if (!cols.length) { setError("No writable columns."); return; }
    const colList = cols.map((c) => quoteIdent(c.name)).join(", ");
    const valList = cols.map(() => "NULL").join(", ");
    const sql = `INSERT INTO ${quoted} (${colList}) VALUES (${valList})`;
    run(sql);
    setTimeout(openTable.bind(null, activeTable!), 300);
  };

  const deleteRow = (row: Record<string, unknown>) => {
    if (!pk) { setError("No primary key / id column detected for row deletes."); return; }
    const sql = `DELETE FROM ${quoteIdent(activeTable!)} WHERE ${quoteIdent(pk)} = ${toSqlValue(String(row[pk]))}`;
    run(sql);
    setTimeout(openTable.bind(null, activeTable!), 300);
  };

  const run = (sql: string) => {
    setLoading(true);
    vscode._postMessage({ messageType: WebviewMessageType.DB_EXECUTE_QUERY, payload: { query: sql } });
  };

  if (!schema || !schema.tables.length) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "var(--vscode-descriptionForeground)" }}>
          No database connected. Connect to browse tables and edit data.
        </p>
        <button style={BTN} onClick={onConnect}>
          <i className="codicon codicon-plug" /> Connect
        </button>
        <button style={{ ...BTN, marginLeft: "8px" }} onClick={refreshSchema}>
          <i className="codicon codicon-refresh" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={CONTAINER}>
      <div style={SIDEBAR}>
        <div style={{ padding: "4px 12px 8px", fontSize: "11px", color: "var(--vscode-descriptionForeground)", textTransform: "uppercase" }}>
          {schema.databaseName}
        </div>
        {schema.tables.map((t) => (
          <div
            key={t.name}
            style={{ ...TABLE_ITEM, background: activeTable === t.name ? "var(--vscode-list-activeSelectionBackground)" : "transparent", color: activeTable === t.name ? "var(--vscode-list-activeSelectionForeground)" : undefined }}
            onClick={() => openTable(t.name)}
          >
            <i className="codicon codicon-table" />
            {t.name}
          </div>
        ))}
      </div>

      <div style={MAIN}>
        <div style={TOOLBAR}>
          <strong style={{ fontSize: "13px" }}>{activeTable ?? "Select a table"}</strong>
          <div style={{ flex: 1 }} />
          <button style={BTN} onClick={refreshSchema} title="Refresh schema"><i className="codicon codicon-refresh" /></button>
          {activeTable && (
            <>
              <button style={BTN} onClick={addRow}><i className="codicon codicon-add" /> Row</button>
            </>
          )}
        </div>

        {error && <div style={{ padding: "8px 12px", color: "var(--vscode-errorForeground)", fontSize: "12px" }}>{error}</div>}

        <div style={GRID_WRAP}>
          {activeTable && columns.length > 0 && (
            <table style={TABLE}>
              <thead>
                <tr>
                  <TH style={{ width: "36px" }}>#</TH>
                  {columns.map((c) => (
                    <TH key={c.name}>{c.name}{c.primaryKey ? " 🔑" : ""}</TH>
                  ))}
                  <TH style={{ width: "60px" }}></TH>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <TD style={{ textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>{i + 1}</TD>
                    {columns.map((c) => (
                      <TD key={c.name}>
                        <input
                          style={CELL_INPUT}
                          defaultValue={row[c.name] == null ? "" : String(row[c.name])}
                          onBlur={(e) => { const v = e.target.value; const orig = row[c.name] == null ? "" : String(row[c.name]); if (v !== orig) editCell(row, c, v); }}
                        />
                      </TD>
                    ))}
                    <TD style={{ textAlign: "center" }}>
                      <button style={{ ...BTN, padding: "2px 6px" }} onClick={() => deleteRow(row)} title="Delete row">
                        <i className="codicon codicon-trash" />
                      </button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTable && !loading && rows.length === 0 && !error && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--vscode-descriptionForeground)", fontSize: "12px" }}>
              No rows.
            </div>
          )}
        </div>

        <div style={STATUS}>{status}</div>
      </div>
    </div>
  );
};

function quoteIdent(name: string): string {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) { return `"${name}"`; }
  return `"${name.replace(/"/g, '""')}"`;
}

function toSqlValue(v: string): string {
  if (v === "") { return "NULL"; }
  if (/^-?\d+(\.\d+)?$/.test(v)) { return v; }
  if (v.toLowerCase() === "true" || v.toLowerCase() === "false") { return v.toUpperCase(); }
  if (v.toLowerCase() === "null") { return "NULL"; }
  return `'${v.replace(/'/g, "''")}'`;
}