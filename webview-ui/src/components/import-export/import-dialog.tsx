import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { SchemaFormat } from "@lib/import-export";
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles";

/** Result emitted when the user confirms an import. */
export interface ImportResult {
  format: SchemaFormat;
  content: string;
  /** Whether the content came from pasted text vs a chosen file. */
  source: "file" | "paste" | "url";
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: ImportResult) => void;
  /** Resolves a native file picker (returns content or null). */
  onPickFile: (extensions: string[]) => Promise<string | null>;
  /** Fetches a live localhost URL (e.g. openapi.json). Returns text or null. */
  onFetchUrl?: (url: string) => Promise<string | null>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: "var(--vscode-input-background, #3c3c3c)",
  color: "var(--vscode-input-foreground, #cccccc)",
  border: "1px solid var(--vscode-input-border, #454545)",
  padding: "6px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  outline: "none",
  height: "30px",
};

const codeStyle: React.CSSProperties = {
  background: "var(--vscode-textCodeBlock-background, #2a2a2a)",
  color: "var(--vscode-textPreformat-foreground, #d4d4d4)",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "var(--vscode-editor-font-family, monospace)",
  fontSize: "12px",
  wordBreak: "break-all",
};

const FORMAT_TABS: Array<{ format: SchemaFormat; label: string }> = [
  { format: "sql", label: "SQL (.sql)" },
  { format: "dbml", label: "DBML (.dbml)" },
  { format: "json", label: "JSON (.json)" },
];

interface Instructions {
  title: string;
  steps: Array<{ heading: string; text?: string; command?: string }>;
}

const INSTRUCTIONS: Record<SchemaFormat, Instructions> = {
  dbml: {
    title: "DBML (Database Markup Language)",
    steps: [
      {
        heading: "Prisma users (schema.prisma)",
        text: "Use a converter to turn schema.prisma into DBML, or drag your .dbml file.",
        command: "npx @dbdocs/cli prisma2dbml schema.prisma -o schema.dbml",
      },
      {
        heading: "From the dbdiagram.io editor",
        text: 'Open dbdiagram.io → "Export" → "Export to DBML".',
      },
      {
        heading: "From a PostgreSQL database",
        text: "Generate DBML directly from a live database connection.",
        command: 'npx @dbdocs/cli db2dbml postgres "postgres://user:pass@localhost:5432/db" -o schema.dbml',
      },
      {
        heading: "Hand-written DBML",
        text: "Create a .dbml file with Table blocks and Ref relationships.",
        command: "Table users {\n  id int [pk]\n  email varchar [unique]\n}",
      },
    ],
  },
  sql: {
    title: "SQL (DDL — schema only)",
    steps: [
      {
        heading: "PostgreSQL",
        command: "pg_dump -U username -d dbname --schema-only > schema.sql",
      },
      {
        heading: "MySQL / MariaDB",
        command: "mysqldump -u username -p dbname --no-data > schema.sql",
      },
      {
        heading: "SQLite",
        command: 'sqlite3 database.sqlite ".schema" > schema.sql',
      },
      {
        heading: "GUI (TablePlus / pgAdmin / DBeaver)",
        text: 'Right-click database → Export / Backup → choose "Schema Only" or "DDL".',
      },
    ],
  },
  json: {
    title: "JSON (sample documents or extracted schema)",
    steps: [
      {
        heading: "FastAPI / OpenAPI (live)",
        text: "Fetch your running app's auto-generated schema directly from a URL.",
        command: "http://localhost:8000/openapi.json",
      },
      {
        heading: "SQLAlchemy / FastAPI (Python script)",
        text: "Drop this script in your project and run it to emit schema.json.",
        command:
          'python -c "\\nimport json, sqlalchemy\\nfrom my_app.database import Base\\nprint(json.dumps({\'entities\': [{\'id\': t.name, \'name\': t.name, \'fields\': [{\'name\': c.name, \'type\': str(c.type), \'isPrimary\': c.primary_key, \'isForeign\': bool(c.foreign_keys)}] for c in t.columns]} for t in Base.metadata.tables.values()]}, indent=2))" > schema.json',
      },
      {
        heading: "Mongoose / Node.js (script)",
        text: "Export all registered Mongoose models to schema.json.",
        command: 'node -e "const fs=require(\'fs\');const mongoose=require(\'mongoose\');require(\'./models/User\');require(\'./models/Order\');const e=Object.entries(mongoose.models).map(([n,m])=>({id:n,name:n,type:\'collection\',fields:[...m.schema.paths].filter(([p])=>p!==\'__v\').map(([p])=>({name:p,type:\'String\',isPrimary:p===\'_id\'}))]}));fs.writeFileSync(\'schema.json\',JSON.stringify({entities:e},null,2));"',
      },
      {
        heading: "Django",
        command: "python manage.py inspectdb > models.py",
      },
      {
        heading: "MongoDB (mongoexport)",
        command: "mongoexport --db dbname --collection users --limit=5 --out users.json",
      },
      {
        heading: "Any JSON shape",
        text: "A JSON array of documents, or a dictionary mapping collection names to arrays.",
      },
    ],
  },
};

