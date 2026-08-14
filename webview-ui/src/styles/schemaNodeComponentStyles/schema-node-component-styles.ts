import { NodeToolbar } from "@xyflow/react";
import styled from "styled-components";

interface SchemaNodeComponentMainDivProp {
  $bgColor: string;
}
const SchemaNodeComponentMainDiv = styled.div<SchemaNodeComponentMainDivProp>`
  padding: 2px;
  border: 2px dashed transparent;
  width: fit-content;
  min-width: 300px;
  border-radius: 4px;
  max-width: 300px;
  position: relative;
  background: ${(p) => p.$bgColor};


  &.selected {
    position: relative;
    

    &::before {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 4px;
      pointer-events: none;
      background:
        linear-gradient(
          90deg,
          var(--vscode-focusBorder, var(--gray-70)) 50%,
          transparent 50%
        ),
        linear-gradient(
          90deg,
          var(--vscode-focusBorder, var(--gray-70)) 50%,
          transparent 50%
        ),
        linear-gradient(
          0deg,
          var(--vscode-focusBorder, var(--gray-70)) 50%,
          transparent 50%
        ),
        linear-gradient(
          0deg,
          var(--vscode-focusBorder, var(--gray-70)) 50%,
          transparent 50%
        );
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
      background-size:
        16px 2px,
        16px 2px,
        2px 16px,
        2px 16px;
      background-position:
        0 0,
        0 100%,
        0 0,
        100% 0;
      animation: schema-node-dash-roll 0.5s linear infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    }

    @keyframes schema-node-dash-roll {
      0% {
        background-position:
          0 0,
          0 100%,
          0 0,
          100% 0;
      }
      100% {
        background-position:
          16px 0,
          -16px 100%,
          0 -16px,
          100% 16px;
      }
    }
  }
  .schema-node-button {
    display: flex;
    height: 26px;
    width: fit-content;
    max-width: 400px;
  }
`;

const SchemaNodeComponentHeader = styled.div<SchemaNodeComponentMainDivProp>`
  width: 100%;

  backdrop-filter: blur(6px);
  background: rgba(6, 6, 6, 0.85);
  > div {
    display: flex;
    align-items: center;
  }
  .schema-node-header {
    width: 100%;
    display: flex;
    gap: 0px;
    align-items: center;
    flex-flow: column;
    justify-content: space-between;
  }
  .schema-node-header-holder {
    height: 30px;
    padding: 0 4px;
    width: 100%;
    display: flex;
    gap: 0px;
    align-items: center;
    justify-content: space-between;
  }

  .schema-label-header {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .schema-label-text {
    margin: 0;
    padding: 0;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    overflow: hidden;
    padding: 0 8px;
    white-space: noWrap;

    text-overflow: ellipsis;
  }
  .schema-label-header-indicator {
    padding: 3px;
    width: 100%;
    background: ${(p) => p.$bgColor};
  }


`;

const SchemaNodeComponentBody = styled.div`
  background: var(--vscode-editor-background, var(--gray-100));

  padding-bottom: 10px;

  > div {
    display: flex;
    flex-flow: column;
    gap: 2px;
  }
`;

const SchemaNodeComponentField = styled.div`
  padding: 4px 6px;
  width: 100%;
  position: relative;

  > div {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }
  .field-buttons-holder {
    gap: 4px;
    height: 20px;
    align-items: center;
  }
  .schema-data-type-field-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .schema-data-type-field-label {
    max-width: 62%;
    overflow: hidden;
    flex: 1;
  }
  .schema-data-type-field-label-type {
    max-width: 38%;
    overflow: hidden;
    padding: 1px 2px;
    text-overflow: ellipsis;
    flex: 1;
  }
  .schema-data-type-field-text {
    padding: 0;
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: noWrap;
  }
  .schema-data-type-field-data-type {
    font-size: 14px;
    opacity: 0.8;
    font-weight: 400;
    text-align: right;
  }
  .schema-edit-field {
    height: 35px;
    align-items: center;
  }
`;

const SchemaNodeComponentEditTrigger = styled.div`
  cursor: pointer;
  &:hover {
    opacity: 0.85;
  }
`;

const SchemaNodeComponentEditInput = styled.input`
  width: 100%;
  min-width: 0;
  background: var(--vscode-input-background, #3c3c3c);
  color: var(--vscode-input-foreground, #cccccc);
  border: 1px solid var(--vscode-input-border, var(--gray-30));
  padding: 4px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  outline: none;
  flex:1;
  height:30px;

  &:focus {
    border-color: var(--vscode-focusBorder, var(--gray-70));
  }
`;

const SchemaNodeComponentEditSelect = styled.select`
  width: 100%;
  min-width: 0;
  background: var(--vscode-dropdown-background, #3c3c3c);
  color: var(--vscode-dropdown-foreground, #cccccc);
  border: 1px solid var(--vscode-dropdown-border, var(--gray-30));
  padding: 2px 4px;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  height:30px;

  &:focus {
    border-color: var(--vscode-focusBorder, var(--gray-70));
  }

  option {
    background: var(--vscode-dropdown-background, #3c3c3c);
    color: var(--vscode-dropdown-foreground, #cccccc);
  }
`;

const SchemaNodeComponentToolBar = styled(NodeToolbar)`
  display: flex;
  padding: 0 4px;
  gap: 4px;
  border-radius: 6px;
  z-index: 10;
  position: relative;
  width: 100%;
  max-width: 200px;
  pointer-events: none;

  > div {
    position: absolute;
    right: 10px;
    width: fit-content;
    bottom: 0;
    display: flex;
    gap: 2px;
    align-items: flex-end;
    justify-content: end;
    pointer-events: auto;
  }
 
`;

interface SchemaNodeComponentEdgeHandleProp {
  $color?: string;
}
const SchemaNodeComponentEdgeHandle = styled.div<SchemaNodeComponentEdgeHandleProp>`
  max-width: 8px;
  height: 8px;
  position: absolute;
  display: flex;
  align-items: center;
  top: 50%;
  transform: translateY(-50%);
  &.right {
    right: -12px;
    .handle {
      right: 4px;
    }
  }
  &.left {
    left: -12px;
    .handle {
      left: 4px;
    }
  }
  .handle {
    width: 8px;
    height: 8px;
    color: ${(p) => p.$color};
    background: ${(p) =>
      p.$color || "var(--vscode-editorHoverWidget-border, #2d2d2d)"};
    border-radius: 1px;
  }
`;

export {
  SchemaNodeComponentMainDiv,
  SchemaNodeComponentHeader,
  SchemaNodeComponentBody,
  SchemaNodeComponentField,
  SchemaNodeComponentToolBar,
  SchemaNodeComponentEdgeHandle,
  SchemaNodeComponentEditInput,
  SchemaNodeComponentEditSelect,
  SchemaNodeComponentEditTrigger,
};
