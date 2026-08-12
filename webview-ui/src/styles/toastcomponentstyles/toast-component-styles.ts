import styled, { css, keyframes } from "styled-components"

const hide = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const slideIn = keyframes`
  from { transform: translateX(calc(100% + var(--viewport-padding, 25px))); }
  to   { transform: translateX(0); }
`

const swipeOut = keyframes`
  from { transform: translateX(var(--radix-toast-swipe-end-x)); }
  to   { transform: translateX(calc(100% + var(--viewport-padding, 25px))); }
`

/* ---------- viewport ---------- */

const ToastViewport = styled.div`
  --viewport-padding: 25px;
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--viewport-padding);
  gap: 10px;
  width: 390px;
  max-width: 100vw;
  margin: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
`

/* ---------- root (shared) ---------- */

const toastBase = css`
  border-radius: 6px;
  box-shadow: 0 10px 38px -10px rgba(0, 0, 0, 0.35), 0 10px 20px -15px rgba(0, 0, 0, 0.2);
  padding: 15px;
  display: grid;
  grid-template-areas: "icon title" "icon description";
  grid-template-columns: auto 1fr;
  column-gap: 12px;
  row-gap: 2px;
  align-items: start;
  border: 1px solid transparent;

  &[data-state="open"] {
    animation: ${slideIn} 150ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  &[data-state="closed"] {
    animation: ${hide} 100ms ease-in;
  }
  &[data-swipe="move"] {
    transform: translateX(var(--radix-toast-swipe-move-x));
  }
  &[data-swipe="cancel"] {
    transform: translateX(0);
    transition: transform 200ms ease-out;
  }
  &[data-swipe="end"] {
    animation: ${swipeOut} 100ms ease-out;
  }
`

const ToastRoot = styled.div<{ $type: ToastType }>`
  ${toastBase}

  ${({ $type }) => {
    switch ($type) {
      case "error":
        return css`
          background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
          border-color: var(--vscode-inputValidation-errorBorder, #be1100);
        `
      case "warning":
        return css`
          background: var(--vscode-inputValidation-warningBackground, #352a05);
          border-color: var(--vscode-inputValidation-warningBorder, #b89500);
        `
      case "notification":
        return css`
          background: var(--vscode-inputValidation-infoBackground, #063b49);
          border-color: var(--vscode-inputValidation-infoBorder, #007acc);
        `
    }
  }}
  display:flex;
  width:100%;
  flex-flow:column;
  gap:10px;
    border-color:${(p) => p.$type ==="warning"? "#b89500":p.$type==="error"? "#be1100":"#007acc" };


  .header {
  display:flex;
  justify-content:space-between;
  width:100%;


  }
  
  
`

const ToastIcon = styled.div<{ $type: ToastType }>`
  grid-area: icon;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
  border-radius:4px;
  border:1px solid transparent;
  
  background-color:${(p) => p.$type ==="warning"? "#352a05":p.$type==="error"? "#5a1d1d":"#063b49" };
  color:${(p) => p.$type ==="warning"? "#cca700":p.$type==="error"? " #f48771":"#75beff" };
  border-color:${(p) => p.$type ==="warning"? "#b89500":p.$type==="error"? "#be1100":"#007acc" };
`

const ToastTitle = styled.div`
  grid-area: title;
  font-weight: 600;
  font-size: 16px;
  margin: 0;
`

const ToastDescription = styled.div<{$type:ToastType}>`
  grid-area: description;
  margin: 0;
  font-size: 14px;
  line-height: 1.3;
  font-weight:200;
  opacity: 0.7;


`

export type ToastType = "error" | "warning" | "notification"

export { ToastViewport, ToastRoot, ToastIcon, ToastTitle, ToastDescription }