import { NodeToolbar } from "@xyflow/react";
import styled from "styled-components";

interface SchemaNodeComponentMainDivProp {
  $bgColor: string;
}
const SchemaNodeComponentMainDiv = styled.div<SchemaNodeComponentMainDivProp>`
z-index:10;
  padding: 2px;
  border: 1px dashed transparent;
  width: fit-content;
  min-width: 300px;
  border-radius: 4px;
  max-width: 300px;
  background: ${(p) => p.$bgColor};

  &.selected {
    border-color:var(--vscode-focusBorder, var(--gray-70));
    box-shadow: 0 0 0 1px var(--vscode-focusBorder, var(--gray-70));
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

  > div {
    display: flex;
    flex-flow: column;
    gap: 2px;
  }
`;

const SchemaNodeComponentField = styled.div`
  padding: 4px 0;
  width: 100%;
  position: relative;

  > div {
    display: flex;
    align-items: flex-start;
    width: 100%;
    gap: 1px;
  }
  .schema-data-type-field-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .schema-data-type-field-label {
    max-width: 62%;
    overflow: hidden;
  }
  .schema-data-type-field-label-type {
    max-width: 35%;
    overflow: hidden;
    padding: 1px 2px;
    text-overflow: ellipsis;
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
  }
`;

const SchemaNodeComponentToolBar = styled(NodeToolbar)`
  display: flex;
  padding: 0 4px;
  gap: 4px;
  border-radius: 6px;
  z-index: 10;
  position: relative;
  width: 20px;
  pointer-events: none;

  > div {
    position: absolute;
    left: -66px;
    bottom: 0;
    display: flex;
    gap: 2px;
    align-items: flex-end;
    justify-content: end;
    pointer-events: auto;
  }
  .schema-node-button {
    display: flex;
    height: 26px;
    width: fit-content;
    max-width: 400px;
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
};
