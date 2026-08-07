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
    .schema-node-header-holder{
     width: 100%;
    display: flex;
    gap: 0px;
    align-items: center;
    flex-flow: column;
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
  }

  .schema-label-text {
    margin: 0;
    padding: 0;
    font-weight: 600;
    font-size: 16px;
  }
  .schema-label-header-indicator {
    padding: 3px;
    background: yellow;
    width: 100%;
  }
`;

export { SchemaNodeComponentMainDiv, SchemaNodeComponentHeader };
