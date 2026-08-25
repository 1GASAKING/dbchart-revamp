import styled from "styled-components";

interface ConnectionComponentConnectionProp {
  $connected: boolean;
}

const ConnectionComponentMainDiv = styled.div`
  width: 100%;
  border: 1px solid red;
  padding: 0 10px;
  > div {
    width: 100%;
  }
`;

const ConnectionComponentHeaderDiv = styled.div<ConnectionComponentConnectionProp>`
  width: 100%;
  border: 1px solid green;
  > div {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: space-between;
    width: 100%;
  }
  .connected-icon {
    width: 5px;
    height: 5px;
    border-radius: 100%;

    background: ${(p) => (p.$connected ? " #89d185" : "#ef5757")};
  }

  .flex-items {
    align-items: center;
    gap: 1px;
  }
  .connection-button {
    display: flex;
    width: 20px;
    height: 20px;
  }
  .left-item {
    gap: 6px;
    align-items: center;
  }

  .connection-name {
    flex: 1;
    text-overflow: ellipsis;
    white-space: noWrap;
    overflow: hidden;
  }
  .connection-type {
    opacity: 0.6;
    padding-left: 4px;
  }
`;
const ConnectionComponentSubSectionDiv = styled.div`
  margin: 4px 0 10px;
  border: 1px solid white;
  padding-left: 4px;
  display: flex;
  flex-flow: column;
  gap: 4px;
  > div {
    display: flex;
    align-items: left;
    flex-flow: column;
    gap: 2px;
  }
  .sub-header {
    display: flex;
    gap: 4px;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }
  .sub-toggle {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  @keyframes dbchart-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .codicon-spin {
    animation: dbchart-spin 1.2s linear infinite;
  }
`;
const ConnectionTableComponentMainDiv = styled.div`
  padding-left: 4px;
  display: flex;
  flex-flow: column;
  gap: 4px;
  > div {
    overflow: hidden;
    position: relative;
    &:before {
      content: "";
      z-index: -1;
      position: absolute;
      width: 100px;
      height: 100%;
      border-left: 1px solid red;
      left: 0px;
      top: 20px;
      opacity: 0.7;
    }
  }
  .database-field-header {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .field-info {
    opacity: 0.6;
  }
  .fields {
    border: 1px solid red;

    margin-left: 6px;
    margin-top: 4px;
    margin-bottom: 4px;
    display: flex;
    flex-flow: column;
    gap: 2px;
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
      top: 14px;
      opacity: 0.7;
    }
  }

  /* ── Expanding/collapsing fields section ─────────── */
  .field-section-header {
    cursor: pointer;
    user-select: none;

    &:hover .field-info,
    &:hover i:not(.field-info):not(.field-toggle-icon) {
      opacity: 0.85;
    }
  }

  /* Chevron rotates between down (expanded) and right (collapsed). */
  .field-toggle-icon {
    font-size: 12px;
    transition: transform 0.3s ease;
  }
  .field-toggle-icon.collapsed {
    transform: rotate(-90deg);
  }

  /* Animated collapse/expand body using the CSS grid rows technique. */
  .fields-body {
    display: grid;
    grid-template-rows: 1fr;
    min-height: 0;
    transition:
      grid-template-rows 0.25s ease,
      opacity 0.25s ease;
    opacity: 1;
  }
  .fields-body-inner {
    overflow: hidden;
    min-height: 0;
  }
  .field-section.collapsed .fields-body {
    grid-template-rows: 0fr;
    opacity: 0;
    pointer-events: none;
  }

  /* Helper rows: notes, empties, errors and flat items. */
  .field-note {
    opacity: 0.6;
    font-style: italic;
    font-size: 11px;
    padding: 1px 4px;
  }
  .field-error {
    color: var(--vscode-errorForeground, #f48771);
    font-size: 11px;
    padding: 2px 0;
    word-break: break-word;
  }
  .field-item-row {
    padding: 2px 0;

    &:hover i:not(.field-info) {
      opacity: 0.85;
    }
  }

  @keyframes dbchart-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .codicon-spin {
    animation: dbchart-spin 1.2s linear infinite;
  }
`;
export {
  ConnectionComponentSubSectionDiv,
  ConnectionComponentMainDiv,
  ConnectionComponentHeaderDiv,
  ConnectionTableComponentMainDiv,
};
