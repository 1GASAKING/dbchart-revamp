import { createContext } from "react";
import type { SelectedField } from "@lib/utils";

export interface FieldSelectionContextValue {
  selectedField: SelectedField | null;
  selectField: (field: SelectedField | null) => void;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
}

export const FieldSelectionContext = createContext<FieldSelectionContextValue>({
  selectedField: null,
  selectField: () => {},
  highlightedNodeIds: new Set(),
  highlightedEdgeIds: new Set(),
});

