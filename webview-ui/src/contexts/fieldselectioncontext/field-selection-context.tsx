import { createContext } from "react";
import type { SelectedField } from "@lib/utils";

export interface FieldSelectionContextValue {
  selectedField: SelectedField | null;
  selectField: (field: SelectedField | null) => void;
  /** Field-level keys (`${nodeId}:${fieldId}`) that should be highlighted. */
  highlightedFieldKeys: Set<string>;
  highlightedEdgeIds: Set<string>;
}

export const FieldSelectionContext = createContext<FieldSelectionContextValue>({
  selectedField: null,
  selectField: () => {},
  highlightedFieldKeys: new Set(),
  highlightedEdgeIds: new Set(),
});