import { useEffect, useState } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
  host?: string;
  database?: string;
  username?: string;
  ssl?: boolean;
  createdAt: number;
  lastUsed?: number;
}

interface ConnectionFieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: readonly { label: string; value: string }[];
  helpText?: string;
  sensitive?: boolean;
  group?: string;
  dependsOn?: { field: string; value: string };
}

interface DatabaseDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  preview?: boolean;
  installed: boolean;
  fields?: ConnectionFieldDef[];
  defaultPort?: number;
}

interface Props {
  onClose: () => void;
  onConnected: () => void;
}

const CATEGORY_ORDER = [
  "SQL",
  "NoSQL",
  "Data Warehouse",
  "Cloud",
  "Lakehouse",
  "Application",
  "File Format",
  "Streaming",
  "Message Queue",
  "Graph",
  "Vector",
  "Cloud Provider",
];

const DB_CONNECTION_STYLES: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const DIALOG_STYLES: React.CSSProperties = {
  background: "var(--vscode-editor-background)",
  border: "1px solid var(--vscode-panel-border)",
  borderRadius: "6px",
  width: "90%",
  maxWidth: "600px",
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const HEADER_STYLES: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--vscode-panel-border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const BODY_STYLES: React.CSSProperties = {
  padding: "16px",
  overflowY: "auto",
  flex: 1,
};

const FOOTER_STYLES: React.CSSProperties = {
  padding: "12px 16px",
  borderTop: "1px solid var(--vscode-panel-border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const SEARCH_STYLES: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-input-border)",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  marginBottom: "12px",
};

const CATEGORY_STYLES: React.CSSProperties = {
  marginBottom: "16px",
};

const CATEGORY_HEADER_STYLES: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--vscode-descriptionForeground)",
  marginBottom: "8px",
  letterSpacing: "0.5px",
};

const DB_GRID_STYLES: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "6px",
};

const DB_ITEM_STYLES: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-panel-border)",
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  color: "var(--vscode-foreground)",
  textAlign: "left",
};

const DB_ITEM_SELECTED: React.CSSProperties = {
  ...DB_ITEM_STYLES,
  borderColor: "var(--vscode-focusBorder)",
  background: "var(--vscode-list-activeSelectionBackground)",
  color: "var(--vscode-list-activeSelectionForeground)",
};

const FORM_STYLES: React.CSSProperties = {
  marginTop: "16px",
  borderTop: "1px solid var(--vscode-panel-border)",
  paddingTop: "16px",
};

const FIELD_GROUP_STYLES: React.CSSProperties = {
  marginBottom: "12px",
};

const FIELD_GROUP_TITLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--vscode-descriptionForeground)",
  marginBottom: "8px",
};

const FIELD_STYLES: React.CSSProperties = {
  marginBottom: "10px",
};

const LABEL_STYLES: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  marginBottom: "4px",
  color: "var(--vscode-foreground)",
};

const INPUT_STYLES: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-input-border)",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  fontSize: "12px",
};

const HELP_STYLES: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--vscode-descriptionForeground)",
  marginTop: "2px",
};

const PREVIEW_BADGE: React.CSSProperties = {
  fontSize: "9px",
  background: "var(--vscode-badge-background)",
  color: "var(--vscode-badge-foreground)",
  padding: "1px 4px",
  borderRadius: "3px",
  marginLeft: "4px",
};

const SAVED_CONNECTION_STYLES: React.CSSProperties = {
  marginBottom: "16px",
  padding: "8px",
  border: "1px solid var(--vscode-panel-border)",
  borderRadius: "4px",
};

const SAVED_ITEM_STYLES: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 8px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const SAVED_ITEM_HOVER: React.CSSProperties = {
  ...SAVED_ITEM_STYLES,
  background: "var(--vscode-list-hoverBackground)",
};

export const DBConnectionDialog = ({ onClose, onConnected }: Props) => {
  const [databases, setDatabases] = useState<DatabaseDefinition[]>([]);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDb, setSelectedDb] = useState<DatabaseDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Request database list and saved connections
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_DATABASES });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_DATABASES_LISTED:
          setDatabases(message.payload as unknown as DatabaseDefinition[]);
          break;
        case ExtensionMessageType.DB_CONNECTIONS_LISTED:
          setSavedConnections(message.payload.connections);
          break;
        case ExtensionMessageType.DB_CONNECTION_TESTED:
          setTesting(false);
          setTestResult(message.payload.result);
          break;
        case ExtensionMessageType.DB_CONNECTED:
          setConnecting(false);
          onConnected();
          onClose();
          break;
        case ExtensionMessageType.DB_ERROR:
          setTesting(false);
          setConnecting(false);
          setError(message.payload.error);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose, onConnected]);

  const filteredDatabases = databases.filter((db) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return db.name.toLowerCase().includes(term) || db.category.toLowerCase().includes(term);
  });

  const groupedDatabases = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      dbs: filteredDatabases.filter((db) => db.category === cat),
    }))
    .filter((g) => g.dbs.length > 0);

  const handleSelectDb = (db: DatabaseDefinition) => {
    setSelectedDb(db);
    setFormValues({});
    setTestResult(null);
    setError(null);
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const buildConfig = () => {
    if (!selectedDb) return null;
    return {
      name: String(formValues["name"] ?? selectedDb.name),
      databaseId: selectedDb.id,
      ...formValues,
      createdAt: 0,
    } as { name: string; databaseId: string; createdAt: number };
  };

  const handleTest = () => {
    const config = buildConfig();
    if (!config) return;
    setTesting(true);
    setTestResult(null);
    setError(null);
    vscode._postMessage({
      messageType: WebviewMessageType.DB_TEST_CONNECTION,
      payload: { config },
    });
  };

  const handleSave = () => {
    const config = buildConfig();
    if (!config) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_SAVE_CONNECTION,
      payload: { config },
    });
  };

  const handleConnect = (connectionId?: string) => {
    setConnecting(true);
    setError(null);
    if (connectionId) {
      vscode._postMessage({
        messageType: WebviewMessageType.DB_CONNECT,
        payload: { connectionId },
      });
    } else {
      const config = buildConfig();
      if (!config) return;
      vscode._postMessage({
        messageType: WebviewMessageType.DB_CONNECT,
        payload: { config },
      });
    }
  };

  const visibleFields = (selectedDb?.fields ?? []).filter((field) => {
    if (!field.dependsOn) return true;
    return formValues[field.dependsOn.field] === field.dependsOn.value;
  });

  const groupedFields = visibleFields.reduce<Record<string, ConnectionFieldDef[]>>((acc, field) => {
    const group = field.group ?? "Connection";
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <div style={DB_CONNECTION_STYLES} onClick={onClose}>
      <div style={DIALOG_STYLES} onClick={(e) => e.stopPropagation()}>
        <div style={HEADER_STYLES}>
          <h3 style={{ margin: 0, fontSize: "14px" }}>New Connection</h3>
          <VsButton onClick={onClose} title="Close">
            <i className="codicon codicon-close" />
          </VsButton>
        </div>

        <div style={BODY_STYLES}>
          {error && (
            <div style={{ color: "var(--vscode-errorForeground)", marginBottom: "12px", fontSize: "12px" }}>
              {error}
            </div>
          )}

          {savedConnections.length > 0 && (
            <div style={SAVED_CONNECTION_STYLES}>
              <div style={CATEGORY_HEADER_STYLES}>Saved Connections</div>
              {savedConnections.map((conn) => (
                <div
                  key={conn.id}
                  style={SAVED_ITEM_STYLES}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, SAVED_ITEM_HOVER)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, SAVED_ITEM_STYLES)}
                  onClick={() => handleConnect(conn.id)}
                >
                  <span>
                    <i className="codicon codicon-database" style={{ marginRight: "6px" }} />
                    {conn.name}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
                    {conn.databaseId}
                  </span>
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Search databases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={SEARCH_STYLES}
          />

          {groupedDatabases.map(({ category, dbs }) => (
            <div key={category} style={CATEGORY_STYLES}>
              <div style={CATEGORY_HEADER_STYLES}>{category}</div>
              <div style={DB_GRID_STYLES}>
                {dbs.map((db) => (
                  <button
                    key={db.id}
                    style={selectedDb?.id === db.id ? DB_ITEM_SELECTED : DB_ITEM_STYLES}
                    onClick={() => handleSelectDb(db)}
                  >
                    <i className="codicon codicon-database" />
                    <span>{db.name}</span>
                    {db.preview && <span style={PREVIEW_BADGE}>Preview</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {selectedDb && (
            <div style={FORM_STYLES}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
                {selectedDb.name}
                {selectedDb.preview && <span style={PREVIEW_BADGE}>Preview</span>}
              </div>

              <div style={FIELD_STYLES}>
                <label style={LABEL_STYLES}>Connection name *</label>
                <input
                  type="text"
                  value={String(formValues["name"] ?? "")}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="My Connection"
                  style={INPUT_STYLES}
                />
              </div>

              {Object.entries(groupedFields).map(([group, fields]) => (
                <div key={group} style={FIELD_GROUP_STYLES}>
                  <div style={FIELD_GROUP_TITLE}>{group}</div>
                  {fields.map((field) => (
                    <div key={field.key} style={FIELD_STYLES}>
                      <label style={LABEL_STYLES}>
                        {field.label}
                        {field.required && " *"}
                      </label>
                      {field.type === "select" ? (
                        <select
                          value={String(formValues[field.key] ?? field.defaultValue ?? "")}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          style={INPUT_STYLES}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={Boolean(formValues[field.key] ?? field.defaultValue ?? false)}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        />
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={String(formValues[field.key] ?? "")}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          style={INPUT_STYLES}
                        />
                      ) : (
                        <input
                          type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                          value={String(formValues[field.key] ?? "")}
                          onChange={(e) => handleFieldChange(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                          placeholder={field.placeholder}
                          style={INPUT_STYLES}
                        />
                      )}
                      {field.helpText && <div style={HELP_STYLES}>{field.helpText}</div>}
                    </div>
                  ))}
                </div>
              ))}

              {testResult && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    background: testResult.success
                      ? "var(--vscode-testing-iconPassedForeground)"
                      : "var(--vscode-testing-iconFailedForeground)",
                    color: "var(--vscode-editor-background)",
                  }}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedDb && (
          <div style={FOOTER_STYLES}>
            <VsButton onClick={handleTest} $disabled={testing}>
              <i className="codicon codicon-debug-start" /> {testing ? "Testing..." : "Test"}
            </VsButton>
            <VsButton onClick={handleSave}>
              <i className="codicon codicon-save" /> Save
            </VsButton>
            <VsButton onClick={() => handleConnect()} $disabled={connecting}>
              <i className="codicon codicon-plug" /> {connecting ? "Connecting..." : "Connect"}
            </VsButton>
          </div>
        )}
      </div>
    </div>
  );
};