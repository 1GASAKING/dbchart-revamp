import styled from "styled-components";

interface NoteNodeComponentMainDivProp {
  $color?: string;
}

const noteColor = (p: NoteNodeComponentMainDivProp) =>
  p.$color ?? "var(--vscode-button-background, #0e639c)";

const NoteNodeComponentMainDiv = styled.div<NoteNodeComponentMainDivProp>`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid ${noteColor};
  border-radius: 6px;
  background: var(--vscode-editor-background, #1e1e1e);
  box-sizing: border-box;
  overflow: visible;

  .note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 4px 6px 4px 10px;
    background: color-mix(in srgb, ${noteColor} 22%, transparent);
    border-bottom: 1px solid
      color-mix(in srgb, ${noteColor} 45%, transparent);
    border-radius: 5px 5px 0 0;
    flex-shrink: 0;
  }

  .note-pin-indicator {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-editor-foreground, #cccccc);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .note-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Animated collapse/expand body using the CSS grid rows technique. */
  .note-body {
    display: grid;
    grid-template-rows: 1fr;
    min-height: 0;
    flex: 1;
    transition:
      grid-template-rows 0.2s ease,
      opacity 0.2s ease;
    opacity: 1;
  }
  .note-body-inner {
    overflow: hidden;
    min-height: 0;
  }
  &.collapsed .note-body {
    grid-template-rows: 0fr;
    opacity: 0;
    pointer-events: none;
  }

  textarea.note-editor {
    display: block;
    width: 100%;
    height: 100%;
    resize: none;
    border: none;
    outline: none;
    padding: 10px;
    margin: 0;
    background: transparent;
    color: var(--vscode-editor-foreground, #cccccc);
    font-size: 13px;
    font-family: inherit;
    line-height: 1.5;
    box-sizing: border-box;
  }
  textarea.note-editor::placeholder {
    color: var(--vscode-descriptionForeground, #999);
  }

  .note-color-popover,
  .note-pin-popover {
    position: absolute;
    top: 36px;
    right: 0;
    z-index: 20;
    min-width: 180px;
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1px solid var(--vscode-editorWidget-border, #454545);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    padding: 8px;
  }

  .note-color-grid {
    display: grid;
    grid-template-columns: repeat(6, 20px);
    gap: 6px;
    margin-bottom: 8px;
  }

  .note-color-option {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .note-color-option.active {
    border-color: var(--vscode-focusBorder, #007fd4);
  }

  .note-custom-color-row {
    display: flex;
    gap: 6px;
  }
  .note-custom-color-input {
    flex: 1;
    min-width: 0;
    height: 26px;
    background: var(--vscode-input-background, #3c3c3c);
    color: var(--vscode-input-foreground, #cccccc);
    border: 1px solid var(--vscode-input-border, #454545);
    border-radius: 4px;
    padding: 0 8px;
    outline: none;
  }

  .note-pin-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 240px;
    overflow-y: auto;
  }
`;

const NotePinOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-editor-foreground, #cccccc);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  &:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }
  &.selected {
    background: var(--vscode-list-activeSelectionBackground, #094771);
  }
`;

const NoteHeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-editor-foreground, #cccccc);
  cursor: pointer;
  &:hover {
    background: var(--vscode-toolbar-hoverBackground, #2a2d2e);
  }
`;

export { NoteNodeComponentMainDiv, NotePinOption, NoteHeaderButton };