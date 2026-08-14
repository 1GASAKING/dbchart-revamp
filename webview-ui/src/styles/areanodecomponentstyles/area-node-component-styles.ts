import styled from "styled-components";

interface AreaNodeComponentMainDivProp {
  $color?: string;
}

const AreaNodeComponentMainDiv = styled.div<AreaNodeComponentMainDivProp>`
  width: 100%;
  height: 100%;
  position: relative;
  border: 2px dashed ${(p) => p.$color ?? "var(--vscode-editorWidget-border, #454545)"};
  border-radius: 6px;
  background: color-mix(
    in srgb,
    ${(p) => p.$color ?? "var(--vscode-editorWidget-border, #454545)"} 12%,
    transparent
  );
  pointer-events: all;
  overflow: hidden;
  z-index:-1;

  .area-label {
    position: absolute;
    top: 0;
    left: 0;
    max-width: 100%;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-editor-foreground, #cccccc);
    background: ${(p) => p.$color ?? "var(--vscode-editorWidget-border, #454545)"};
    border-bottom-right-radius: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

`;

export { AreaNodeComponentMainDiv };