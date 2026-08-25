import { useCallback, useEffect, useState, type ReactNode } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { DBDatabaseTreeItem, ExtensionMessage, RealtimeTableColumn, RealtimeTableShape } from "@shared/extensionmessage/types";
import { useToast } from "../../../contexts/toastcontext/toast-context";
import { ConnectionTableComponentMainDiv } from "../../../styles/sidebarcomponentsstyles/connectioncomponentstyles/connectioncomponentstyle"

interface ExpandableFieldSectionProps {
    title: string;
    info?: string;
    children?: ReactNode;
}

/** A `.fields` section whose header toggles its body open/closed. */
const ExpandableFieldSection = ({ title, info, children }: ExpandableFieldSectionProps) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={`fields field-section${expanded ? "" : " collapsed"}`}>
            <div
                className="database-field-header field-section-header"
                onClick={() => setExpanded((prev) => !prev)}
            >
                <div>
                    <i className={`codicon codicon-chevron-down field-toggle-icon${expanded ? "" : " collapsed"}`} />
                </div>

                <div>
                    <i className="codicon codicon-table" />
                </div>
                <div>
                    <i> {title} </i>
                    <i className="field-info "> {info} </i>
                </div>
            </div>
            <div className="fields-body">
                <div className="fields-body-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

/** Flat row for a scalar column: name plus its dimmed inferred type. */
const ColumnRow = ({ column }: { column: RealtimeTableColumn }) => (
    <div className="database-field-header field-item-row">
        <div>
            <i className="codicon codicon-table" />
        </div>
        <div>
            <i>{column.name}</i>
            <i className="field-info"> {column.type} </i>
        </div>
    </div>
);

