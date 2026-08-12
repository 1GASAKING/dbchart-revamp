import styled from "styled-components"

const ToastViewport = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
`

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
`

const ToastTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
`

export { ToastViewport, ToastRoot, ToastTitle }