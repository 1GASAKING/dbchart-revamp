import styled from "styled-components";

export const ConnectionComponentMainDiv = styled.div``;

export const ConnectionComponentSectionDiv = styled.section``;

export const ConnectionComponentField = styled.div`
  transition: all 0.5s;
  position: relative;
  &.projects-field {
    cursor: pointer;
  }

  > div {
    border: 1px solid transparent;
    margin: 0 1px 0 3px;
    padding: 6px 4px;
    transition: border-color 0.5s;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &:hover {
    > div {
      border-color: var(--vscode-editorHoverWidget-border, gray);
    }
    opacity: 0.8;
  }
  .connection-name {
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    h4 {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .apps-icon {
    border-radius: 100%;
    width: 15px;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.4s;
    > div {
      position: absolute;
      width: 19px;
      height: 19px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 100%;
      background: var(--vscode-editor-background, white);
      left: -4px;
      border: 1px solid var(--vscode-focusBorder, var(--gray-70));
    }
    &:hover {
      z-index: 2;
    }
  }
  .chevron-container {
    display: flex;
    align-items: center;
    border: 1px dashed transparent;
    cursor: pointer;

    transform: rotate(180deg);
    &:hover {
      border-color: var(--vscode-focusBorder, var(--gray-70));
    }
  }
`;

export const ConnectionComponentDropDown = styled.div`
  position: absolute;
  top: 40px;
  width: 98.5%;
  border: 1px solid var(--vscode-focusBorder, var(--gray-70)) !important  ;
  max-height: 106px;
  padding: 0;
  display: flex;
  flex-flow: column;
  overflow: hidden;
  overflow-y: auto;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(
      --vscode-scrollbarSlider-background,
      rgba(121, 121, 121, 0.4)
    );
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(
      --vscode-scrollbarSlider-hoverBackground,
      rgba(100, 100, 100, 0.7)
    );
  }
  > div {
    left: 0;
    width: 100%;
    display: flex;
    flex-flow: column;
    margin: 0;
  }
`;
interface ConnectionComponentDropDownFieldProp {
  isSelcted?: boolean;
}

export const ConnectionComponentDropDownField = styled(
  ConnectionComponentField,
)<ConnectionComponentDropDownFieldProp>`
  padding: 0px;
  display: flex;
  left: 0;
  cursor: pointer;
  margin: 0px;
  width: 101%;

  
  > div {
    margin: 0;
    width: 100%;
    border:1px solid ${(p) =>
    p.isSelcted
      ? "var(--vscode-focusBorder, var(--gray-70))"
      : "transparent"} !important;
  }
`;
export const ConnectionComponentToggle = styled.input.attrs({
  type: "Checkbox",
})`
  display: none;
  &:not(:checked) ~ ${ConnectionComponentField} {
    .chevron-container {
      transform: rotate(90deg);
    }
  }
  &:not(:checked) ~ ${ConnectionComponentField} > ${ConnectionComponentDropDown}{
    display: none;
  }
`;
