import { useEffect, useState, useCallback } from "react";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";

interface TreeItem { id: string; name: string; kind: string; meta?: string; }
interface TreeSection { id: string; label: string; icon: string; kind: string; items: TreeItem[]; }
interface UserPath { id: string; connectionId: string; path: string; label: string; createdAt: number; }

const ICONS: Record<string, string> = { collection: "database", table: "table", path: "zap", view: "eye", analytics: "graph-line" };

/** Renders the active connection tree + user-pinned paths. */
export const DatabaseTreeComponent = () => {
  const [sections, setSections] = useState<TreeSection[]>([]);
  const [userPaths, setUserPaths] = useState<UserPath[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingPath, setAddingPath] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_TREE });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_USER_PATHS });
  }, []);

  useEffect(() => {
    refresh();
    const handle = (event: MessageEvent) => {
      const m: ExtensionMessage = event.data;
      switch (m.type) {
        case ExtensionMessageType.DB_TREE: setSections(m.payload.sections); break;
        case ExtensionMessageType.DB_USER_PATHS_LISTED: setUserPaths(m.payload.paths); break;
        case ExtensionMessageType.DB_USER_PATH_ADDED: setUserPaths((p) => [...p, m.payload.path]); break;
        case ExtensionMessageType.DB_USER_PATH_REMOVED: setUserPaths((p) => p.filter((x) => x.id !== m.payload.id)); break;
        case ExtensionMessageType.DB_CONNECTED: refresh(); break;
        case ExtensionMessageType.DB_ERROR: setError(m.payload.error); break;
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [refresh]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const openItem = (item: TreeItem, sectionKind: string) => {
    setError(null);
    if (sectionKind === "analytics" || item.kind === "analytics" || item.kind === "view") {
      vscode._postMessage({ messageType: WebviewMessageType.DB_OPEN_ANALYTICS_VIEW, payload: { viewId: item.id } });
    } else {
      vscode._postMessage({ messageType: WebviewMessageType.DB_LOAD_ENTITY, payload: { entity: item.id, scope: item.kind } });
    }
  };

  const submit = () => {
    const p = newPath.trim();
    if (p) { vscode._postMessage({ messageType: WebviewMessageType.DB_ADD_USER_PATH, payload: { path: p } }); setNewPath(""); }
    setAddingPath(false);
  };

  const row = (icon: string, text: string, onClick: () => void, extra?: React.ReactNode, style?: React.CSSProperties) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 4px", borderRadius: 3, cursor: "pointer", ...style }}>
      <i className={`codicon codicon-${icon}`} style={{ fontSize: 12 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
      {extra}
    </div>
  );

  return (
    <div style={{ padding: "4px 8px", fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <span style={{ flex: 1, fontWeight: 600, color: "var(--vscode-descriptionForeground)" }}>Database Tree</span>
        <button title="Refresh" onClick={refresh} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--vscode-button-background)" }}>
          <i className="codicon codicon-refresh" />
        </button>
      </div>

      {error && <div style={{ padding: "6px 8px", color: "var(--vscode-errorForeground)", fontSize: 11, marginBottom: 6, background: "var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.1))" }}>{error}</div>}

      {sections.map((s) => (
        <div key={s.id} style={{ marginBottom: 4 }}>
          {row(expanded[s.id] ? "chevron-down" : "chevron-right", s.label, () => toggle(s.id), <span style={{ opacity: 0.5, fontSize: 11 }}>{s.items.length}</span>, { userSelect: "none" })}
          {expanded[s.id] && (
            <div style={{ marginLeft: 18, borderLeft: "1px solid var(--vscode-panel-border)", paddingLeft: 6 }}>
              {s.items.length === 0 && <div style={{ padding: "3px 4px", opacity: 0.5, fontStyle: "italic" }}>No items</div>}
              {s.items.map((i) => (
                <div key={i.id} title={i.meta} onClick={(e) => { e.stopPropagation(); openItem(i, s.kind); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 4px", borderRadius: 3, cursor: "pointer" }}>
                  <i className={`codicon codicon-${ICONS[i.kind] ?? "file"}`} style={{ fontSize: 12 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 8, borderTop: "1px solid var(--vscode-panel-border)", paddingTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={{ flex: 1, fontWeight: 600, color: "var(--vscode-descriptionForeground)" }}>Pinned Paths</span>
          <button title="Add path" onClick={() => setAddingPath(!addingPath)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--vscode-button-background)" }}>
            <i className="codicon codicon-add" />
          </button>
        </div>
        {addingPath && (
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <input autoFocus value={newPath} onChange={(e) => setNewPath(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setAddingPath(false); }} placeholder="/users/2026" style={{ flex: 1, background: "var(--vscode-input-background)", color: "var(--vscode-input-foreground)", border: "1px solid var(--vscode-input-border)", borderRadius: 3, padding: "3px 6px", fontSize: 11 }} />
            <button onClick={submit} style={{ border: "none", background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)", borderRadius: 3, cursor: "pointer", padding: "0 6px" }}><i className="codicon codicon-check" /></button>
          </div>
        )}
        {userPaths.length === 0 && !addingPath && <div style={{ padding: "3px 4px", opacity: 0.5, fontStyle: "italic" }}>No pinned paths yet</div>}
        {userPaths.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 4px", borderRadius: 3 }}>
            <i className="codicon codicon-link" style={{ fontSize: 12 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={() => openItem({ id: p.path, name: p.label, kind: "path" }, "path")} title={p.path}>{p.label}</span>
            <button title="Unpin" onClick={() => vscode._postMessage({ messageType: WebviewMessageType.DB_REMOVE_USER_PATH, payload: { id: p.id } })} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--vscode-errorForeground)", padding: 0 }}><i className="codicon codicon-trash" style={{ fontSize: 12 }} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};