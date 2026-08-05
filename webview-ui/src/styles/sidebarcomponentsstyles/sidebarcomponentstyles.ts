import styled from "styled-components";

export const SideBarMainDiv = styled.div`
  > div {
    display: flex;
    flex-flow: column;
  }
`;

export const SideBarSection = styled.div`
  width: 100%;

  > div {
    display: flex;
    width: 100%;
    flex-direction: column;
  }
`;

export const SideBarSectionHeader = styled.div`
  width: 100%;
  .section-header {
    border-bottom: 1px solid
      var(--vscode-editorHoverWidget-border, var(--gray-10));

    width: 100%;
    padding: 4px 1px;
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }
  .section-label-holder {
    width: fit-content;
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.4s;
    &:hover {
      opacity: 0.7;
    }
  }

  .section-action-group-holder {
    display: flex;
    gap: 2px;
  }

  .section-action-holder {
    border: 0.5px dashed transparent;

    * {
      font-size: 18px;
    }

    &:hover {
      opacity: 0.7;
      border-color: var(--vscode-focusBorder, var(--gray-70));
    }
  }

  .text-container {
    padding: 0;
    margin: 0;
    width: fit-content;
    font-weight: 400;
    text-transform: uppercase;
  }
  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: fit-content;
    width: fit-content;
    cursor: pointer;
    transition: all 0.4s;
  }

  .codicon-chevron-up {
    transition: transform 0.3s ease;
    transform: rotate(180deg);
  }
`;

export const SideBarContent = styled.div`
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    min-height 0.3s ease,
    opacity 0.3s ease,
    padding 0.3s ease;
  max-height: 1000px;
  min-height: 0px;
  opacity: 1;
  padding: 8px 0;

  &.connections-section {
    min-height: 200px;
  }
`;


// Hidden checkbox toggle logic
export const ToggleCheckbox = styled.input.attrs({ type: "checkbox" })`
  display: none;

  /* When checkbox is unchecked (collapsed): rotate chevron 180deg, hide content */
  &:not(:checked) ~ ${SideBarSectionHeader} {
    .codicon-chevron-up {
      transform: rotate(90deg);
    }
  }

  &:not(:checked) ~ ${SideBarContent} {
    max-height: 0;
    min-height: 0;
    opacity: 0;
    padding: 0 8px;
    overflow: hidden;
  }
`;
