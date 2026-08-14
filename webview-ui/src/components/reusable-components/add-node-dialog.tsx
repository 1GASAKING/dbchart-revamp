import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { DesignField, FieldDataType } from "@dbchart/schema";
import { createDesignField, DATA_TYPES, validateSchemaName, getSchemaNameErrorMessage } from "@lib/utils";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

/** Data emitted when the user confirms the Create Table dialog. */
export interface AddNodeFormData {
  label: string;
  kind: "table" | "view";
  fields: DesignField[];
}

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddNodeFormData) => void;
  /** Existing schema node labels, used to reject duplicate names. */
  existingLabels?: { id: string; label: string }[];
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const defaultFields = (): DesignField[] => [
  createDesignField({ name: "id", dataType: "int" }),
];

interface AddNodeFormProps {
  onCancel: () => void;
  onSubmit: (data: AddNodeFormData) => void;
  existingLabels: { id: string; label: string }[];
}

const AddNodeForm = ({ onCancel, onSubmit, existingLabels }: AddNodeFormProps) => {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"table" | "view">("table");
  const [fields, setFields] = useState<DesignField[]>(defaultFields);
  const [error, setError] = useState("");

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      createDesignField({ name: `column_${prev.length + 1}`, dataType: "varchar" }),
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateField = (
    id: string,
    patch: Partial<Pick<DesignField, "name" | "dataType">>
  ) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const handleSubmit = () => {
    const error = validateSchemaName(label, "", existingLabels);
    if (error) {
      setError(getSchemaNameErrorMessage(error));
      return;
    }
    onSubmit({
      label: label.trim(),
      kind,
      fields: fields.filter((f) => f.name.trim() !== ""),
    });
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "13px",
            color: "var(--vscode-descriptionForeground, #999)",
          }}
        >
          Table name
          <input
            autoFocus
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setError("");
            }}
            placeholder="e.g. users"
            style={inputStyle}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "13px",
            color: "var(--vscode-descriptionForeground, #999)",
          }}
        >
          Kind
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "table" | "view")}
            style={selectStyle}
          >
            <option value="table">Table</option>
            <option value="view">View</option>
          </select>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "var(--vscode-descriptionForeground, #999)",
              }}
            >
              Columns
            </span>
            <VsButton className="footer-button" onClick={handleAddField}>
              <i className="codicon codicon-add" />
              Add column
            </VsButton>
          </div>

          {fields.map((field) => (
            <div
              key={field.id}
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <input
                value={field.name}
                onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                placeholder="Column name"
                style={inputStyle}
              />
              <select
                value={field.dataType}
                onChange={(e) =>
                  handleUpdateField(field.id, { dataType: e.target.value as FieldDataType })
                }
                style={selectStyle}
              >
                {DATA_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
              <VsButton
                className="delete-button"
                title="Remove column"
                style={{ width: "30px", flexShrink: 0 }}
                onClick={() => handleRemoveField(field.id)}
              >
                <i className="codicon codicon-trash" />
              </VsButton>
            </div>
          ))}
        </div>

        {error && (
          <p
            style={{
              margin: 0,
              color: "var(--vscode-errorForeground, #f48771)",
              fontSize: "13px",
            }}
          >
            {error}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        <Dialog.Close asChild>
          <VsButton className="footer-button" onClick={onCancel}>
            Cancel
          </VsButton>
        </Dialog.Close>
        <VsButton className="footer-button" onClick={handleSubmit}>
          Create
        </VsButton>
      </div>
    </>
  );
};

const AddNodeDialog = ({ open, onOpenChange, onSubmit, existingLabels = [] }: AddNodeDialogProps) => {
  const [formId, setFormId] = useState(0);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setFormId((id) => id + 1);
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
            width: "540px",
            maxWidth: "90%",
            maxHeight: "85vh",
            overflowY: "auto",
            zIndex: 10000,
            color: "var(--vscode-editor-foreground, #cccccc)",
          }}
        >
          <Dialog.Title
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--vscode-editor-foreground, #cccccc)",
            }}
          >
            Create Table
          </Dialog.Title>

          <AddNodeForm
            key={formId}
            onCancel={() => onOpenChange(false)}
            existingLabels={existingLabels}
            onSubmit={(data) => {
              onSubmit(data);
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddNodeDialog;