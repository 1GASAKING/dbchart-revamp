import { useEffect, useState } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";
import { requestOpenFile } from "../../utils/file-operations";
import { ToastProvider } from "../../contexts/toastcontext/toast-context-provider";
import { useToast } from "../../contexts/toastcontext/toast-context";
import { ALL_DATABASE_DEFINITIONS } from "@dbchart/schema";
import { DbConnectionSelectStep } from "../dbconnectioncomponents/db-connection-select-step";
import { DbConnectionConfigStep } from "../dbconnectioncomponents/db-connection-config-step";
import type { ConnectionFieldDef, DatabaseDefinition, Group, SavedConnection } from "../dbconnectioncomponents/db-connection-types";

const PAGE_STYLES: React.CSSProperties = { height: "100vh", display: "flex", flexDirection: "column", background: "var(--vscode-editor-background)" };
const HEADER_STYLES: React.CSSProperties = { padding: "12px 20px", borderBottom: "1px solid var(--vscode-panel-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 };
const BODY_STYLES: React.CSSProperties = { padding: "20px", overflowY: "auto", flex: 1 };
const FOOTER_STYLES: React.CSSProperties = { padding: "12px 20px", borderTop: "1px solid var(--vscode-panel-border)", display: "flex", justifyContent: "flex-end", gap: "8px", flexShrink: 0 };
const BACK_BTN: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", cursor: "pointer", background: "transparent", color: "var(--vscode-foreground)", border: "1px solid var(--vscode-panel-border)", borderRadius: "4px", fontSize: "12px" };

/** Full-page connection creator rendered in an editor window (replaces the modal dialog). */
export const CreateConnectionComponent = () => {
  const [databases] = useState<DatabaseDefinition[]>(ALL_DATABASE_DEFINITIONS as unknown as DatabaseDefinition[]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDb, setSelectedDb] = useState<DatabaseDefinition | null>(null);
  const [step, setStep] = useState<"select" | "configure">("select");
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: Record<string, unknown> } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { showToast } = useToast();

  const showErrorToast = (message: string, details?: Record<string, unknown>) => {
    const detailText = details ? Object.entries(details).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}: ${String(v)}`).join("  \u00b7  ") : "";
    showToast(detailText ? `${message}\n${detailText}` : message, "error");
  };

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_GROUPS });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_GROUPS_LISTED:
          setGroups(message.payload.groups);
          break;
        case ExtensionMessageType.DB_CONNECTIONS_LISTED:
          setSavedConnections(message.payload.connections);
          break;
        case ExtensionMessageType.DB_CONNECTION_SAVED:
          setEditingId(null); setStep("select"); showToast("Connection saved", "notification");
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_CONNECTION_TESTED:
          setTesting(false); setTestResult(message.payload.result);
          if (!message.payload.result.success) showErrorToast(message.payload.result.message, message.payload.result.details);
          else showToast("Connection test passed", "notification");
          break;
        case ExtensionMessageType.DB_CONNECTION_CONFIG:
          if (message.payload.config) setFormValues(message.payload.config as unknown as Record<string, unknown>);
          break;
        case ExtensionMessageType.DB_CONNECTION_DELETED:
          setSavedConnections((prev) => prev.filter((c) => c.id !== message.payload.connectionId));
          showToast("Connection deleted", "notification");
          break;
        case ExtensionMessageType.DB_CONNECTION_UPDATED:
          setEditingId(null); setStep("select"); showToast("Connection updated", "notification");
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_CONNECTED:
          setConnecting(false); showToast("Connected", "notification"); setStep("select"); setSelectedDb(null);
          break;
        case ExtensionMessageType.DB_ERROR:
          setTesting(false); setConnecting(false); setError(message.payload.error);
          showErrorToast(message.payload.error, message.payload.details);
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showToast]);

  const handleSelectDb = (db: DatabaseDefinition) => { setSelectedDb(db); setEditingId(null); setStep("configure"); setFormValues({}); setTestResult(null); setError(null); };
  const handleBack = () => { setStep("select"); setSelectedDb(null); setEditingId(null); setFormValues({}); setTestResult(null); setError(null); };
  const handleFieldChange = (key: string, value: unknown) => setFormValues((prev) => ({ ...prev, [key]: value }));

  const handleBrowse = async (field: ConnectionFieldDef) => {
    setError(null);
    const isJson = field.type === "json";
    const result = await requestOpenFile(isJson ? ["json"] : ["*"]);
    if (!result) return;
    setFormValues((prev) => ({ ...prev, [field.key]: isJson ? result.content : result.filePath }));
  };

  const buildConfig = () => {
    if (!selectedDb) return null;
    const groupId = formValues["groupId"] ? String(formValues["groupId"]) : undefined;
    return { name: String(formValues["name"] ?? selectedDb.name), databaseId: selectedDb.id, groupId, ...formValues, createdAt: 0 } as { name: string; databaseId: string; createdAt: number };
  };

  const handleTest = () => { const config = buildConfig(); if (!config) return; setTesting(true); setTestResult(null); setError(null); vscode._postMessage({ messageType: WebviewMessageType.DB_TEST_CONNECTION, payload: { config } }); };
  const handleSave = () => { const config = buildConfig(); if (!config) return; if (editingId) vscode._postMessage({ messageType: WebviewMessageType.DB_UPDATE_CONNECTION, payload: { id: editingId, config } }); else vscode._postMessage({ messageType: WebviewMessageType.DB_SAVE_CONNECTION, payload: { config } }); };
  const handleDeleteConnection = (connectionId: string) => vscode._postMessage({ messageType: WebviewMessageType.DB_DELETE_CONNECTION, payload: { connectionId } });
  const handleEditConnection = (conn: SavedConnection) => {
    const db = databases.find((d) => d.id === conn.databaseId);
    setEditingId(conn.id); setSelectedDb(db ?? { id: conn.databaseId, name: conn.databaseId, category: "", description: "", installed: true });
    setFormValues({}); setStep("configure"); setTestResult(null); setError(null);
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTION_CONFIG, payload: { connectionId: conn.id } });
  };
  const handleConnect = (connectionId?: string) => {
    setConnecting(true); setError(null);
    if (connectionId) vscode._postMessage({ messageType: WebviewMessageType.DB_CONNECT, payload: { connectionId } });
    else { const config = buildConfig(); if (!config) return; vscode._postMessage({ messageType: WebviewMessageType.DB_CONNECT, payload: { config } }); }
  };

  const visibleFields = (selectedDb?.fields ?? []).filter((field) => !field.dependsOn || formValues[field.dependsOn.field] === field.dependsOn.value);
  const groupedFields = visibleFields.reduce<Record<string, ConnectionFieldDef[]>>((acc, field) => {
    const group = field.group ?? "Connection";
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <div style={PAGE_STYLES}>
      <div style={HEADER_STYLES}>
        <h3 style={{ margin: 0, fontSize: "14px" }}>
          {step === "select" ? "New Connection" : editingId ? "Edit Connection" : `Setup ${selectedDb?.name ?? ""}`}
        </h3>
        <button style={BACK_BTN} onClick={() => vscode._postMessage({ messageType: WebviewMessageType.CLOSE_EDITOR })}>
          <i className="codicon codicon-arrow-left" /> Back to Sidebar
        </button>
      </div>

      <div style={BODY_STYLES}>
        {error && <div style={{ color: "var(--vscode-errorForeground)", marginBottom: "12px", fontSize: "12px" }}>{error}</div>}
        {step === "select" ? (
          <DbConnectionSelectStep
            databases={databases} savedConnections={savedConnections} searchTerm={searchTerm}
            onSearchChange={setSearchTerm} onSelectDb={handleSelectDb}
            onConnectSaved={(connId) => handleConnect(connId)} onEditSaved={handleEditConnection}
            onDeleteSaved={handleDeleteConnection}
          />
        ) : selectedDb ? (
          <DbConnectionConfigStep
            selectedDb={selectedDb} groups={groups} editingId={editingId} formValues={formValues}
            groupedFields={groupedFields} testResult={testResult} testing={testing} connecting={connecting}
            onBack={handleBack} onFieldChange={handleFieldChange} onBrowse={handleBrowse}
            onProjectChange={(value) => handleFieldChange("groupId", value)}
            onTest={handleTest} onSave={handleSave} onConnect={() => handleConnect()}
          />
        ) : null}
      </div>

      {step === "configure" && (
        <div style={FOOTER_STYLES}>
          <VsButton onClick={handleTest} $disabled={testing}>
            <i className="codicon codicon-debug-start" /> {testing ? "Testing..." : "Test"}
          </VsButton>
          <VsButton onClick={handleSave}>
            <i className="codicon codicon-save" /> {editingId ? "Update" : "Save"}
          </VsButton>
          <VsButton onClick={() => handleConnect()} $disabled={connecting}>
            <i className="codicon codicon-plug" /> {connecting ? "Connecting..." : "Connect"}
          </VsButton>
        </div>
      )}
    </div>
  );
};

const CreateConnectionPage = () => (
  <ToastProvider>
    <CreateConnectionComponent />
  </ToastProvider>
);

export default CreateConnectionPage;