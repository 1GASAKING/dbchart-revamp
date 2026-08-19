import { useEffect, useState } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  executionTimeMs: number;
  isResultSet: boolean;
  rawOutput?: string;
}

interface Props {
  connected: boolean;
  onConnect: () => void;
}

const CONTAINER_STYLES: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  gap: "8px",
  padding: "12px",
};

const TOOLBAR_STYLES: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const TEXTAREA_STYLES: React.CSSProperties = {
  width: "100%",
  minHeight: "100px",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-input-border)",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  fontFamily: "var(--vscode-editor-font-family)",
  fontSize: "12px",
  resize: "vertical",
};

const RESULT_STYLES: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  border: "1px solid var(--vscode-panel-border)",
  borderRadius: "4px",
};

const TABLE_STYLES: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
};

const TH_STYLES: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--vscode-editor-background)",
  borderBottom: "1px solid var(--vscode-panel-border)",
  padding: "4px 8px",
  textAlign: "left",
  fontWeight: 600,
  zIndex: 1,
};

const TD_STYLES: React.CSSProperties = {
  borderBottom: "1px solid var(--vscode-panel-border)",
  padding: "4px 8px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "300px",
};

const STATUS_STYLES: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--vscode-descriptionForeground)",
};

const ERROR_STYLES: React.CSSProperties = {
  color: "var(--vscode-errorForeground)",
  fontSize: "12px",
  padding: "8px",
};

export const DBQueryEditor = ({ connected, onConnect }: Props) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [schemaTables, setSchemaTables] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"query" | "schema">("query");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_QUERY_RESULT:
          setResult(message.payload.result);
          setError(null);
          setExecuting(false);
          break;
        case ExtensionMessageType.DB_ERROR:
          setError(message.payload.error);
          setExecuting(false);
          break;
        case ExtensionMessageType.DB_SCHEMA:
          if ("schema" in message.payload) {
            const schema = (message.payload as { schema: { tables: { name: string }[] } }).schema;
            setSchemaTables(schema.tables.map((t) => t.name));
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleExecute = () => {
    if (!query.trim()) return;
    setExecuting(true);
    setError(null);
    vscode._postMessage({
      messageType: WebviewMessageType.DB_EXECUTE_QUERY,
      payload: { query },
    });
  };

  const handleLoadSchema = () => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_SCHEMA });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    }
  };

  if (!connected) {
    return (
      <div style={CONTAINER_STYLES}>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <i className="codicon codicon-plug" style={{ fontSize: "32px" }} />
          <h3 style={{ margin: "8px 0" }}>Not Connected</h3>
          <p style={{ color: "var(--vscode-descriptionForeground)", fontSize: "12px" }}>
            Connect to a database to run queries.
          </p>
          <VsButton onClick={onConnect}>
            <i className="codicon codicon-plug" /> Connect to Database
          </VsButton>
        </div>
      </div>
    );
  }

  return (
    <div style={CONTAINER_STYLES}>
      <div style={TOOLBAR_STYLES}>
        <VsButton onClick={() => setActiveTab("query")} className={activeTab === "query" ? "active" : ""}>
          <i className="codicon codicon-code" /> Query
        </VsButton>
        <VsButton onClick={() => { setActiveTab("schema"); handleLoadSchema(); }} className={activeTab === "schema" ? "active" : ""}>
          <i className="codicon codicon-table" /> Schema
        </VsButton>
        <div style={{ flex: 1 }} />
        <VsButton onClick={handleLoadSchema} title="Refresh schema">
          <i className="codicon codicon-refresh" />
        </VsButton>
      </div>

      {activeTab === "query" ? (
        <>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter SQL query... (Ctrl+Enter to execute)"
            style={TEXTAREA_STYLES}
          />

          <div style={TOOLBAR_STYLES}>
            <VsButton onClick={handleExecute} disabled={executing || !query.trim()}>
              <i className="codicon codicon-play" /> {executing ? "Executing..." : "Execute"}
            </VsButton>
            <VsButton onClick={() => setQuery("")} disabled={!query}>
              <i className="codicon codicon-clear-all" /> Clear
            </VsButton>
          </div>
        </>
      ) : (
        <div style={{ ...RESULT_STYLES, padding: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
            Tables ({schemaTables.length})
          </div>
          {schemaTables.length === 0 ? (
            <div style={{ color: "var(--vscode-descriptionForeground)", fontSize: "12px" }}>
              No tables found. Click refresh to load schema.
            </div>
          ) : (
            schemaTables.map((table) => (
              <div
                key={table}
                style={{
                  padding: "6px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--vscode-panel-border)",
                }}
                onClick={() => setQuery(`SELECT * FROM ${table} LIMIT 100;`)}
                title={`Click to SELECT from ${table}`}
              >
                <i className="codicon codicon-table" style={{ marginRight: "6px" }} />
                {table}
              </div>
            ))
          )}
        </div>
      )}

      {error && <div style={ERROR_STYLES}>{error}</div>}

      {result && activeTab === "query" && (
        <div style={RESULT_STYLES}>
          <div style={STATUS_STYLES}>
            {result.rowCount !== undefined
              ? `${result.rowCount} row(s) affected`
              : `${result.rows.length} row(s) returned`}{" "}
            · {result.executionTimeMs}ms
          </div>

          {result.isResultSet && result.columns.length > 0 ? (
            <table style={TABLE_STYLES}>
              <thead>
                <tr>
                  {result.columns.map((col) => (
                    <th key={col} style={TH_STYLES}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 100).map((row, idx) => (
                  <tr key={idx}>
                    {result.columns.map((col) => (
                      <td key={col} style={TD_STYLES}>
                        {row[col] === null || row[col] === undefined
                          ? "NULL"
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "8px", fontSize: "12px" }}>
              {result.rawOutput ?? `Query executed successfully. ${result.rowCount ?? 0} row(s) affected.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};