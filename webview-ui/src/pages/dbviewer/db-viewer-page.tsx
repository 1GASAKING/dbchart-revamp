import { useEffect, useState } from "react";
import DBViewerComponent from "../../components/dbviewercomponents/db-viewer-component";
import { DBQueryEditor } from "../../components/dbquerycomponents/db-query-editor";
import { DBConnectionDialog } from "../../components/dbconnectioncomponents/db-connection-dialog";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";

const DbViewerPage = () => {
  const [connected, setConnected] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_CONNECTED:
          setConnected(message.payload.connected);
          break;
        case ExtensionMessageType.DB_DISCONNECTED:
          setConnected(false);
          break;
        case ExtensionMessageType.DB_ERROR:
          // Connection errors are surfaced via the dialog
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "8px", padding: "8px", borderBottom: "1px solid var(--vscode-panel-border)" }}>
        <button
          onClick={() => setShowViewer(true)}
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            background: showViewer ? "var(--vscode-button-background)" : "transparent",
            color: showViewer ? "var(--vscode-button-foreground)" : "var(--vscode-foreground)",
            border: "1px solid var(--vscode-panel-border)",
            borderRadius: "4px",
          }}
        >
          <i className="codicon codicon-table" /> Table Viewer
        </button>
        <button
          onClick={() => setShowViewer(false)}
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            background: !showViewer ? "var(--vscode-button-background)" : "transparent",
            color: !showViewer ? "var(--vscode-button-foreground)" : "var(--vscode-foreground)",
            border: "1px solid var(--vscode-panel-border)",
            borderRadius: "4px",
          }}
        >
          <i className="codicon codicon-code" /> SQL Query
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "12px", color: connected ? "var(--vscode-testing-iconPassed)" : "var(--vscode-descriptionForeground)", alignSelf: "center" }}>
          <i className={`codicon codicon-${connected ? "circle-filled" : "circle-outline"}`} />{" "}
          {connected ? "Connected" : "Disconnected"}
        </span>
        <button
          onClick={() => setShowConnectionDialog(true)}
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: "4px",
          }}
        >
          <i className="codicon codicon-plug" /> {connected ? "New Connection" : "Connect"}
        </button>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {showViewer ? (
          <DBViewerComponent />
        ) : (
          <DBQueryEditor connected={connected} onConnect={() => setShowConnectionDialog(true)} />
        )}
      </div>

      {showConnectionDialog && (
        <DBConnectionDialog
          onClose={() => setShowConnectionDialog(false)}
          onConnected={() => setConnected(true)}
        />
      )}
    </div>
  );
};

export default DbViewerPage;