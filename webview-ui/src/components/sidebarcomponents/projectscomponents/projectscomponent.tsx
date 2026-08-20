import { useEffect, useState } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
  projectId?: string;
  host?: string;
  database?: string;
  username?: string;
  createdAt: number;
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: "6px" } as React.CSSProperties,
  list: { display: "flex", flexDirection: "column", gap: "4px" } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  } as React.CSSProperties,
  rowHover: {
    background: "var(--vscode-list-hoverBackground)",
  } as React.CSSProperties,
  name: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as React.CSSProperties,
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
  input: {
    width: "100%",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid var(--vscode-input-border)",
    background: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    fontSize: "12px",
  } as React.CSSProperties,
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px dashed var(--vscode-panel-border)",
    borderRadius: "4px",
    fontSize: "11px",
  } as React.CSSProperties,
  empty: { fontSize: "11px", color: "var(--vscode-descriptionForeground)", padding: "4px 2px" } as React.CSSProperties,
  connRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 8px 3px 18px",
    fontSize: "11px",
    color: "var(--vscode-descriptionForeground)",
  } as React.CSSProperties,
  count: { fontSize: "10px", color: "var(--vscode-descriptionForeground)" } as React.CSSProperties,
};

const ProjectsComponent = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_PROJECTS });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_PROJECTS_LISTED:
          setProjects(message.payload.projects);
          break;
        case ExtensionMessageType.DB_CONNECTIONS_LISTED:
          setConnections(message.payload.connections);
          break;
        case ExtensionMessageType.DB_PROJECT_CREATED:
          setProjects((prev) => [...prev, message.payload.project]);
          setCreating(false);
          setNewName("");
          break;
        case ExtensionMessageType.DB_PROJECT_UPDATED:
          setProjects((prev) =>
            prev.map((p) => (p.id === message.payload.project.id ? message.payload.project : p))
          );
          setEditingId(null);
          break;
        case ExtensionMessageType.DB_PROJECT_DELETED:
          setProjects((prev) => prev.filter((p) => p.id !== message.payload.projectId));
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_PROJECT_ASSIGNED:
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connectionsFor = (projectId: string) =>
    connections.filter((c) => c.projectId === projectId);

  const unassignedConnections = connections.filter((c) => !c.projectId);

  const startCreate = () => {
    setCreating(true);
    setNewName("");
  };

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CREATE_PROJECT,
      payload: { name },
    });
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const submitEdit = () => {
    const name = editName.trim();
    if (!name || !editingId) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_UPDATE_PROJECT,
      payload: { id: editingId, name },
    });
  };

  const deleteProject = (id: string) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_DELETE_PROJECT,
      payload: { projectId: id },
    });
  };

  const assignConnection = (projectId: string, connectionId: string) => {
    if (!connectionId) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_ASSIGN_CONNECTION_TO_PROJECT,
      payload: { connectionId, projectId },
    });
    setAssigningId(null);
  };

  return (
    <div style={S.wrap}>
      <div style={S.list}>
        {projects.map((project) => {
          const members = connectionsFor(project.id);
          const isExpanded = expandedId === project.id;
          return (
            <div key={project.id} style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={S.row}
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                <i
                  className={`codicon codicon-${isExpanded ? "chevron-down" : "chevron-right"}`}
                  style={{ fontSize: "12px" }}
                />
                {editingId === project.id ? (
                  <>
                    <input
                      style={S.input}
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button style={S.iconBtn} title="Save" onClick={(e) => { e.stopPropagation(); submitEdit(); }}>
                      <i className="codicon codicon-check" />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={S.name}>
                      <i className="codicon codicon-folder" style={{ marginRight: "4px" }} />
                      {project.name}
                    </span>
                    <span style={S.count}>{members.length}</span>
                    <button style={S.iconBtn} title="Add connection" onClick={(e) => { e.stopPropagation(); setAssigningId(assigningId === project.id ? null : project.id); setExpandedId(project.id); }}>
                      <i className="codicon codicon-add" />
                    </button>
                    <button style={S.iconBtn} title="Edit" onClick={(e) => { e.stopPropagation(); startEdit(project); }}>
                      <i className="codicon codicon-edit" />
                    </button>
                    <button style={S.iconBtn} title="Delete" onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}>
                      <i className="codicon codicon-trash" />
                    </button>
                  </>
                )}
              </div>

              {(isExpanded || assigningId === project.id) && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {members.map((c) => (
                    <div key={c.id} style={S.connRow}>
                      <i className="codicon codicon-database" style={{ fontSize: "11px" }} />
                      {c.name} <span style={{ opacity: 0.6 }}>({c.databaseId})</span>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div style={{ ...S.connRow, opacity: 0.7 }}>No clients yet</div>
                  )}

                  {assigningId === project.id && (
                    <div style={{ ...S.connRow, gap: "4px" }}>
                      <select
                        style={S.input}
                        defaultValue=""
                        onChange={(e) => assignConnection(project.id, e.target.value)}
                      >
                        <option value="" disabled>Add existing client…</option>
                        {unassignedConnections.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && <div style={S.empty}>No projects yet</div>}
      </div>

      {creating ? (
        <div style={{ display: "flex", gap: "4px" }}>
          <input
            style={S.input}
            value={newName}
            autoFocus
            placeholder="Project name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCreate();
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <button style={S.iconBtn} title="Create" onClick={submitCreate}>
            <i className="codicon codicon-check" />
          </button>
        </div>
      ) : (
        <button style={S.addBtn} onClick={startCreate}>
          <i className="codicon codicon-folder-opened" /> New project
        </button>
      )}
    </div>
  );
};

export default ProjectsComponent;