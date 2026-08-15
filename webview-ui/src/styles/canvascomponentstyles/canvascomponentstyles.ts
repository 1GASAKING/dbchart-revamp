import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
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

const CanvasComponentControls = styled.div`
  display: flex;
  width: fit-content;
  gap: 4px;
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;

  .button-holder {
    cursor: pointer;
    &.active {
      background: var(--vscode-button-background, #0e639c) !important;
      border-color: var(--vscode-focusBorder, #007acc);
      color: var(--vscode-button-foreground, #ffffff);

      svg {
        fill: var(--vscode-button-foreground, #ffffff);
      }
    }
  }
  .value-input-holder {

    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #cccccc);
    border: 1px solid var(--vscode-editorWidget-border, #454545);
    border-radius: 4px;
    transition: all 0.15s;
    cursor: pointer;
    display: flex;
    align-items:center;
    padding:0 6px;

    &:hover {
      background: var(--vscode-toolbar-hoverBackground, #3c3c3c);
    }
    &:active {
      background: var(--vscode-toolbar-activeBackground, #555);
    }

    input {
    border:none;
    outline:none;
      padding: 0;
      margin: 0;
      padding: 2px 2px  2px 4px;

      color: var(--vscode-editor-foreground, #cccccc);

      background: transparent;
      width: fit-content;
      width:30px;
      text-align:right;
      &:hover {
        outline: none;
                background:transparent;

      }
      &:active {
        border: none;
        outline: none;
      }
    }

    .zoom-suffix {
      display: flex;
      align-items: center;
      padding: 2px 4px 2px 0;
      color: var(--vscode-editor-foreground, #cccccc);
      font-size: 12px;
    }
  }
  
` as typeof Controls;

export {
  CanvasComponentMainDiv,
  CanvasComponentReactFlow,
  CanvasComponentMiniMap,
  CanvasComponentBackground,
  CanvasComponentControls,
};
