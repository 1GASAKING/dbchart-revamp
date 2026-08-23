import React, { useEffect, useState } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import { ProjectConnectionComponentConnection, ProjectConnectionComponentConnectionField, ProjectConnectionComponentMainDiv } from "../../../styles/sidebarcomponentsstyles/projectconnetionscomponentsstyles/projectconnectioncomponentsstyles";
import { VsButton } from "../../../styles/reusablecomponentsstyles/button-component-styles";
import { DBConnectionDialog } from "../../dbconnectioncomponents/db-connection-dialog";

interface Group {
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
  groupId?: string;
  host?: string;
  database?: string;
  username?: string;
  createdAt: number;
}



const ProjectsComponent = () => {
  const [groups, setProjects] = useState<Group[]>([]);
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_PROJECTS });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_PROJECTS_LISTED:
          setProjects(message.payload.groups);
          break;
        case ExtensionMessageType.DB_CONNECTIONS_LISTED:
          setConnections(message.payload.connections);
          break;
        case ExtensionMessageType.DB_CONNECTED:
          setActiveConnectionId(message.payload.connectionId ?? null);
          break;
        case ExtensionMessageType.DB_DISCONNECTED:
          setActiveConnectionId(null);
          break;
        case ExtensionMessageType.DB_PROJECT_CREATED:
          setProjects((prev) => [...prev, message.payload.group]);
          setCreating(false);
          setNewName("");
          break;
        case ExtensionMessageType.DB_PROJECT_UPDATED:
          setProjects((prev) =>
            prev.map((p) => (p.id === message.payload.group.id ? message.payload.group : p))
          );
          setEditingId(null);
          break;
        case ExtensionMessageType.DB_PROJECT_DELETED:
          setProjects((prev) => prev.filter((p) => p.id !== message.payload.groupId));
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_PROJECT_ASSIGNED:
        case ExtensionMessageType.DB_CONNECTION_SAVED:
        case ExtensionMessageType.DB_CONNECTION_DELETED:
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  
  const startCreate = () => {
    setCreating(true);
    setNewName("");
  };


  useEffect(() => {
    const handleSidebarAction = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === "new-connection") {
        setShowConnectionDialog(true);
      } else if (action === "new-group") {
        startCreate();
      }
    };
    window.addEventListener("dbchart:sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("dbchart:sidebar-action", handleSidebarAction);
  }, []);

  const connectionsFor = (groupId: string) =>
    connections.filter((c) => c.groupId === groupId);

  const unassignedConnections = connections.filter((c) => !c.groupId);

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CREATE_PROJECT,
      payload: { name },
    });
  };

  const startEdit = (p: Group) => {
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
      payload: { groupId: id },
    });
  };

  const assignConnection = (groupId: string, connectionId: string) => {
    if (!connectionId) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_ASSIGN_CONNECTION_TO_PROJECT,
      payload: { connectionId, groupId },
    });
    setAssigningId(null);
  };

  const connect = (conn: SavedConnection) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CONNECT,
      payload: { connectionId: conn.id },
    });
  };

  const disconnect = () => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_DISCONNECT });
  };

  const copyConnection = (conn: SavedConnection) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_COPY_CONNECTION,
      payload: { connectionId: conn.id },
    });
  };

  const deleteConnection = (conn: SavedConnection) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_DELETE_CONNECTION,
      payload: { connectionId: conn.id },
    });
  };

  const renderConnectionRow = (c: SavedConnection) => {
    const isActive = c.id === activeConnectionId;
    return (
      <ProjectConnectionComponentConnection key={c.id} className="connections-header" $connected={isActive}>
        <div>

          <div>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name} <span style={{ opacity: 0.6 }}>({c.databaseId})</span>
            </span>


          </div>
          <div className="flex flex-items">
            {isActive ? (
              <div className="connection-button">
                <VsButton className=" header-button" title="Disconnect" onClick={() => disconnect()}>
                  <i className="codicon codicon-debug-disconnect" />
                </VsButton>
              </div>

            ) : (
              <div className="connection-button">
                <VsButton className=" header-button" title="Connect" onClick={() => connect(c)}>
                  <i className="codicon codicon-plug" />
                </VsButton>
              </div>

            )}
            <div className="connection-button">
              <VsButton className=" header-button" title="Copy connection" onClick={() => copyConnection(c)}>
                <i className="codicon codicon-copy" />
              </VsButton>

            </div>
            <div className="connection-button">
              <VsButton className=" header-button" title="Delete connection" onClick={() => deleteConnection(c)}>
                <i className="codicon codicon-trash" />
              </VsButton>

            </div>
            <div
              className="connected-icon"
              title={isActive ? "Connected" : "Disconnected"}


            />




          </div>


        </div>

      </ProjectConnectionComponentConnection>
    );
  };

  return (
    <ProjectConnectionComponentMainDiv>
      <div>
        <div className="connection-fields-container">
          {unassignedConnections.map(renderConnectionRow)}

          {groups.map((group) => {
            const members = connectionsFor(group.id);
            const isExpanded = expandedId === group.id;
            return (
              <ProjectConnectionComponentConnectionField key={group.id}>

                <div
                  className="connection-field-row "
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                >
                  <i
                    className={`codicon codicon-${isExpanded ? "chevron-down" : "chevron-right"}`}
                    style={{ fontSize: "12px" }}
                  />
                  {editingId === group.id ? (
                    <div className="flex flex-center input-container">
                      <div  className="input-container">
                        <input
                        className="connection-edit-input"
                          value={editName}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />

                      </div>
                      <div className="connection-button">
                        <VsButton title="Save" onClick={(e) => { e.stopPropagation(); submitEdit(); }}>
                          <i className="codicon codicon-check" />
                        </VsButton>
                      </div>
                       <div className="connection-button">
                        <VsButton title="cancel" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                          <i className="codicon codicon-close" />
                        </VsButton>
                      </div>

                    </ div>
                  ) : (
                    < div className="connections-header">
                      <span >
                        <i className="codicon codicon-folder" style={{ marginRight: "4px" }} />
                        {group.name}
                      </span>
                      <div className="flex flex-center">
                        <span className=" count-text">{members.length}</span>
                        <div className="connection-button">
                          <VsButton className="header-button" title="Add connection" onClick={(e) => { e.stopPropagation(); setAssigningId(assigningId === group.id ? null : group.id); setExpandedId(group.id); }}>
                            <i className="codicon codicon-add" />
                          </VsButton>
                        </div>


                        <div>
                          <VsButton className="header-button" title="Edit" onClick={(e) => { e.stopPropagation(); startEdit(group); }}>
                            <i className="codicon codicon-edit" />
                          </VsButton>
                        </div>
                        <div className="connection-button">
                          <VsButton className="header-button" title="Delete" onClick={(e) => { e.stopPropagation(); deleteProject(group.id); }}>
                            <i className="codicon codicon-trash" />
                          </VsButton>
                        </div>
                      </div>


                    </div>
                  )}
                </div>

                {(isExpanded || assigningId === group.id) && (
                  <div className="connection-lists">
                    {members.map(renderConnectionRow)}
                    {members.length === 0 && (
                      <div >No clients yet</div>
                    )}

                    {assigningId === group.id && (
                      <div className="connections-dropdown" >
                        <select
                          className="connection-edit-input" defaultValue=""
                          onChange={(e) => assignConnection(group.id, e.target.value)}
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
              </ProjectConnectionComponentConnectionField>
            );
          })}


        </div>

        <div className="connection-prompt-holder">
          {groups.length === 0 && <div className="connection-prompt-text"> <h4>No groups yet </h4></div>}
          {creating
            ? (
              <div className="connection-group-dialog-name-container">
                <div className="connection-group-input-name-container" >
                  <input
                    className="connection-edit-input"
                    value={newName}
                    autoFocus
                    placeholder="Group  name"
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitCreate();
                      if (e.key === "Escape") setCreating(false);
                    }}
                  />
                </div>
                <div>
                  <VsButton title="Create" onClick={submitCreate}>
                    <i className="codicon codicon-check" />
                  </VsButton>
                </div>
                <div>
                  <VsButton title="cancel" onClick={() => setCreating(false)}>
                    <i className="codicon codicon-close" />
                  </VsButton>
                </div>


              </div>
            ) : (
              <div className="connection-propmt-action-button-container">
                <div className="connection-propmt-action-button">
                  <VsButton onClick={() => setShowConnectionDialog(true)}>
                    <i className="codicon codicon-plug" /> New connection
                  </VsButton>
                </div>
                <div className="connection-propmt-action-button">
                  <VsButton onClick={startCreate}>
                    <i className="codicon codicon-folder" /> New group
                  </VsButton>
                </div>
              </div>


            )}


        </div>
        



      </div>

      {showConnectionDialog && (
        <DBConnectionDialog
          onClose={() => setShowConnectionDialog(false)}
          onConnected={() => setShowConnectionDialog(false)}
        />
      )}
    </ProjectConnectionComponentMainDiv>
  );
};

export default ProjectsComponent;