const ImportDialog = ({
  open,
  onOpenChange,
  onImport,
  onPickFile,
  onFetchUrl,
}: ImportDialogProps) => {
  const [format, setFormat] = useState<SchemaFormat>("sql");
  const [pasteContent, setPasteContent] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const extensionFor = (f: SchemaFormat) =>
    f === "dbml" ? ["dbml", "prisma"] : [f];

  const handlePickFile = async () => {
    setError("");
    setBusy(true);
    try {
      const content = await onPickFile(extensionFor(format));
      if (content !== null) {
        onImport({ format, content, source: "file" });
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFetchUrl = async () => {
    if (!onFetchUrl) return;
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const content = await onFetchUrl(trimmed);
      if (content !== null) {
        onImport({ format: "json", content, source: "url" });
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasteImport = () => {
    if (!pasteContent.trim()) {
      setError("Paste schema content before importing");
      return;
    }
    onImport({ format, content: pasteContent, source: "paste" });
    onOpenChange(false);
  };

  const instructions = INSTRUCTIONS[format];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setPasteContent("");
          setUrl("");
          setError("");
        }
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
            width: "640px",
            maxWidth: "92%",
            maxHeight: "88vh",
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
            }}
          >
            Import Database Schema
          </Dialog.Title>

          {/* Format tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {FORMAT_TABS.map((tab) => (
              <VsButton
                key={tab.format}
                className={format === tab.format ? "active" : ""}
                style={{ padding: "6px 12px", width: "auto" }}
                onClick={() => {
                  setFormat(tab.format);
                  setError("");
                }}
              >
                {tab.label}
              </VsButton>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Upload */}
            <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--vscode-descriptionForeground, #999)" }}>
                Choose a file
              </span>
              <VsButton
                className="footer-button"
                style={{ width: "fit-content" }}
                onClick={handlePickFile}
              >
                <i className="codicon codicon-folder-opened" />
                Browse {format.toUpperCase()} file
              </VsButton>
            </section>

            {/* Live URL (OpenAPI/JSON) */}
            {onFetchUrl && (
              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--vscode-descriptionForeground, #999)" }}>
                  Fetch from a live localhost URL (FastAPI / OpenAPI)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://localhost:8000/openapi.json"
                    style={inputStyle}
                  />
                  <VsButton
                    className="footer-button"
                    style={{ flexShrink: 0 }}
                    onClick={handleFetchUrl}
                  >
                    <i className="codicon codicon-cloud-download" />
                    Fetch
                  </VsButton>
                </div>
              </section>
            )}

            {/* Paste */}
            <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--vscode-descriptionForeground, #999)" }}>
                Or paste the {format.toUpperCase()} content
              </span>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={`Paste ${format.toUpperCase()} here…`}
                rows={6}
                style={{
                  ...inputStyle,
                  height: "auto",
                  resize: "vertical",
                  fontFamily: "var(--vscode-editor-font-family, monospace)",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <VsButton className="footer-button" onClick={handlePasteImport}>
                  Import pasted content
                </VsButton>
              </div>
            </section>

            {/* Generation instructions */}
            <section
              style={{
                borderTop: "1px solid var(--vscode-editorWidget-border, #454545)",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--vscode-descriptionForeground, #999)" }}>
                How to generate a {instructions.title} file
              </span>
              {instructions.steps.map((step) => (
                <div key={step.heading} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    {step.heading}
                  </span>
                  {step.text && (
                    <span style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground, #999)" }}>
                      {step.text}
                    </span>
                  )}
                  {step.command && (
                    <code style={codeStyle}>{step.command}</code>
                  )}
                </div>
              ))}
            </section>

            {error && (
              <p style={{ margin: 0, color: "var(--vscode-errorForeground, #f48771)", fontSize: "13px" }}>
                {error}
              </p>
            )}
            {busy && (
              <p style={{ margin: 0, color: "var(--vscode-descriptionForeground, #999)", fontSize: "13px" }}>
                Working…
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <Dialog.Close asChild>
              <VsButton className="footer-button" onClick={() => onOpenChange(false)}>
                Cancel
              </VsButton>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImportDialog;