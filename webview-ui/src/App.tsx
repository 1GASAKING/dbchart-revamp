import { useCallback, useEffect, useState } from 'react'
import SideBarPage from './pages/sidebarpages';
import { type ExtensionMessage } from "@shared/extensionmessage/types";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from '@shared/extensionmessage/extensionmessage';
import type { WebviewMessage } from "@shared/webview/type";
import { vscode } from './utils/vscode';
import { resolveFileOpened, resolveFileSaved } from './utils/file-operations';
import EditorPage from './pages/editor/editor-page';
import type { DatabaseSchema } from "@dbchart/schema";
import '@xyflow/react/dist/style.css'
import DbViewerPage from './pages/dbviewer/db-viewer-page';
import { AnalyticsPage } from './pages/analytics/analytics-page';
import CreateConnectionPage from './pages/createconnection/create-connection-page';
import type { ArrangedDesign } from '@lib/utils/design-arrangement';



function App() {

  const [appMode, setAppMode] = useState<"sidebar" | "editor" | "canvas" | "analytics" | "createConnection" | "">("");
  const [canvasSchema, setCanvasSchema] = useState<DatabaseSchema | null>(null);
  const [canvasDesign, setCanvasDesign] = useState<ArrangedDesign | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message: ExtensionMessage = event.data
    switch (message.type) {
      case ExtensionMessageType.WORKSPACEUPDATED:

        break;
      case ExtensionMessageType.SET_APP_MODE:
        if (message.mode) {
          setAppMode(message.mode);
        }
        break;
      case ExtensionMessageType.EDITOR_LOAD_TYPES:
        setAppMode("canvas");
        setCanvasSchema(message.payload.schema);
        setCanvasDesign(null);
        break;
      case ExtensionMessageType.EDITOR_LOAD_ARRANGED_DESIGN:
        setAppMode("canvas");
        setCanvasDesign(message.payload.design);
        setCanvasSchema(null);
        break;
      case ExtensionMessageType.FILE_OPENED:
        resolveFileOpened(message.payload);
        break;
      case ExtensionMessageType.FILE_SAVE_RESULT:
        resolveFileSaved(message.payload);
        break;

      default:
        break;
    }

  }, [])

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  useEffect(() => {
    const message: WebviewMessage = {
      messageType: WebviewMessageType.WEBVIEW_DID_LAUNCH,
    };
    vscode._postMessage(message);
  }, [])
  return (
    <main>
      <div className='webview-container'>


        {appMode === "editor" && <DbViewerPage />}
        {appMode === "analytics" && <AnalyticsPage />}
        {appMode === "canvas" && <EditorPage schema={canvasSchema ?? undefined} design={canvasDesign ?? undefined} />}
        {appMode === "createConnection" && <CreateConnectionPage />}


        {appMode === "sidebar" && <SideBarPage />}
        {appMode === "" && <EditorPage />}

      </div>

    </main>


  )
}

export default App