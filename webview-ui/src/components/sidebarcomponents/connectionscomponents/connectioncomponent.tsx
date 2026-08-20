import { useEffect, useState } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";
import {
  ConnectionComponentDropDown,
  ConnectionComponentDropDownField,
  ConnectionComponentField,
  ConnectionComponentMainDiv,
  ConnectionComponentSectionDiv,
  ConnectionComponentToggle,
} from "../../../styles/sidebarcomponentsstyles/connectioncomponentstyles/connectioncomponentstyle";

interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
  host?: string;
  database?: string;
  username?: string;
  ssl?: boolean;
  createdAt: number;
  lastUsed?: number;
}

const ConnectionComponent = () => {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_GET_CONNECTIONS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      if (message.type === ExtensionMessageType.DB_CONNECTIONS_LISTED) {
        setConnections(message.payload.connections);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connect = (conn: SavedConnection) => {
    setSelectedId(conn.id);
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CONNECT,
      payload: { connectionId: conn.id },
    });
  };

  const selected =
    connections.find((c) => c.id === selectedId) ?? connections[0];

  return (
    <ConnectionComponentMainDiv>
      <ConnectionComponentSectionDiv>
        <div>
          <ConnectionComponentToggle id="change-project-toggle" defaultChecked />
          <ConnectionComponentField>
            <div>
              <div className="connection-name">
                <div>
                  <h4>{selected ? selected.name : "No connections yet"}</h4>
                </div>
              </div>
              <label htmlFor="change-project-toggle">
                <div className="flex">
                  <div className="chevron-container">
                    <i className="codicon codicon-chevron-up"></i>
                  </div>
                </div>
              </label>
            </div>
            <ConnectionComponentDropDown>
              <div>
                {connections.length === 0 && (
                  <ConnectionComponentDropDownField>
                    <div>
                      <div className="connection-name">
                        <div>
                          <h4>No saved connections</h4>
                        </div>
                      </div>
                    </div>
                  </ConnectionComponentDropDownField>
                )}

                {connections.map((item, index) => (
                  <ConnectionComponentDropDownField
                    key={item.id + "-" + index}
                    isSelcted={item.id === selectedId}
                    onClick={() => connect(item)}
                  >
                    <div>
                      <div className="connection-name">
                        <div>
                          <h4>{item.name}</h4>
                        </div>
                      </div>
                      <div className="flex">
                        <div className="apps-icon">
                          <div>{item.databaseId.slice(0, 1).toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  </ConnectionComponentDropDownField>
                ))}
              </div>
            </ConnectionComponentDropDown>
          </ConnectionComponentField>
        </div>
      </ConnectionComponentSectionDiv>
    </ConnectionComponentMainDiv>
  );
};

export default ConnectionComponent;