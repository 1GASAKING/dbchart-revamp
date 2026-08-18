import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { SchemaNode } from "@dbchart/schema";
import { validateSchemaName, getSchemaNameErrorMessage } from "@lib/utils";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The node being renamed. */
  node: SchemaNode;
  /** All labels, used to reject duplicates. */
  existingLabels: { id: string; label: string }[];
  onSubmit: (label: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: "var(--vscode-input-background, #3c3c3c)",
  color: "var(--vscode-input-foreground, #cccccc)",
  border: "1px solid var(--vscode-input-border, #454545)",
  padding: "6px 8px",
  fontSize: "14px",
  borderRadius: "4px",
  outline: "none",
  height: "30px",
};

const EditTableDialog = ({ open, onOpenChange, node, existingLabels, onSubmit }: EditTableDialogProps) => {
  const [label, setLabel] = useState(node.label);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const err = validateSchemaName(label, node.id, existingLabels);
    if (err) {
      setError(getSchemaNameErrorMessage(err));
      return;
    }
    onSubmit(label.trim());
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setLabel(node.label);
          setError("");
        }
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
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
            width: "400px",
            maxWidth: "90%",
            zIndex: 10000,
            color: "var(--vscode-editor-foreground, #cccccc)",
          }}
        >
          <Dialog.Title style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>
            Edit Table
          </Dialog.Title>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              Table name
              <input
                autoFocus
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError("");
                }}
                style={inputStyle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </label>

            {error && (
              <p style={{ margin: 0, color: "var(--vscode-errorForeground, #f48771)", fontSize: "13px" }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
            <Dialog.Close asChild>
              <VsButton className="footer-button" onClick={() => onOpenChange(false)}>
                Cancel
              </VsButton>
            </Dialog.Close>
            <VsButton className="footer-button" onClick={handleSubmit}>
              Save
            </VsButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditTableDialog;