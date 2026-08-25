import  { useEffect, useState } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import {  ProjectConnectionComponentConnectionField, ProjectConnectionComponentMainDiv } from "../../../styles/sidebarcomponentsstyles/projectconnetionscomponentsstyles/projectconnectioncomponentsstyles";
import { VsButton } from "../../../styles/reusablecomponentsstyles/button-component-styles";
import ConnectionComponent from "../connectionscomponents/connectioncomponent";

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

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_GROUPS });
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    // Startup-race guard: if the initial request lands before the host has
    // finished resolving the webview view, the reply is silently lost. Ask
    // again shortly after mount so the list always populates.
    const retry = setTimeout(() => {
      vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
    }, 500);

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_GROUPS_LISTED:
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
        case ExtensionMessageType.DB_GROUP_CREATED:
          setProjects((prev) => [...prev, message.payload.group]);
          setCreating(false);
          setNewName("");
          break;
        case ExtensionMessageType.DB_GROUP_UPDATED:
          setProjects((prev) =>
            prev.map((p) => (p.id === message.payload.group.id ? message.payload.group : p))
          );
          setEditingId(null);
          break;
        case ExtensionMessageType.DB_GROUP_DELETED:
          setProjects((prev) => prev.filter((p) => p.id !== message.payload.groupId));
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
        case ExtensionMessageType.DB_GROUP_ASSIGNED:
        case ExtensionMessageType.DB_CONNECTION_SAVED:
        case ExtensionMessageType.DB_CONNECTION_DELETED:
          vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      clearTimeout(retry);
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  
  const openCreateConnection = () =>
    vscode._postMessage({ messageType: WebviewMessageType.OPEN_CREATE_CONNECTION });

  const startCreate = () => {
    setCreating(true);
    setNewName("");
  };


  useEffect(() => {
    const handleSidebarAction = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === "new-connection") {
        openCreateConnection();
      } else if (action === "new-group") {
        startCreate();
      }
    };
    window.addEventListener("dbchart:sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("dbchart:sidebar-action", handleSidebarAction);
  }, []);

  const connectionsFor = (groupId: string) =>
    connections.filter((c) => c.groupId === groupId);

  // NOTE: some database forms reuse the connection `groupId` field as their
  // cloud *Project ID* (e.g. Firebase), so a saved connection can carry a
  // non-UUID groupId that belongs to no UI group. Only treat a groupId that
  // actually matches an existing group as "assigned" — everything else is
  // ungrouped and must still appear in the list.
  const groupIdSet = new Set(groups.map((g) => g.id));
  const unassignedConnections = connections.filter(
    (c) => !c.groupId || !groupIdSet.has(c.groupId)
  );

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CREATE_GROUP,
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
      messageType: WebviewMessageType.DB_UPDATE_GROUP,
      payload: { id: editingId, name },
    });
  };

  const deleteGroup = (id: string) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_DELETE_GROUP,
      payload: { groupId: id },
    });
  };

  const assignConnection = (groupId: string, connectionId: string) => {
    if (!connectionId) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_ASSIGN_CONNECTION_TO_GROUP,
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

  

  /** Open a nested database: connect first when needed, then show the DB explorer. */
  const openSubDatabase = (conn: SavedConnection) => {
    const needsConnect = conn.id !== activeConnectionId;
    if (needsConnect) {
      connect(conn);
    }
    // Give a cold connection a moment to establish before opening the
    // explorer, which immediately requests its tree.
    setTimeout(
      () => vscode._postMessage({ messageType: WebviewMessageType.DB_OPEN_DB_VIEW }),
      needsConnect ? 1500 : 0
    );
  };

  const renderConnectionRow = (c: SavedConnection) => {
    const isActive = c.id === activeConnectionId;
    return (
      <ConnectionComponent isActive={isActive} onConnect={connect} connection={c} onDisConnect={disconnect}  onCopyConnection={copyConnection} onDeleteConnection={deleteConnection} onOpenSubDatabase={openSubDatabase} />
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
                          <VsButton className="header-button" title="Delete" onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}>
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
                  <VsButton onClick={openCreateConnection}>
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

    </ProjectConnectionComponentMainDiv>
  );
};

export default ProjectsComponent;