/** Renders a nested object/array column as an expanding recursive section. */
const NestedColumnSection = ({ column }: { column: RealtimeTableColumn }) => {
    const [expanded, setExpanded] = useState(false);
    const children = column.children ?? [];

    return (
        <div className={`fields field-section${expanded ? "" : " collapsed"}`}>
            <div
                className="database-field-header field-section-header"
                onClick={() => setExpanded((prev) => !prev)}
            >
                <div>
                    <i className={`codicon codicon-chevron-down field-toggle-icon${expanded ? "" : " collapsed"}`} />
                </div>

                <div>
                    <i className="codicon codicon-table" />
                </div>
                <div>
                    <i>{column.name}</i>
                    <i className="field-info"> {column.type} </i>
                </div>
            </div>
            <div className="fields-body">
                <div className="fields-body-inner">
                    {children.length === 0 && <div className="field-note">No children</div>}
                    {children.map((child) =>
                        child.nested && (child.children?.length ?? 0) > 0
                            ? <NestedColumnSection key={child.name} column={child} />
                            : <ColumnRow key={child.name} column={child} />
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * An RTDB path rendered as an expanding "table". On first expand the raw
 * JSON under the path is converted host-side into columns / nested children
 * (`DB_GET_RTDB_TABLE_SHAPE` → `DB_RTDB_TABLE_SHAPE`) and cached here.
 */
const RealtimeTableSection = ({ name, path }: { name: string; path: string }) => {
    const [expanded, setExpanded] = useState(false);
    const [shape, setShape] = useState<RealtimeTableShape | null>(null);

    useEffect(() => {
        if (!expanded) { return; }
        const handle = (event: MessageEvent) => {
            const m = event.data as ExtensionMessage;
            if (m.type === ExtensionMessageType.DB_RTDB_TABLE_SHAPE && m.payload.path === path) {
                setShape(m.payload.shape);
            }
        };
        window.addEventListener("message", handle);
        return () => window.removeEventListener("message", handle);
    }, [expanded, path]);

    const toggle = () => {
        const next = !expanded;
        setExpanded(next);
        if (next && shape === null) {
            vscode._postMessage({
                messageType: WebviewMessageType.DB_GET_RTDB_TABLE_SHAPE,
                payload: { path },
            });
        }
    };

    const columns = shape?.columns ?? [];

    return (
        <div className={`fields field-section${expanded ? "" : " collapsed"}`}>
            <div className="database-field-header field-section-header" onClick={toggle}>
                <div>
                    <i
                        className={
                            expanded && shape === null
                                ? "codicon codicon-loading codicon-spin field-toggle-icon"
                                : `codicon codicon-chevron-down field-toggle-icon${expanded ? "" : " collapsed"}`
                        }
                    />
                </div>

                <div>
                    <i className="codicon codicon-table" />
                </div>
                <div>
                    <i>{name}</i>
                    <i className="field-info ">
                        {shape
                            ? `${shape.sampledRecords} ${shape.isCollection ? "records" : "record"} sampled`
                            : "data for fiels"}
                    </i>
                </div>
            </div>
            <div className="fields-body">
                <div className="fields-body-inner">
                    {expanded && !shape && <div className="field-note">loading…</div>}
                    {shape && columns.length === 0 && <div className="field-note">No columns found</div>}
                    {columns.map((column) =>
                        column.nested && (column.children?.length ?? 0) > 0
                            ? <NestedColumnSection key={column.name} column={column} />
                            : <ColumnRow key={column.name} column={column} />
                    )}
                </div>
            </div>
        </div>
    );
};

interface ConnectionTableComponentProps {
    /** Tree-section id to display, e.g. "rtdb" or "firestore". */
    sectionId?: string;
    /** Live data is fetched only while the owning connection is active. */
    active?: boolean;
    /** Notifies the parent dropdown so it can spin while tables load. */
    onLoadingChange?: (loading: boolean) => void;
}

const ConnectionTableComponent = ({ sectionId, active, onLoadingChange }: ConnectionTableComponentProps) => {
    const [items, setItems] = useState<DBDatabaseTreeItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);

    const { showToast } = useToast();

    // Backend failures surface as toasts instead of an inline banner.
    useEffect(() => {
        if (error) { showToast(error); }
    }, [error, showToast]);

    const isLoading = Boolean(sectionId) && Boolean(active) && items === null && !error;

    // Report loading up to the parent dropdown so IT can spin while we fetch.
    useEffect(() => {
        onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);

    const refresh = useCallback(() => {
        if (!sectionId || !active) { return; }
        vscode._postMessage({ messageType: WebviewMessageType.DB_GET_TREE });
    }, [sectionId, active]);

    useEffect(() => {
        if (!sectionId || !active) { return; }
        refresh();
        const handle = (event: MessageEvent) => {
            const m = event.data as ExtensionMessage;
            switch (m.type) {
                case ExtensionMessageType.DB_TREE: {
                    // Keep the tables sorted alphabetically regardless of host order.
                    const section = m.payload.sections.find((s) => s.id === sectionId);
                    setItems(section ? [...section.items].sort((a, b) => a.name.localeCompare(b.name)) : []);
                    setError(null);
                    setWarnings(m.payload.warnings ?? []);
                    break;
                }
                case ExtensionMessageType.DB_CONNECTED:
                    refresh();
                    break;
                case ExtensionMessageType.DB_ERROR:
                    setError(m.payload.error);
                    break;
            }
        };
        window.addEventListener("message", handle);
        return () => window.removeEventListener("message", handle);
    }, [sectionId, active, refresh]);

    // Legacy placeholder demo when no live section is bound.
    if (!sectionId) {
        return (
            <ConnectionTableComponentMainDiv>
                <div>
                    <div className="database-field-header">

                        <div>
                            <i className="codicon codicon-table" />
                        </div>
                        <div>
                            <i> Table </i>
                            <i className="field-info "> data for fiels </i>

                        </div>
                    </div>
                    <ExpandableFieldSection title="sample table" info="data for fiels">
                        <ExpandableFieldSection title="colums in sample tabel" info="data for fiels">
                            <ExpandableFieldSection title="colums in sample tabel" info="data for fiels" />
                        </ExpandableFieldSection>
                    </ExpandableFieldSection>
                </div>


            </ConnectionTableComponentMainDiv>
        );
    }

    // Inactive connection card → say so instead of silently rendering nothing.
    if (!active) {
        return (
            <ConnectionTableComponentMainDiv>
                <div className="field-note">
                    Not connected — press the plug icon on this card to load its tables.
                </div>
            </ConnectionTableComponentMainDiv>
        );
    }

    const showRealtimeTables = sectionId === "rtdb";

    return (
        <ConnectionTableComponentMainDiv>
            <div>
                <div className="database-field-header">

                    <div>
                        <i className="codicon codicon-table" />
                    </div>
                    <div>
                        <i> Tables </i>
                        {items !== null && <i className="field-info "> {items.length} </i>}
                    </div>
                </div>

                {warnings.map((warning) => (
                    <div key={warning} className="field-error">{warning}</div>
                ))}
                {!error && items === null && <div className="field-note">loading…</div>}
                {!error && items !== null && items.length === 0 && <div className="field-note">No tables yet</div>}

                {(items ?? []).map((item) =>
                    showRealtimeTables ? (
                        <RealtimeTableSection key={item.id} name={item.name} path={item.name} />
                    ) : (
                        <div key={item.id} className="database-field-header field-item-row">
                            <div>
                                <i className="codicon codicon-table" />
                            </div>
                            <div>
                                <i>{item.name}</i>
                                {item.meta && <i className="field-info">{item.meta}</i>}
                            </div>
                        </div>
                    )
                )}
            </div>


        </ConnectionTableComponentMainDiv>


    )
}


export default ConnectionTableComponent
