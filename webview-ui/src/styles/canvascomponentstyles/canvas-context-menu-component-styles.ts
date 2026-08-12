import styled from "styled-components";

interface CanvasConntextMenuComponentMainDivprop{
    top?:string,

}
const CanvasConntextMenuComponentMainDiv = styled.div<CanvasConntextMenuComponentMainDivprop>`
  border: 1px solid var(--vscode-editorWidget-border, #454545);
  border-radius: 4px;
  min-width: 200px;
  background: var(--vscode-editor-background, var(--gray-100));
position:absolute;
  > div {
    display: flex;
    flex-flow: column;
  }
  .canvas-context-menu-group {
    display: flex;
    flex-flow: column;
    gap: 4px;
    padding: 4px;
  }
  .canvas-context-menu-group-border {
    border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  }
`;

const CanvasConntextMenuButton = styled.div`
  padding: 8px 10px;
  border-radius: 2px;
  min-width: 200px;
  border: 1px dashed transparent;
  transition: all 0.6s;

  cursor: pointer;
  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  &:hover {
    //background:var(--vscode-editorWidget-border,var(--gray-10));
    border-color: var(--vscode-focusBorder, var(--gray-70));
  }
  .canvas-context-menu-text-holder {
  }
  .canvas-context-menu-text {
    padding: 0;
    margin: 0;

    font-size: 14px;
    font-weight: 500;
    text-transform: capitalize;
  }
`;

export { CanvasConntextMenuComponentMainDiv, CanvasConntextMenuButton };
