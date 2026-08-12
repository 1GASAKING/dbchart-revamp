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


const ToastViewport = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
`;

const ToastRoot = styled.div`
  background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
  color: var(--vscode-inputValidation-errorForeground, #f48771);
  border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  max-width: 400px;
  text-align: center;
  line-height: 1.4;
  list-style: none;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
`;

export { CanvasConntextMenuComponentMainDiv, CanvasConntextMenuButton, ToastViewport, ToastRoot, ToastTitle };
