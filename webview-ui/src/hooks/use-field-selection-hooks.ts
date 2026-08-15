import { useContext } from "react";
import { FieldSelectionContext } from "../contexts/fieldselectioncontext/field-selection-context";

export const useFieldSelectionContext = ()=>  useContext(FieldSelectionContext)