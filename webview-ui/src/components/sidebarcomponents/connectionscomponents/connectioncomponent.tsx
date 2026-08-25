import { useState, type ReactNode } from "react";
import { ToastProvider } from "../../../contexts/toastcontext/toast-context-provider";
import { VsButton } from "../../../styles/reusablecomponentsstyles/button-component-styles";
import {

  ConnectionComponentHeaderDiv,
  ConnectionComponentMainDiv,
  ConnectionComponentSubSectionDiv,
} from "../../../styles/sidebarcomponentsstyles/connectioncomponentstyles/connectioncomponentstyle";
import DbIcon from "../../dbconnectioncomponents/db-icon";
import ConnectionTableComponent from "./connectiontablecomponent";

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

interface connectionProp {
  onConnect: (connection: SavedConnection) => void,
  onCopyConnection: (connection: SavedConnection) => void,
  onDeleteConnection: (connection: SavedConnection) => void,
  /** Kept for compatibility; sub-databases now expand inline instead. */
  onOpenSubDatabase?: (connection: SavedConnection) => void,
  onDisConnect: () => void,
  connection: SavedConnection,
  isActive: boolean,

}
interface SubDatabaseDropdownProps {
    label: string;
    children: (setLoading: (loading: boolean) => void) => ReactNode;
}

/**
 * Collapsible sub-database row. The tables body only mounts while expanded,
 * so expanding always triggers a fresh load, and re-expanding refreshes.
 */
const SubDatabaseDropdown = ({ label, children }: SubDatabaseDropdownProps) => {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    // Spin the INSTANT the row is opened — the freshly-mounted tables body
    // keeps it spinning until its data arrives (or an error shows). Collapse
    // always clears it so a mid-load collapse can never freeze the spinner.
    const toggle = () => {
        const next = !expanded;
        setExpanded(next);
        setLoading(next);
    };

    return (
        <div className="sub-database-dropdown">
            <div className="flex sub-header" onClick={toggle}>
                <div>
                    <i className="codicon codicon-database" />
                </div>
                <div>
                    <span>{label}</span>
                    <span className="database-field-info"> tables </span>
                </div>
                <div className="sub-toggle">
                    <i
                        className={
                            loading
                                ? "codicon codicon-loading codicon-spin"
                                : `codicon codicon-chevron-${expanded ? "down" : "right"}`
                        }
                    />
                </div>
            </div>
            {expanded && (
                <div className="sub-body">{children(setLoading)}</div>
            )}
        </div>
    );
};

const ConnectionComponent = ({ onConnect, connection, onDisConnect, isActive, onCopyConnection, onDeleteConnection }: connectionProp) => {

  return (
    <ConnectionComponentMainDiv>
      <div>
        <ConnectionComponentHeaderDiv $connected={isActive}>
          <div>
            <div className="flex  left-item">
              <div className="flex">
                <DbIcon databaseId={connection.databaseId} size={16} />
              </div>
              <div>
                <span className="connection-name">
                  {connection.name}
                  <span className="connection-type">
                    {connection.databaseId}
                  </span>
                </span>

              </div>
            </div>
            <div className="flex ">

              <div className="flex flex-items">

                {isActive ? (
                  <div className="connection-button">
                    <VsButton className=" header-button" title="Disconnect" onClick={() => onDisConnect()}>
                      <i className="codicon codicon-debug-disconnect" />
                    </VsButton>
                  </div>

                ) : (
                  <div className="connection-button">
                    <VsButton className=" header-button" title="Connect" onClick={() => onConnect(connection)}>
                      <i className="codicon codicon-plug" />
                    </VsButton>
                  </div>

                )}
                <div className="connection-button">
                  <VsButton className=" header-button" title="Copy connection" onClick={() => onCopyConnection(connection)}>
                    <i className="codicon codicon-copy" />
                  </VsButton>

                </div>
                <div className="connection-button">
                  <VsButton className=" header-button" title="Delete connection" onClick={() => onDeleteConnection(connection)}>
                    <i className="codicon codicon-trash" />
                  </VsButton>

                </div>
              </div>
              <div className="flex flex-items">
                <div className="connected-icon" />


              </div>




            </div>

          </div>

        </ConnectionComponentHeaderDiv>


        {(CONNECTION_SUB_DATABASES[connection.databaseId] ?? []).length > 0 && (
          <ToastProvider>
          <ConnectionComponentSubSectionDiv className="sub-databases">
            {(CONNECTION_SUB_DATABASES[connection.databaseId] ?? []).map((sub) => (
              <SubDatabaseDropdown key={sub.id} label={sub.label}>
                
                {(setLoading) => (
                  <ConnectionTableComponent
                    sectionId={sub.id === "realtime-database" ? "rtdb" : sub.id}
                    active={isActive}
                    onLoadingChange={setLoading}
                  />
                )}
              </SubDatabaseDropdown>
            ))}
          </ConnectionComponentSubSectionDiv>
          </ToastProvider>
        )}



      </div>
    </ConnectionComponentMainDiv>
  );
};


/**
 * Databases that live inside a single connection and are rendered as child
 * rows beneath it in the connections list.
 */

export default ConnectionComponent;
const CONNECTION_SUB_DATABASES: Record<string, { id: string; label: string; }[]> = {
  firebase: [
    { id: "firestore", label: "Cloud Firestore", },
    { id: "realtime-database", label: "Realtime Database" },
  ],
};