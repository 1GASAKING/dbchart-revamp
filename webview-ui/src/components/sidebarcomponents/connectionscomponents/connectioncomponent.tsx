import { VsButton } from "../../../styles/reusablecomponentsstyles/button-component-styles";
import {

  ConnectionComponentHeaderDiv,
  ConnectionComponentMainDiv,
  ConnectionComponentSubSectionDiv,
} from "../../../styles/sidebarcomponentsstyles/connectioncomponentstyles/connectioncomponentstyle";
import DbIcon from "../../dbconnectioncomponents/db-icon";


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
  onOpenSubDatabase: (connection: SavedConnection) => void,
  onDisConnect: () => void,
  connection: SavedConnection,
  isActive: boolean,

}
const ConnectionComponent = ({ onConnect, connection, onDisConnect, isActive, onCopyConnection, onDeleteConnection, onOpenSubDatabase }: connectionProp) => {

  return (
    <ConnectionComponentMainDiv>
      <div>
        <ConnectionComponentHeaderDiv $connected={isActive}>
          <div>
            <div>
              <div>
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

              <div>

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
          <ConnectionComponentSubSectionDiv className="sub-databases">
            {(CONNECTION_SUB_DATABASES[connection.databaseId] ?? []).map((sub) => (
              <div
                key={sub.id}
                className="sub-database-row"
                title={`Open ${sub.label}`}
                onClick={() => onOpenSubDatabase(connection)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 0 3px 18px",
                  fontSize: 12,
                  opacity: 0.85,
                  cursor: "pointer",
                }}
              >
                <i className={`codicon codicon-database`} style={{ fontSize: 12 }} />
                <span>{sub.label}</span>
              </div>
            ))}
          </ConnectionComponentSubSectionDiv>
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