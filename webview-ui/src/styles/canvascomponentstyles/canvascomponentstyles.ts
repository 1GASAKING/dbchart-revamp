import { Background, MiniMap, ReactFlow } from "@xyflow/react";
import styled from "styled-components";

const CanvasComponentMainDiv = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;

  background: var(--vscode-editor-background, #1e1e1e);
  border: 1px solid var(--vscode-editorWidget-border, #454545);
  display: flex;

  .canvas-component-canvas {
    width: 100%;
    height: 100vh;
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1px solid var(--vscode-editorWidget-border, #454545);
  }

 
  
`;

const CanvasComponentReactFlow = styled(ReactFlow)`
  width: 100%;
  height: 100vh;
` as typeof ReactFlow;
const CanvasComponentMiniMap = styled(MiniMap)`
  width: 200px;
  border: 1px solid var(--vscode-editorWidget-border, #454545);
`;
const CanvasComponentBackground = styled(Background)`
  ;
`;

const CanvasControlsBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background: var(--vscode-editor-background, #1e1e1e);
  border-top: 1px solid var(--vscode-editorWidget-border, #454545);
  z-index: 10;

  .controls-search {
    flex: 1;
    max-width: 220px;
    input {
      width: 100%;
      height: 26px;
      padding: 0 8px;
      background: var(--vscode-input-background, #3c3c3c);
      color: var(--vscode-input-foreground, #cccccc);
      border: 1px solid var(--vscode-input-border, #454545);
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      &:focus {
        border-color: var(--vscode-focusBorder, #007acc);
      }
    }
  }

  .controls-divider {
    width: 1px;
    height: 20px;
    background: var(--vscode-editorWidget-border, #454545);
  }

  .controls-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--vscode-editor-foreground, #cccccc);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.15s;

    &:hover {
      background: var(--vscode-toolbar-hoverBackground, #3c3c3c);
      border-color: var(--vscode-editorWidget-border, #454545);
    }
    &:active {
      background: var(--vscode-toolbar-activeBackground, #555);
    }
  }
`;

export {
  CanvasComponentMainDiv,
  CanvasComponentReactFlow,
  CanvasComponentMiniMap,
  CanvasComponentBackground,
  CanvasControlsBar,
};
