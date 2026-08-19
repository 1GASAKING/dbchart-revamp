import styled from "styled-components";

interface ButtonComponentMainDivProp {
  $bgColor?: string;
  $borderColor?: string;
}

const VsButton = styled.button.attrs<ButtonComponentMainDivProp>(() => ({
  type: "button",
}))<ButtonComponentMainDivProp>`
  border: 1px solid var(--vscode-button-border, var(--gray-30));
  background-color: var(--vscode-button-background, transparent);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s;
  text-transform: inherit;

  text-align: inherit;
  &:hover:not(:disabled) {
    opacity: 0.7;
    border-color: var(--vscode-focusBorder, var(--gray-70));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.active {
    background: var(--vscode-button-foreground, #e8e9e9);
    color: var(--vscode-button-background, #0a0909);

    svg {
      fill: var(--vscode-button-background, #000000);
    }

    i {
      color: var(--vscode-button-background, #000000);
    }
  }

  &.footer-button {
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid var(--vscode-editorWidget-border, var(--gray-70));
    gap: 4px;
    padding: 8px 16px !important ;

    &:hover {
      opacity: 0.6;
      color: #d4d4d4;

      border-color: var(--vscode-focusBorder, var(--gray-100));
    }
  }

  &.action {
    background: red;
    border: 1px solid red;
    &:hover {
      opacity: 0.6;
      border-color: red;
    }
  }
  &.text-icon-reveal {
    display: grid;
    grid-template-columns: auto 0fr;
    gap: 0px;
    font-size: 12px;

    align-items: center;
    overflow: hidden;
    transition: grid-template-columns 0.3s ease;
    > div {
      display: flex;
      align-items: center;
    }
    .text-holder {
      overflow: hidden;
      white-space: nowrap;
      min-width: 0;
      align-items: top;
    }
    .button-text {
      padding: 0;
      margin: 0;
    }

    &:hover {
      grid-template-columns: auto 1fr;
      gap: 8px;
      opacity: 1;
    }
  }
  &.delete-button {
    i {
      color: red;
    }
  }
`;

export { VsButton };
