import styled from "styled-components";

const ProjectConnectionComponentMainDiv = styled.div`
  border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  max-height: 100vh;
  > div {
    margin: 0 0px 16px 2px;

    display: flex;
    align-items: center;
    flex-flow: column;
    gap: 50px;
  }

  .connection-prompt-holder {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column;
    width: 100%;
    gap: 20px;
  }

  .connection-prompt-text {
    display: flex;
    align-items: center;
    text-transform: capitalize;
    > h4 {
      margin: 0;
      padding: 0;
      font-weight: 500;
      font-size: 15px;
    }
  }
  .connection-propmt-action-button-container {
    width: 100%;
    display: flex;
    gap: 10px;
  }
  .connection-propmt-action-button {
    width: 100%;
    height: 32px;
    display: flex;
  }
  .connection-group-dialog-name-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
  }
  .connection-group-input-name-container {
    display: flex;
    height: 35px;
    width: 80%;
  }
  .connection-fields-container {
    display: flex;
    width: 100%;
    flex-flow: column;
  }
    .connection-edit-input {
    width: 100%;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid var(--vscode-input-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 12px;
  }
`;

const ProjectConnectionComponentConnectionField = styled.div`
  position: relative;
  overflow: hidden;
  &:before {
    content: "";
    z-index: -1;
    position: absolute;
    width: 100px;
    height: 100%;
    border-left: 2px solid;
    left: 6px;
    top: 20px;
    opacity: 0.7;
  }
  > div {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .connection-field-row {
    width: 100%;
    margin-bottom: 10px;
    cursor: pointer;
  }
  .connection-lists {
    display: flex;
    flex-flow: column;
    gap: 6px;
    margin-left: 16px;
    margin-right: 8px;
  }
  .connections-dropdown {
    width: 100%;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .connections-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .connection-button {
    display: flex;
    width: 20px;
    height: 20px;
  }
  
  .flex-center {
    align-items: center;
    gap: 2px;
  }

  .count-text {
    opacity: 0.7;
    margin-right: 2px;
  }
    .input-container{
    gap:4px;
    width:100%;
    }
`;


export {
  ProjectConnectionComponentMainDiv,
  ProjectConnectionComponentConnectionField,};
