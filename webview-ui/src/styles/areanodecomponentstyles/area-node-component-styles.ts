import styled from "styled-components";

interface AreaNodeComponentMainDivProp {
  $color?: string;
}

const AreaNodeComponentMainDiv = styled.div<AreaNodeComponentMainDivProp>`
  width: 100%;
  height: 100%;
  .area-container {
    width: 100%;
    height: 100%;
    position: relative;
    border: 2px dashed
      ${(p) => p.$color ?? "var(--vscode-editorWidget-border, #454545)"};
    border-radius: 4px;
    background: color-mix(
      in srgb,
      ${(p) => p.$color ?? "var(--vscode-editorWidget-border, #454545)"} 12%,
      transparent
    );
    pointer-events: all;
    overflow: hidden;
    > div {
      justify-content: space-between;
      gap: 10px;
      margin: 4px 6px 4px 4px;
      display: flex;
    }
  }
  .react-flow__resize-control.line {
    box-sizing: border-box;
    
  }
  .react-flow__resize-control.line.left {
    left: -6px;
    top: 0;
    height: 100%;
    width: 7px;
    transform: none;
    border-left-width: 0;
    border-right-width: 1px;
  }
  .react-flow__resize-control.line.right {
    left: 100%;
    top: 0;
    height: 100%;
    width: 7px;
    transform: none;
    border-right-width: 0;
    border-left-width: 1px;
  }
  .react-flow__resize-control.line.top {
    top: -6px;
    left: 0;
    width: 100%;
    height: 7px;
    transform: none;
    border-top-width: 0;
    border-bottom-width: 1px;
  }
  .react-flow__resize-control.line.bottom {
    top: 100%;
    left: 0;
    width: 100%;
    height: 7px;
    transform: none;
    border-bottom-width: 0;
    border-top-width: 1px;
  }
  .area-label {
    max-width: 100%;
    padding: 8px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-editor-foreground, #cccccc);
    background: ${(p) =>
      p.$color ?? "var(--vscode-editorWidget-border, #454545)"};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }
  .area-node-button {
    margin-top: 4px;
    height: 30px;
    width: 30px;
  }
`;

export { AreaNodeComponentMainDiv };
