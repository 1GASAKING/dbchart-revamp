import type { NoteNodeDataType } from "@dbchart/schema";
import { generateNodeColor, generateNodeId } from "../utils/general-utils";

/**
 * Create and return note node data with a unique id and a randomly generated
 * color.
 *
 * Notes are free-form sticky notes that can be pinned to a node, an area, or
 * left floating on the board.
 *
 * @param overrides - partial data properties to override the defaults
 */
export function createNoteNodeData(
  overrides: Partial<Omit<NoteNodeDataType, "id">> = {}
): NoteNodeDataType {
  return {
    id: generateNodeId(),
    content: "",
    color: generateNodeColor(),
    ...overrides,
  };
}