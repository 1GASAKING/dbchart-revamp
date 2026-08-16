/** A free-form note that can be pinned to a node, an area, or the board. */
export interface NoteNodeDataType {
  id: string;
  content: string;
  color: string;
  /** Whether the note is collapsed to just its header bar. */
  collapsed?: boolean;
}
