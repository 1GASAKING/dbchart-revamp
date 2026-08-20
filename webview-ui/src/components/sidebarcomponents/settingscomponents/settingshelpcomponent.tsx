import type React from "react";

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: "8px", padding: "4px 2px" } as React.CSSProperties,
  section: { display: "flex", flexDirection: "column", gap: "4px" } as React.CSSProperties,
  heading: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--vscode-descriptionForeground)" } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
    padding: "5px 6px",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    padding: 0,
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px solid transparent",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px solid var(--vscode-panel-border)",
    borderRadius: "4px",
    fontSize: "11px",
  } as React.CSSProperties,
  text: { fontSize: "11px", color: "var(--vscode-descriptionForeground)", lineHeight: "1.4" } as React.CSSProperties,
};

const SettingsHelpComponent = () => {
  const openExternal = (url: string) => {
    // Webviews can't open external URLs directly; this is a safe placeholder.
    // In the VS Code webview sandbox this would post a message to the host.
    void url;
  };

  return (
    <div style={S.wrap}>
      <div style={S.section}>
        <div style={S.heading}>Shortcuts</div>
        <div style={S.row}>
          <span>New connection</span>
          <code style={{ ...S.text, fontFamily: "var(--vscode-editor-font-family)" }}>New Connection dialog</code>
        </div>
        <div style={S.row}>
          <span>Run query</span>
          <code style={{ ...S.text, fontFamily: "var(--vscode-editor-font-family)" }}>Query editor</code>
        </div>
        <div style={S.row}>
          <span>Import schema</span>
          <code style={{ ...S.text, fontFamily: "var(--vscode-editor-font-family)" }}>Editor → Import</code>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.heading}>Preferences</div>
        <div style={S.row}>
          <span>Auto-connect on project open</span>
          <i className="codicon codicon-toggle-off" style={{ cursor: "pointer", fontSize: "16px" }} />
        </div>
        <div style={S.row}>
          <span>Show connection status</span>
          <i className="codicon codicon-toggle-on" style={{ cursor: "pointer", fontSize: "16px" }} />
        </div>
      </div>

      <div style={S.section}>
        <div style={S.heading}>Help</div>
        <div style={S.row}>
          <span>Getting started</span>
          <i className="codicon codicon-info" style={{ color: "var(--vscode-descriptionForeground)" }} />
        </div>
        <div style={S.row}>
          <span>Documentation</span>
          <i className="codicon codicon-link-external" style={{ color: "var(--vscode-descriptionForeground)" }} />
        </div>
        <div style={S.row}>
          <span>Report an issue</span>
          <i className="codicon codicon-bug" style={{ color: "var(--vscode-descriptionForeground)" }} />
        </div>
      </div>

      <div style={S.section}>
        <div style={S.text}>
          DBChat v0.0.1 — a database client and schema visualization extension for VS Code.
        </div>
        <button style={S.btn} onClick={() => openExternal("https://github.com/1GASAKING/dbchart-revamp")}>
          <i className="codicon codicon-github" /> GitHub
        </button>
      </div>
    </div>
  );
};

export default SettingsHelpComponent;