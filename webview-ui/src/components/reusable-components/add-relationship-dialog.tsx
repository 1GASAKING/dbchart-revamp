import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { DesignField } from "@dbchart/schema";
import type { DesignFlowNode } from "../../types/schema-node-ui";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

/** Data emitted when the user confirms the Create Relationship dialog. */
export interface RelationshipFormData {
  sourceNodeId: string;
  sourceFieldId: string;
  targetNodeId: string;
  targetFieldId: string;
}

interface AddRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: DesignFlowNode[];
  onSubmit: (data: RelationshipFormData) => void;
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

const connectableFields = (fields: DesignField[] | undefined) =>
  (fields ?? []).filter((f) => f.connectable !== false);

const AddRelationshipDialog = ({
  open,
  onOpenChange,
  nodes,
  onSubmit,
}: AddRelationshipDialogProps) => {
  const nodeOptions = nodes
    .map((n) => ({
      id: n.id,
      label: n.data?.node?.label ?? n.id,
      fields: n.data?.node?.fields ?? [],
    }))
    .filter((n) => connectableFields(n.fields).length > 0);

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
            width: "480px",
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
            Create Relationship
          </Dialog.Title>

          <RelationshipForm
            key={formId}
            nodeOptions={nodeOptions}
            onCancel={() => onOpenChange(false)}
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

interface NodeOption {
  id: string;
  label: string;
  fields: DesignField[];
}

interface RelationshipFormProps {
  nodeOptions: NodeOption[];
  onCancel: () => void;
  onSubmit: (data: RelationshipFormData) => void;
}

const RelationshipForm = ({
  nodeOptions,
  onCancel,
  onSubmit,
}: RelationshipFormProps) => {
  const [sourceNodeId, setSourceNodeId] = useState(nodeOptions[0]?.id ?? "");
  const [targetNodeId, setTargetNodeId] = useState(
    nodeOptions[1]?.id ?? nodeOptions[0]?.id ?? ""
  );

  const sourceNode = nodeOptions.find((n) => n.id === sourceNodeId);
  const targetNode = nodeOptions.find((n) => n.id === targetNodeId);

  const [sourceFieldId, setSourceFieldId] = useState(
    connectableFields(sourceNode?.fields)[0]?.id ?? ""
  );
  const [targetFieldId, setTargetFieldId] = useState(
    connectableFields(targetNode?.fields)[0]?.id ?? ""
  );
  const [error, setError] = useState("");

  const handleSourceNodeChange = (id: string) => {
    setSourceNodeId(id);
    const node = nodeOptions.find((n) => n.id === id);
    setSourceFieldId(connectableFields(node?.fields)[0]?.id ?? "");
    setError("");
  };

  const handleTargetNodeChange = (id: string) => {
    setTargetNodeId(id);
    const node = nodeOptions.find((n) => n.id === id);
    setTargetFieldId(connectableFields(node?.fields)[0]?.id ?? "");
    setError("");
  };

  const handleSubmit = () => {
    if (!sourceNodeId || !targetNodeId) {
      setError("Select both source and target");
      return;
    }
    if (sourceNodeId === targetNodeId) {
      setError("Source and target must be different");
      return;
    }
    if (!sourceFieldId || !targetFieldId) {
      setError("Both source and target fields are required");
      return;
    }
    onSubmit({ sourceNodeId, sourceFieldId, targetNodeId, targetFieldId });
  };

  const sourceFields = connectableFields(sourceNode?.fields);
  const targetFields = connectableFields(targetNode?.fields);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "var(--vscode-descriptionForeground, #999)",
            }}
          >
            Source
          </span>
          <select
            value={sourceNodeId}
            onChange={(e) => handleSourceNodeChange(e.target.value)}
            style={selectStyle}
          >
            {nodeOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <select
            value={sourceFieldId}
            onChange={(e) => setSourceFieldId(e.target.value)}
            style={selectStyle}
          >
            {sourceFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.dataType})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "var(--vscode-descriptionForeground, #999)",
            }}
          >
            Target
          </span>
          <select
            value={targetNodeId}
            onChange={(e) => handleTargetNodeChange(e.target.value)}
            style={selectStyle}
          >
            {nodeOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <select
            value={targetFieldId}
            onChange={(e) => setTargetFieldId(e.target.value)}
            style={selectStyle}
          >
            {targetFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.dataType})
              </option>
            ))}
          </select>
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

export default AddRelationshipDialog;