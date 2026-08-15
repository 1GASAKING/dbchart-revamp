import { useCallback, useEffect, useState } from 'react'
import SideBarPage from './pages/sidebarpages';
import { type ExtensionMessage } from "@shared/extensionmessage/types";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from '@shared/extensionmessage/extensionmessage';
import type { WebviewMessage } from "@shared/webview/type";
import { vscode } from './utils/vscode';
import EditorPage from './pages/editor/editor-page';
import '@xyflow/react/dist/style.css'



function App() {

  const [appMode, setAppMode] = useState<"sidebar" | "editor" | "">("");

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


        {appMode === "editor" && <EditorPage />}


        {appMode === "sidebar" && <SideBarPage />}

      </div>

    </main>


  )
}

export default App
