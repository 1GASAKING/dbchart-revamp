import { getDbIcon } from "./db-connection-icons";
import type { ConnectionFieldDef, DatabaseDefinition, Group } from "./db-connection-types";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

const FIELD_GROUP_STYLES: React.CSSProperties = { marginBottom: "12px" };
const FIELD_GROUP_TITLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--vscode-descriptionForeground)",
  marginBottom: "8px",
};
const FIELD_STYLES: React.CSSProperties = { marginBottom: "10px" };
const LABEL_STYLES: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  marginBottom: "4px",
  color: "var(--vscode-foreground)",
};
const INPUT_STYLES: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-input-border)",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  fontSize: "12px",
};
const HELP_STYLES: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--vscode-descriptionForeground)",
  marginTop: "2px",
};
const PREVIEW_BADGE: React.CSSProperties = {
  fontSize: "9px",
  background: "var(--vscode-badge-background)",
  color: "var(--vscode-badge-foreground)",
  padding: "1px 4px",
  borderRadius: "3px",
  marginLeft: "4px",
};
const BACK_BUTTON_STYLES: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  cursor: "pointer",
  background: "transparent",
  color: "var(--vscode-foreground)",
  border: "1px solid var(--vscode-panel-border)",
  borderRadius: "4px",
  fontSize: "12px",
};
const FORM_STYLES: React.CSSProperties = {
  marginTop: "16px",
  borderTop: "1px solid var(--vscode-panel-border)",
  paddingTop: "16px",
};
const FOOTER_STYLES: React.CSSProperties = {
  padding: "12px 16px",
  borderTop: "1px solid var(--vscode-panel-border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};
const BROWSE_BUTTON_STYLES: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "5px 10px",
  cursor: "pointer",
  background: "var(--vscode-button-secondaryBackground, transparent)",
  color: "var(--vscode-button-secondaryForeground, var(--vscode-foreground))",
  border: "1px solid var(--vscode-button-border, var(--vscode-panel-border))",
  borderRadius: "4px",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

interface Props {
  selectedDb: DatabaseDefinition;
  groups: Group[];
  editingId: string | null;
  formValues: Record<string, unknown>;
  groupedFields: Record<string, ConnectionFieldDef[]>;
  testResult: { success: boolean; message: string; details?: Record<string, unknown> } | null;
  testing: boolean;
  connecting: boolean;
  onBack: () => void;
  onFieldChange: (key: string, value: unknown) => void;
  onBrowse: (field: ConnectionFieldDef) => void;
  onProjectChange: (value: string | undefined) => void;
  onTest: () => void;
  onSave: () => void;
  onConnect: () => void;
}

/** View 2 - "Setup <db>" view: connection config form + Test/Save/Connect actions. */
export const DbConnectionConfigStep = ({
  selectedDb,
  groups,
  editingId,
  formValues,
  groupedFields,
  testResult,
  testing,
  connecting,
  onBack,
  onFieldChange,
  onBrowse,
  onProjectChange,
  onTest,
  onSave,
  onConnect,
}: Props) => {
  const dbIcon = getDbIcon(selectedDb.id);

  return (
    <>
      <button onClick={onBack} style={BACK_BUTTON_STYLES}>
        <i className="codicon codicon-arrow-left" /> Back
      </button>
      {groupedFields? "Dd":"hdhshdhd"}

      <div style={FORM_STYLES}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {dbIcon ? (
            <span style={{ width: 16, height: 16, display: "inline-flex", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: dbIcon }} />
          ) : (
            <i className="codicon codicon-database" />
          )}
          {selectedDb.name}
          {selectedDb.preview && <span style={PREVIEW_BADGE}>Preview</span>}
        </div>

        <div style={FIELD_STYLES}>
          <label style={LABEL_STYLES}>Connection name *</label>
          <input
            type="text"
            value={String(formValues["name"] ?? "")}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="My Connection"
            style={INPUT_STYLES}
          />
        </div>

        {groups.length > 0 && (
          <div style={FIELD_STYLES}>
            <label style={LABEL_STYLES}>Group</label>
            <select
              value={String(formValues["groupId"] ?? "")}
              onChange={(e) => onProjectChange(e.target.value || undefined)}
              style={INPUT_STYLES}
            >
              <option value="">No group</option>
              {groups.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {Object.entries(groupedFields).map(([group, fields]) => (
          <div key={group} style={FIELD_GROUP_STYLES}>
            <div style={FIELD_GROUP_TITLE}>{group}</div>
            {fields.map((field) => (
              <div key={field.key} style={FIELD_STYLES}>
                <label style={LABEL_STYLES}>
                  {field.label}
                  {field.required && " *"}
                </label>
                {field.type === "select" ? (
                  <select
                    value={String(formValues[field.key] ?? field.defaultValue ?? "")}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    style={INPUT_STYLES}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(formValues[field.key] ?? field.defaultValue ?? false)}
                    onChange={(e) => onFieldChange(field.key, e.target.checked)}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    value={String(formValues[field.key] ?? "")}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    style={INPUT_STYLES}
                  />
                ) : field.type === "file" ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      value={String(formValues[field.key] ?? "")}
                      onChange={(e) => onFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={INPUT_STYLES}
                    />
                    <button type="button" onClick={() => onBrowse(field)} style={BROWSE_BUTTON_STYLES}>
                      <i className="codicon codicon-folder-opened" /> Browse
                    </button>
                  </div>
                ) : field.type === "json" ? (
                  <div>
                    <textarea
                      value={String(formValues[field.key] ?? "")}
                      onChange={(e) => onFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder ?? "Paste JSON here, or choose a file"}
                      rows={5}
                      style={{ ...INPUT_STYLES, fontFamily: "monospace" }}
                    />
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                      <button type="button" onClick={() => onBrowse(field)} style={BROWSE_BUTTON_STYLES}>
                        <i className="codicon codicon-folder-opened" /> Choose JSON file
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                    value={String(formValues[field.key] ?? "")}
                    onChange={(e) =>
                      onFieldChange(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                    placeholder={field.placeholder}
                    style={INPUT_STYLES}
                  />
                )}
                {field.helpText && <div style={HELP_STYLES}>{field.helpText}</div>}
              </div>
            ))}
          </div>
        ))}

        {testResult && testResult.success && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
              background: "var(--vscode-testing-iconPassedForeground)",
              color: "var(--vscode-editor-background)",
            }}
          >
            {testResult.message}
          </div>
        )}
      </div>

      <div style={FOOTER_STYLES}>
        <VsButton onClick={onTest} $disabled={testing}>
          <i className="codicon codicon-debug-start" /> {testing ? "Testing..." : "Test"}
        </VsButton>
        <VsButton onClick={onSave}>
          <i className="codicon codicon-save" /> {editingId ? "Update" : "Save"}
        </VsButton>
        <VsButton onClick={onConnect} $disabled={connecting}>
          <i className="codicon codicon-plug" /> {connecting ? "Connecting..." : "Connect"}
        </VsButton>
      </div>
    </>
  );
};