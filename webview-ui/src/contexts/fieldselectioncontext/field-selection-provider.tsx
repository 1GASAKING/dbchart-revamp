import { computeFieldHighlight, type GraphEdge, type SelectedField } from "@lib/utils";
import { useMemo, useState, type ReactNode } from "react";
import { FieldSelectionContext, type FieldSelectionContextValue } from "./field-selection-context";


interface FieldSelectionProviderProps {
  edges: GraphEdge[];
  children: ReactNode;
}


/**
 * Tracks the currently selected field and computes which nodes/edges should
 * be highlighted as a result (the field's own connections plus one hop).
 */
export function FieldSelectionProvider({
  edges,
  children,
}: FieldSelectionProviderProps) {
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);

  const highlight = useMemo(
    () => computeFieldHighlight(selectedField, edges),
    [selectedField, edges],
  );

  const value = useMemo<FieldSelectionContextValue>(
    () => ({
      selectedField,
      selectField: setSelectedField,
      highlightedFieldKeys: highlight.fieldKeys,
      highlightedEdgeIds: highlight.edgeIds,
    }),
    [selectedField, highlight],
  );

  return (
    <FieldSelectionContext.Provider value={value}>
      {children}
    </FieldSelectionContext.Provider>
  );
}