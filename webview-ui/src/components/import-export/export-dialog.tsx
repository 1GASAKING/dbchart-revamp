import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { SchemaFormat } from "@lib/import-export";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

/** Everything the export dialog can emit. */
export type ExportKind = SchemaFormat | "svg" | "png";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Number of tables/entities being exported (shown for context). */
  entityCount: number;
  /** Called with the chosen format when the user confirms. */
  onExport: (kind: ExportKind) => void;
}

const EXPORT_FORMATS: Array<{ kind: ExportKind; label: string; hint: string }> = [
  { kind: "sql", label: "SQL DDL", hint: "CREATE TABLE + FOREIGN KEY statements" },
  { kind: "dbml", label: "DBML", hint: "Database Markup Language" },
  { kind: "json", label: "JSON", hint: "Canonical schema (round-trip safe)" },
  { kind: "svg", label: "SVG", hint: "Vector image — sharp at any zoom, best for printing" },
  { kind: "png", label: "PNG", hint: "Raster image — best for easy sharing" },
];

const ExportDialog = ({ open, onOpenChange, entityCount, onExport }: ExportDialogProps) => {
  const [kind, setKind] = useState<ExportKind>("sql");

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setKind("sql");
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--vscode-editor-background, #1e1e1e)",
            border: "1px solid var(--vscode-editorWidget-border, #454545)",
            borderRadius: "8px",
            padding: "24px",
            width: "480px",
            maxWidth: "92%",
            maxHeight: "85vh",
            overflowY: "auto",
            zIndex: 10000,
            color: "var(--vscode-editor-foreground, #cccccc)",
          }}
        >
          <Dialog.Title
            style={{
              margin: "0 0 8px 0",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Export Diagram
          </Dialog.Title>
          <Dialog.Description
            style={{
              margin: "0 0 16px 0",
              fontSize: "13px",
              color: "var(--vscode-descriptionForeground, #999)",
            }}
          >
            Exporting {entityCount} entit{entityCount === 1 ? "y" : "ies"}. Choose a format.
          </Dialog.Description>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {EXPORT_FORMATS.map((item) => (
              <button
                key={item.kind}
                onClick={() => setKind(item.kind)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background:
                    kind === item.kind
                      ? "var(--vscode-button-background, #0e639c)"
                      : "var(--vscode-input-background, #3c3c3c)",
                  color:
                    kind === item.kind
                      ? "var(--vscode-button-foreground, #ffffff)"
                      : "var(--vscode-input-foreground, #cccccc)",
                  border: "1px solid var(--vscode-input-border, #454545)",
                }}
              >
                <input
                  type="radio"
                  checked={kind === item.kind}
                  onChange={() => setKind(item.kind)}
                  style={{ margin: 0 }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "14px", fontWeight: 500 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "var(--vscode-descriptionForeground, #999)",
                    }}
                  >
                    {item.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
            <Dialog.Close asChild>
              <VsButton className="footer-button" onClick={() => onOpenChange(false)}>
                Cancel
              </VsButton>
            </Dialog.Close>
            <VsButton
              className="footer-button"
              onClick={() => {
                onExport(kind);
                onOpenChange(false);
              }}
            >
              <i className="codicon codicon-save" />
              Export
            </VsButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ExportDialog;