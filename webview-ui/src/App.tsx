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



function App() {

  const [appMode, setAppMode] = useState<"sidebar" | "editor" | "canvas" | "">("");
  const [canvasSchema, setCanvasSchema] = useState<DatabaseSchema | null>(null);

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
        {appMode === "canvas" && <EditorPage schema={canvasSchema ?? undefined} />}


        {appMode === "sidebar" && <SideBarPage />}
        {appMode === "" && <EditorPage />}

      </div>

    </main>


  )
}

export default App