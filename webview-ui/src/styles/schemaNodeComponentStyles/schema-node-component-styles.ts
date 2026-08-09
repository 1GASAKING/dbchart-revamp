import styled from "styled-components";

const SchemaNodeComponentMainDiv = styled.div`
  padding: 4px;
  border: 1px solid red;
  width: fit-content;
  min-width: 300px;
  border-radius: 4px;
  max-width: 300px;
`;

const SchemaNodeComponentHeader = styled.div`
  border: 1px solid red;
  width: 100%;
  background: green;

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
  .schema-label {
    width: 35px;
    background: blue;
    height: 25px;
    border-radius: 8px;
    cursor: pointer;
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
    background: yellow;
    width: 100%;
  }
`;

const SchemaNodeComponentBody = styled.div`
  > div {
    display: flex;
    flex-flow: column;
    gap: 2px;
  }
`;

const SchemaNodeComponentField = styled.div`
  padding: 4px 0;
  border: 1px solid green;
  width: 100%;
  position: relative;

  > div {
    display: flex;
    align-items: flex;
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
    oveflow: hidden;
  }
  .schema-data-type-field-label-type {
    max-width: 35%;
    border: 1px solid blue;
    overflow: hidden;
    padding: 1px 2px;
    text-overflow: ellipsis;
  }
  .schema-data-type-field-text {
    padding: 0;
    margin: 0;
    border: 1px solid red;
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

const SchemaNodeComponentFooter = styled.div`
  border: 1px solid red;
  padding: 16px 0px 8px;

  > div {
    display: flex;
    gap: 2px;
  }
  .schema-node-button {
    display: flex;
    height: 26px;
    width: fit-content;
    max-width: 400px;
  }
`;

interface SchemaNodeComponentEdgeHandleProp{
  $color?:string,
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
      color:${(p)=>p.$color};
      background:${(p)=>p.$color||"var(--vscode-editorHoverWidget-border, #2d2d2d)"};
      border-radius:1px;
    }
`;

export {
  SchemaNodeComponentMainDiv,
  SchemaNodeComponentHeader,
  SchemaNodeComponentBody,
  SchemaNodeComponentField,
  SchemaNodeComponentFooter,
  SchemaNodeComponentEdgeHandle,
};
