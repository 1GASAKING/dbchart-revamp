import { useEffect, useState } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";
import { requestOpenFile } from "../../utils/file-operations";
import { ToastProvider } from "../../contexts/toastcontext/toast-context-provider";
import { useToast } from "../../contexts/toastcontext/toast-context";
import { DbConnectionSelectStep } from "./db-connection-select-step";
import { DbConnectionConfigStep } from "./db-connection-config-step";
import { ALL_DATABASE_DEFINITIONS } from "@dbchart/schema";
import type { ConnectionFieldDef, DatabaseDefinition, Group, SavedConnection } from "./db-connection-types";

export interface ConnectionDialogProps {
  onClose: () => void;
  onConnected: () => void;
}

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

export const DBConnectionDialog = ({ onClose, onConnected }: ConnectionDialogProps) => {
  return (
    <ToastProvider>
      <ConnectionDialogContent onClose={onClose} onConnected={onConnected} />
    </ToastProvider>
  );
};

const ConnectionDialogContent = ({ onClose, onConnected }: ConnectionDialogProps) => {
  // Client definitions are a shared const — the UI reads grouped fields
  // directly from @dbchart/schema (no webview round-trip needed).
  const [databases] = useState<DatabaseDefinition[]>(
    ALL_DATABASE_DEFINITIONS as unknown as DatabaseDefinition[]
  );
  const [groups, setProjects] = useState<Group[]>([]);
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

  const formatDetails = (details?: Record<string, unknown>): string => {
    if (!details) return "";
    const entries = Object.entries(details).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join("  \u00b7  ");
  };

  const showErrorToast = (message: string, details?: Record<string, unknown>) => {
    const detailText = formatDetails(details);
    showToast(detailText ? `${message}\n${detailText}` : message, "error");
  };

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_GROUPS });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_CONNECTIONS_LISTED:
          setSavedConnections(message.payload.connections);
          break;
        case ExtensionMessageType.DB_GROUPS_LISTED:
          setProjects(message.payload.groups);
          break;
        case ExtensionMessageType.DB_CONNECTION_SAVED:
          setEditingId(null);
          setStep("select");
          showToast("Connection saved", "notification");
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_CONNECTION_TESTED:
          setTesting(false);
          setTestResult(message.payload.result);
          if (!message.payload.result.success) {
            showErrorToast(
              message.payload.result.message,
              message.payload.result.details as Record<string, unknown> | undefined
            );
          } else {
            showToast("Connection test passed", "notification");
          }
          break;
        case ExtensionMessageType.DB_CONNECTION_CONFIG:
          if (message.payload.config) {
            setFormValues(message.payload.config as unknown as Record<string, unknown>);
          }
          break;
        case ExtensionMessageType.DB_CONNECTION_DELETED:
          setSavedConnections((prev) => prev.filter((c) => c.id !== message.payload.connectionId));
          showToast("Connection deleted", "notification");
          break;
        case ExtensionMessageType.DB_CONNECTION_UPDATED:
          setEditingId(null);
          setStep("select");
          showToast("Connection updated", "notification");
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
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
          showErrorToast(message.payload.error, message.payload.details);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose, onConnected, showToast]);

  const handleSelectDb = (db: DatabaseDefinition) => {
    setSelectedDb(db);
    setEditingId(null);
    setStep("configure");
    setFormValues({});
    setTestResult(null);
    setError(null);
  };

  const handleBack = () => {
    setStep("select");
    setSelectedDb(null);
    setEditingId(null);
    setFormValues({});
    setTestResult(null);
    setError(null);
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBrowse = async (field: ConnectionFieldDef) => {
    setError(null);
    const isJson = field.type === "json";
    const result = await requestOpenFile(isJson ? ["json"] : ["*"]);
    if (!result) return; // cancelled or errored

    if (isJson) {
      setFormValues((prev) => ({ ...prev, [field.key]: result.content }));
    } else {
      setFormValues((prev) => ({ ...prev, [field.key]: result.filePath }));
    }
  };

  const buildConfig = () => {
    if (!selectedDb) return null;
    const groupId = formValues["groupId"] ? String(formValues["groupId"]) : undefined;
    return {
      name: String(formValues["name"] ?? selectedDb.name),
      databaseId: selectedDb.id,
      groupId,
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
    if (editingId) {
      vscode._postMessage({
        messageType: WebviewMessageType.DB_UPDATE_CONNECTION,
        payload: { id: editingId, config },
      });
    } else {
      vscode._postMessage({
        messageType: WebviewMessageType.DB_SAVE_CONNECTION,
        payload: { config },
      });
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_DELETE_CONNECTION,
      payload: { connectionId },
    });
  };

  const handleEditConnection = (conn: SavedConnection) => {
    const db = databases.find((d) => d.id === conn.databaseId);
    setEditingId(conn.id);
    setSelectedDb(
      db ?? {
        id: conn.databaseId,
        name: conn.databaseId,
        category: "",
        description: "",
        installed: true,
      }
    );
    setFormValues({});
    setStep("configure");
    setTestResult(null);
    setError(null);
    vscode._postMessage({
      messageType: WebviewMessageType.DB_GET_CONNECTION_CONFIG,
      payload: { connectionId: conn.id },
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
          <h3 style={{ margin: 0, fontSize: "14px" }}>
            {step === "select"
              ? "New Connection"
              : editingId
              ? "Edit Connection"
              : `Setup ${selectedDb?.name ?? ""}`}
          </h3>
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

          {step === "select" ? (
            <DbConnectionSelectStep
              databases={databases}
              savedConnections={savedConnections}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectDb={handleSelectDb}
              onConnectSaved={(connId) => handleConnect(connId)}
              onEditSaved={handleEditConnection}
              onDeleteSaved={handleDeleteConnection}
            />
          ) : selectedDb ? (
            <DbConnectionConfigStep
              selectedDb={selectedDb}
              groups={groups}
              editingId={editingId}
              formValues={formValues}
              groupedFields={groupedFields}
              testResult={testResult}
              testing={testing}
              connecting={connecting}
              onBack={handleBack}
              onFieldChange={handleFieldChange}
              onBrowse={handleBrowse}
              onProjectChange={(value) => handleFieldChange("groupId", value)}
              onTest={handleTest}
              onSave={handleSave}
              onConnect={() => handleConnect()}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};