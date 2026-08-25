import { CATEGORY_ORDER } from "./db-connection-types";
import type { DatabaseDefinition, SavedConnection } from "./db-connection-types";
import DbIcon from "./db-icon";

const SEARCH_STYLES: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-input-border)",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  marginBottom: "12px",
};

const CATEGORY_STYLES: React.CSSProperties = {
  marginBottom: "16px",
};

const CATEGORY_HEADER_STYLES: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--vscode-descriptionForeground)",
  marginBottom: "8px",
  letterSpacing: "0.5px",
};

const DB_GRID_STYLES: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "6px",
};

const DB_ITEM_STYLES: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid var(--vscode-panel-border)",
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  color: "var(--vscode-foreground)",
  textAlign: "left",
};

const PREVIEW_BADGE: React.CSSProperties = {
  fontSize: "9px",
  background: "var(--vscode-badge-background)",
  color: "var(--vscode-badge-foreground)",
  padding: "1px 4px",
  borderRadius: "3px",
  marginLeft: "4px",
};

const SAVED_CONNECTION_STYLES: React.CSSProperties = {
  marginBottom: "16px",
  padding: "8px",
  border: "1px solid var(--vscode-panel-border)",
  borderRadius: "4px",
};

const SAVED_ITEM_STYLES: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 8px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const SAVED_ITEM_HOVER: React.CSSProperties = {
  ...SAVED_ITEM_STYLES,
  background: "var(--vscode-list-hoverBackground)",
};

const ICON_BUTTON_STYLES: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  padding: 0,
  cursor: "pointer",
  background: "transparent",
  color: "var(--vscode-foreground)",
  border: "1px solid transparent",
  borderRadius: "4px",
  fontSize: "13px",
};

interface Props {
  databases: DatabaseDefinition[];
  savedConnections: SavedConnection[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectDb: (db: DatabaseDefinition) => void;
  onConnectSaved: (connectionId: string) => void;
  onEditSaved: (conn: SavedConnection) => void;
  onDeleteSaved: (connectionId: string) => void;
}

/** View 1 - "New Connection" default view: pick a database (or a saved connection). */
export const DbConnectionSelectStep = ({
  databases,
  savedConnections,
  searchTerm,
  onSearchChange,
  onSelectDb,
  onConnectSaved,
  onEditSaved,
  onDeleteSaved,
}: Props) => {
  const filteredDatabases = databases.filter((db) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return db.name.toLowerCase().includes(term) || db.category.toLowerCase().includes(term);
  });

  const groupedDatabases = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    dbs: filteredDatabases.filter((db) => db.category === cat),
  })).filter((g) => g.dbs.length > 0);

  return (
    <>
      {savedConnections.length > 0 && (
        <div style={SAVED_CONNECTION_STYLES}>
          <div style={CATEGORY_HEADER_STYLES}>Saved Connections</div>
          {savedConnections.map((conn) => (
            <div
              key={conn.id}
              style={SAVED_ITEM_STYLES}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, SAVED_ITEM_HOVER)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, SAVED_ITEM_STYLES)}
            >
              <span style={{ cursor: "pointer", flex: 1 }} onClick={() => onConnectSaved(conn.id)}>
                <DbIcon
                  databaseId={conn.databaseId}
                  size={14}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                {conn.name}
              </span>
              <span style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
                {conn.databaseId}
              </span>
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <button onClick={() => onEditSaved(conn)} title="Edit" style={ICON_BUTTON_STYLES}>
                  <i className="codicon codicon-edit" />
                </button>
                <button onClick={() => onDeleteSaved(conn.id)} title="Delete" style={ICON_BUTTON_STYLES}>
                  <i className="codicon codicon-trash" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Search databases..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        style={SEARCH_STYLES}
      />

      {groupedDatabases.map(({ category, dbs }) => (
        <div key={category} style={CATEGORY_STYLES}>
          <div style={CATEGORY_HEADER_STYLES}>{category}</div>
          <div style={DB_GRID_STYLES}>
            {dbs.map((db) => (
              <button key={db.id} style={DB_ITEM_STYLES} onClick={() => onSelectDb(db)}>
                <DbIcon databaseId={db.id} size={14} />
                <span>{db.name}</span>
                {db.preview && <span style={PREVIEW_BADGE}>Preview</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};