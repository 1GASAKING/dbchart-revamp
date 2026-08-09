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

  .canvas-component-canvas .react-flow {
    --xy-node-border: 1px solid var(--vscode-editorWidget-border, #454545);
    --xy-node-background-color: var(--vscode-editor-background, #1e1e1e);
    --xy-node-color: var(--vscode-editor-foreground, #cccccc);
    --xy-edge-stroke: var(--vscode-editor-foreground, #cccccc);
    --xy-handle-background-color: var(--vscode-focusBorder, #007acc);
  }

  .canvas-component-canvas .react-flow__background {
    background: red;
  }

  .canvas-component-canvas .react-flow__controls button {
    background: var(--vscode-sideBar-background, #252526);
    color: var(--vscode-editor-foreground, #cccccc);
    border: 1px solid var(--vscode-editorWidget-border, #454545);
  }

  .canvas-component-canvas .react-flow__controls button:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }
`;

const CanvasComponentReactFlow = styled(ReactFlow)`
  width: 100%;
  height: 100vh;
`;
const CanvasComponentMiniMap = styled(MiniMap)`
  width: 200px;
  border: 1px solid var(--vscode-editorWidget-border, #454545);
`;
const CanvasComponentBackground = styled(Background)`
  ;
`;

export {
  CanvasComponentMainDiv,
  CanvasComponentReactFlow,
  CanvasComponentMiniMap,
  CanvasComponentBackground,
};
