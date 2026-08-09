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

export {
  CanvasComponentMainDiv,
  CanvasComponentReactFlow,
  CanvasComponentMiniMap,
  CanvasComponentBackground,
};
